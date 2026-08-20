<?php
/**
 * Ameen Portal – MySQL API (PDO)
 *
 * Endpoints:
 *   GET  ?endpoint=fetch-data   → returns all tables as JSON
 *   POST ?endpoint=update-data  → INSERT / UPDATE
 *   DELETE ?endpoint=update-data → DELETE
 *
 * Table routing is inferred from the `type` key in the request body:
 *   type=member      → members
 *   type=transaction → transactions
 *   type=expense     → expenses
 *   type=investment  → investments
 *   type=stake       → stakes
 *   type=transfer    → transfers
 *   type=admin       → admins
 *
 * For DELETE, if body contains action=clear_all → truncate all tables.
 */

// ─── CORS & Preflight ────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma, Expires, X-Request-Time, If-None-Match');
header('Access-Control-Expose-Headers: ETag');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Set a default timezone to prevent warnings
date_default_timezone_set('UTC');

// ─── Error Logging ────────────────────────────────────────────
function log_error(string $message): void {
    $logFile = __DIR__ . '/api_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $requestInfo = [
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI'],
        'body' => file_get_contents('php://input')
    ];
    $logMessage = "[{$timestamp}] {$message} | Request: " . json_encode($requestInfo) . "\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// ─── Database config ──────────────────────────────────────────
$db_host = '127.0.0.1'; // Use 127.0.0.1 instead of 'localhost' to bypass slow socket lookups
$db_name = 'madanime_ameen';
$db_user = 'madanime_ameen';
$db_pass = 'Pandikasala!1!1';

// ─── PDO connection ───────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", 
        $db_user, 
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5 // Force a timeout after 5 seconds instead of pending forever
        ]
    );
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database Timeout: ' . $e->getMessage()]);
    exit;
}

// ─── Helpers ──────────────────────────────────────────────────

/** Map a `type` value to its table name */
function typeToTable(string $type): ?string {
    $map = [
        'member'      => 'members',
        'transaction' => 'transactions',
        'expense'     => 'expenses',
        'investment'  => 'investments',
        'stake'       => 'stakes',
        'transfer'    => 'transfers',
        'admin'       => 'admins',
    ];
    return $map[$type] ?? null;
}

/** Detect table from various body fields (fallback logic) */
function detectTable(array $body): ?string {
    // Explicit type field
    if (!empty($body['type'])) {
        $t = typeToTable($body['type']);
        if ($t) return $t;
    }

    // Field heuristics for identifying the table
    if (isset($body['memberId']) && isset($body['receiptNo'])) return 'transactions';
    if (isset($body['memberId']) && isset($body['investmentId'])) return 'stakes';
    if (isset($body['capitalDeployed']) || isset($body['profitEntries'])) return 'investments';
    if (isset($body['batchId']) && isset($body['transactionIds'])) return 'transfers';
    if (isset($body['category']) && isset($body['addedBy'])) return 'expenses';
    if (isset($body['password']) && isset($body['mobile']) && isset($body['role'])) return 'members';
    if (isset($body['isCollector']) || isset($body['registrationFeePaid'])) return 'members';

    // Fallback: if `sheet` is set but no type, treat as members (legacy compat)
    return null;
}

/** Fetch all data across every table */
function fetchAll(PDO $pdo): array {
    $tables = [
        'members',
        'admins',
        'transactions',
        'investments',
        'stakes',
        'transfers',
        'expenses',
    ];

    $result = [];
    foreach ($tables as $tbl) {
try {
    $stmt = $pdo->query("SELECT * FROM `{$tbl}`");
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    log_error("Failed to fetch from table {$tbl}: " . $e->getMessage());
    // Return an empty array for this table on failure
    $rows = [];
}

        // Post-process: decode JSON columns
        if ($tbl === 'investments') {
            foreach ($rows as &$row) {
                $row['profitEntries'] = json_decode($row['profitEntries'] ?? '[]', true) ?: [];
            }
            unset($row);
        }
        if ($tbl === 'transfers') {
            foreach ($rows as &$row) {
                $row['transactionIds'] = json_decode($row['transactionIds'] ?? '[]', true) ?: [];
            }
            unset($row);
        }

        // Convert tinyint booleans
        $boolCols = detectBoolColumns($tbl);
        foreach ($rows as &$row) {
            foreach ($boolCols as $col) {
                if (array_key_exists($col, $row)) {
                    $row[$col] = (bool) $row[$col];
                }
            }
            // Convert datetime fields to ISO strings
            if (isset($row['joinedAt']) && $row['joinedAt']) $row['joinedAt'] = date('c', strtotime($row['joinedAt']));
            if (isset($row['paidAt'])   && $row['paidAt'])   $row['paidAt']   = date('c', strtotime($row['paidAt']));
            if (isset($row['date'])     && $row['date'])     $row['date']     = date('c', strtotime($row['date']));
            if (isset($row['transferredAt']) && $row['transferredAt']) $row['transferredAt'] = date('c', strtotime($row['transferredAt']));
        }
        unset($row);

        $result[$tbl] = $rows;
    }

    // Frontend expects pendingSignups (empty by default in MySQL mode)
    $result['pendingSignups'] = [];

    return $result;
}

/** Return list of tinyint(1) / boolean column names for a table */
function detectBoolColumns(string $table): array {
    $map = [
        'members'     => ['isCollector', 'registrationFeePaid'],
        'transactions' => ['transferredToTreasurer', 'approved'],
    ];
    return $map[$table] ?? [];
}

/**
 * Insert or upsert a row.
 * If the body contains an `id` that already exists → UPDATE, otherwise INSERT.
 */
function upsertRow(PDO $pdo, string $table, array $body): array {
    // Remove the `type` and `sheet` meta fields — not real columns
    unset($body['type'], $body['sheet']);

    // Encode JSON columns
    if ($table === 'investments' && isset($body['profitEntries']) && is_array($body['profitEntries'])) {
        $body['profitEntries'] = json_encode($body['profitEntries']);
    }
    if ($table === 'transfers' && isset($body['transactionIds']) && is_array($body['transactionIds'])) {
        $body['transactionIds'] = json_encode($body['transactionIds']);
    }

    $pk = ($table === 'stakes') ? ['memberId', 'investmentId'] : ['id'];

    // Check if row exists
    $pkConditions = [];
    $pkValues = [];
    foreach ($pk as $col) {
        if (!isset($body[$col])) {
            return ['ok' => false, 'error' => "Missing primary key column: {$col}"];
        }
        $pkConditions[] = "`{$col}` = ?";
        $pkValues[] = $body[$col];
    }

    $checkSql = "SELECT 1 FROM `{$table}` WHERE " . implode(' AND ', $pkConditions) . " LIMIT 1";
try {
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute($pkValues);
    $exists = $checkStmt->fetch() !== false;
} catch (PDOException $e) {
    log_error("Upsert check failed for table {$table}: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during upsert check.'];
}

    if ($exists) {
        // UPDATE
        $sets = [];
        $values = [];
        foreach ($body as $col => $val) {
            if (in_array($col, $pk)) continue;
            $sets[] = "`{$col}` = ?";
            $values[] = $val;
        }
        if (empty($sets)) return ['ok' => true, 'action' => 'no_change'];
        $values = array_merge($values, $pkValues);
        $sql = "UPDATE `{$table}` SET " . implode(', ', $sets) . " WHERE " . implode(' AND ', $pkConditions);
try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    return ['ok' => true, 'action' => 'updated'];
} catch (PDOException $e) {
    log_error("Update failed for table {$table}: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during update.'];
}
    } else {
        // INSERT
        $cols = array_keys($body);
        $placeholders = array_fill(0, count($cols), '?');
        $sql = "INSERT INTO `{$table}` (" . implode(', ', array_map(fn($c) => "`{$c}`", $cols)) . ") VALUES (" . implode(', ', $placeholders) . ")";
try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($body));
    return ['ok' => true, 'action' => 'inserted'];
} catch (PDOException $e) {
    log_error("Insert failed for table {$table}: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during insert.'];
}
    }
}

/**
 * Delete rows. Supports:
 *   - { action: 'clear_all' } → truncate all tables
 *   - { id: '...' }           → delete by primary key
 */
function deleteRow(PDO $pdo, string $table, array $body): array {
    if (isset($body['action']) && $body['action'] === 'clear_all') {
        $tables = ['expenses', 'stakes', 'transfers', 'transactions', 'investments', 'members', 'admins'];
        foreach ($tables as $tbl) {
            try {
    $pdo->exec("DELETE FROM `{$tbl}`");
} catch (PDOException $e) {
    log_error("Failed to clear table {$tbl}: " . $e->getMessage());
    // Continue to next table
}
        }
        return ['ok' => true, 'action' => 'cleared_all'];
    }

    // For expenses, delete by id
    if ($table === 'expenses' && isset($body['id'])) {
try {
    $stmt = $pdo->prepare("DELETE FROM `expenses` WHERE `id` = ?");
    $stmt->execute([$body['id']]);
    return ['ok' => true, 'action' => 'deleted', 'affected' => $stmt->rowCount()];
} catch (PDOException $e) {
    log_error("Delete failed for table expenses: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during delete.'];
}
    }

    // For admins, delete by id
    if ($table === 'admins' && isset($body['id'])) {
try {
    $stmt = $pdo->prepare("DELETE FROM `admins` WHERE `id` = ?");
    $stmt->execute([$body['id']]);
    return ['ok' => true, 'action' => 'deleted', 'affected' => $stmt->rowCount()];
} catch (PDOException $e) {
    log_error("Delete failed for table admins: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during delete.'];
}
    }

    // For members, delete by id
    if ($table === 'members' && isset($body['id'])) {
try {
    $stmt = $pdo->prepare("DELETE FROM `members` WHERE `id` = ?");
    $stmt->execute([$body['id']]);
    $rowCount = $stmt->rowCount();
    // Also clean up related data
    $pdo->prepare("DELETE FROM `transactions` WHERE `memberId` = ?")->execute([$body['id']]);
    $pdo->prepare("DELETE FROM `stakes` WHERE `memberId` = ?")->execute([$body['id']]);
    return ['ok' => true, 'action' => 'deleted', 'affected' => $rowCount];
} catch (PDOException $e) {
    log_error("Delete failed for table members: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during delete.'];
}
    }

    // For transactions, delete by id
    if ($table === 'transactions' && isset($body['id'])) {
try {
    $stmt = $pdo->prepare("DELETE FROM `transactions` WHERE `id` = ?");
    $stmt->execute([$body['id']]);
    return ['ok' => true, 'action' => 'deleted', 'affected' => $stmt->rowCount()];
} catch (PDOException $e) {
    log_error("Delete failed for table transactions: " . $e->getMessage());
    return ['ok' => false, 'error' => 'Database query failed during delete.'];
}
    }

    return ['ok' => false, 'error' => 'Unable to determine what to delete for table: ' . $table];
}

// ─── Route request ────────────────────────────────────────────
$endpoint = $_GET['endpoint'] ?? '';
$method   = $_SERVER['REQUEST_METHOD'];

// Read body once
$bodyRaw  = file_get_contents('php://input');
$body     = json_decode($bodyRaw, true) ?: [];

try {
    if ($endpoint === 'fetch-data') {
        $data = fetchAll($pdo);
        // Simple ETag based on checksum of all rows
        $etag = md5(json_encode($data));

        // Support conditional GET (If-None-Match)
        $clientEtag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
        if ($clientEtag && $clientEtag === $etag) {
            http_response_code(304);
            exit;
        }

        header("ETag: \"{$etag}\"");
        echo json_encode(['success' => true, 'data' => $data, 'etag' => $etag]);

    } elseif ($endpoint === 'update-data') {
        if ($method === 'DELETE') {
            // Handle delete
            $table = detectTable($body);
            if (!$table) {
                // If body has action=clear_all, handle globally
                if (isset($body['action']) && $body['action'] === 'clear_all') {
                    $result = deleteRow($pdo, '', $body);
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Cannot determine table for delete']);
                    exit;
                }
            } else {
                $result = deleteRow($pdo, $table, $body);
            }
            echo json_encode(array_merge(['success' => true], $result));

        } else {
            // POST → insert or update
            $table = detectTable($body);
            if (!$table) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Cannot determine table for upsert', 'body' => $body]);
                exit;
            }
            $result = upsertRow($pdo, $table, $body);
            echo json_encode(array_merge(['success' => $result['ok']], $result));
        }

    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Unknown endpoint: ' . $endpoint]);
    }

} catch (Throwable $e) {
    log_error('Generic error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
