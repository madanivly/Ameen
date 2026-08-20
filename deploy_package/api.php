<?php
/**
 * Ameen Portal – MySQL API (PDO) with Auto-Migration & Admin Initializer
 *
 * Endpoints:
 *   GET  ?endpoint=fetch-data   → returns all tables as JSON
 *   POST ?endpoint=update-data  → INSERT / UPDATE / DELETE
 *
 * Auto-Migration feature:
 *   Dynamically detects and adds missing columns sent from the frontend.
 *
 * Admin Initializer feature:
 *   Automatically seeds a default admin account if the admins table is empty.
 */

// ─── Global Error Handlers (BEFORE anything else) ───────────────
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_STRICT])) {
        error_log("[FATAL] {$error['type']}: {$error['message']} in {$error['file']}:{$error['line']}");
        if (headers_sent() === false) {
            header('Content-Type: application/json');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error'   => 'A fatal server error occurred. Please try again later.',
        ]);
    }
});

set_exception_handler(function (Throwable $e) {
    error_log("[EXCEPTION] " . get_class($e) . ": {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}");
    if (headers_sent() === false) {
        header('Content-Type: application/json');
        http_response_code(500);
    }
    echo json_encode([
        'success' => false,
        'error'   => 'A server error occurred. Please try again later.',
    ]);
});

// Suppress inline errors — NEVER display on production
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/api_errors.log');
error_reporting(E_ALL);

// ─── CORS Headers ────────────────────────────────────────────────
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

// Prevent LiteSpeed / proxy caching of API responses
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle browser preflight checks instantly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// ─── Timezone ────────────────────────────────────────────────────
date_default_timezone_set('UTC');

// ─── Error Logging Helper ────────────────────────────────────────
function api_log(string $message): void {
    $logFile = __DIR__ . '/api_errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'CLI';
    $uri = $_SERVER['REQUEST_URI'] ?? 'N/A';
    $logMessage = "[{$timestamp}] {$message} | {$method} {$uri}\n";
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// ─── Database Connection (Bulletproof Singleton) ─────────────────
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // --- Resolve credentials ---
    $dbHost = (!empty($_SERVER['DB_HOST'])) ? $_SERVER['DB_HOST'] : ((!empty(getenv('DB_HOST'))) ? getenv('DB_HOST') : 'localhost');
    $dbName = (!empty($_SERVER['DB_NAME'])) ? $_SERVER['DB_NAME'] : ((!empty(getenv('DB_NAME'))) ? getenv('DB_NAME') : 'madanime_ameen');
    $dbUser = (!empty($_SERVER['DB_USER'])) ? $_SERVER['DB_USER'] : ((!empty(getenv('DB_USER'))) ? getenv('DB_USER') : 'madanime_ameen');
    
    // Explicit password fallback
    $dbPass = 'Pandikasala!1!1';
    if (!empty($_SERVER['DB_PASSWORD'])) {
        $dbPass = $_SERVER['DB_PASSWORD'];
    } elseif (!empty(getenv('DB_PASSWORD'))) {
        $dbPass = getenv('DB_PASSWORD');
    }

    // --- Validate ---
    if (empty($dbHost) || empty($dbName) || empty($dbUser) || empty($dbPass)) {
        api_log("Database configuration is incomplete.");
        throw new RuntimeException('Database configuration is incomplete.');
    }

    // --- Connect ---
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT            => 5,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        // Execute the default admin seeding check automatically right after connection
        initializeDefaultAdmin($pdo);
        
        return $pdo;
    } catch (PDOException $e) {
        api_log("Database connection failed: " . $e->getMessage());
        throw new RuntimeException('Database connection failed: ' . $e->getMessage());
    }
}

// ─── Default Admin Seeding Routine ───────────────────────────────
function initializeDefaultAdmin(PDO $pdo): void {
    try {
        // First ensure structural integrity of the admins table
        $stmt = $pdo->query("DESCRIBE `admins`");
        $existingFields = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Verify key columns exist to hold standard data credentials
        $requiredFields = ['username' => 'VARCHAR(50) NOT NULL', 'password' => 'VARCHAR(255) NOT NULL', 'name' => 'VARCHAR(100) NULL'];
        foreach ($requiredFields as $field => $definition) {
            if (!in_array($field, $existingFields)) {
                $pdo->exec("ALTER TABLE `admins` ADD COLUMN `{$field}` {$definition}");
            }
        }

        // Check if any admin user profile currently exists
        $checkCount = $pdo->query("SELECT COUNT(*) FROM `admins`")->fetchColumn();
        if ($checkCount == 0) {
            // Seed the missing base administrative credentials
            $insertStmt = $pdo->prepare("INSERT INTO `admins` (`id`, `username`, `password`, `name`) VALUES (?, ?, ?, ?)");
            $insertStmt->execute(['ADM001', 'admin', 'admin', 'System Administrator']);
            api_log("Admin Initialization: Successfully seeded default credentials (admin/admin)");
        }
    } catch (PDOException $e) {
        api_log("Admin Initialization Failure: " . $e->getMessage());
    }
}

// ─── Dynamic Schema Migration Guard ──────────────────────────────
function syncTableSchema(PDO $pdo, string $table, array $incomingKeys): void {
    try {
        // Fetch existing columns in target table
        $stmt = $pdo->query("DESCRIBE `{$table}`");
        $existingFields = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Filter keys that don't exist in the database table schema
        foreach ($incomingKeys as $key) {
            if (in_array($key, ['id', 'type', 'sheet', 'endpoint'])) continue;

            if (!in_array($key, $existingFields)) {
                $colType = "VARCHAR(255) NULL";
                if (strpos(strtolower($key), 'amount') !== false || strpos(strtolower($key), 'fee') !== false) {
                    $colType = "DECIMAL(10,2) NULL DEFAULT 0.00";
                } elseif (strpos(strtolower($key), 'date') !== false || strpos(strtolower($key), 'at') !== false) {
                    $colType = "DATETIME NULL";
                }

                $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `{$key}` {$colType}");
                api_log("Auto-Migration: Added missing column `{$key}` to table `{$table}`");
            }
        }
    } catch (PDOException $e) {
        api_log("Auto-Migration Failure on table {$table}: " . $e->getMessage());
    }
}

// ─── Type → Table Mapping ────────────────────────────────────────
function typeToTable(string $type): ?string {
    $map = [
        'member'             => 'members',
        'delete-member'      => 'members',
        'transaction'        => 'transactions',
        'delete-transaction' => 'transactions',
        'expense'            => 'expenses',
        'delete-expense'     => 'expenses',
        'delete-admin'       => 'admins',
        'delete-investment'  => 'investments',
        'investment'         => 'investments',
        'stake'              => 'stakes',
        'transfer'           => 'transfers',
        'admin'              => 'admins',
    ];
    return $map[$type] ?? null;
}

/** Detect table from various body fields */
function detectTable(array $body): ?string {
    if (!empty($body['type'])) {
        $t = typeToTable($body['type']);
        if ($t) return $t;
    }

    if (isset($body['memberId']) && isset($body['receiptNo'])) return 'transactions';
    if (isset($body['memberId']) && isset($body['investmentId'])) return 'stakes';
    if (isset($body['capitalDeployed']) || isset($body['profitEntries'])) return 'investments';
    if (isset($body['batchId']) && isset($body['transactionIds'])) return 'transfers';
    if (isset($body['category']) && isset($body['addedBy'])) return 'expenses';
    if (isset($body['password']) && isset($body['mobile']) && isset($body['role'])) return 'members';
    if (isset($body['isCollector']) || isset($body['registrationFeePaid'])) return 'members';

    return null;
}

// ─── Bool Column Map ─────────────────────────────────────────────
function detectBoolColumns(string $table): array {
    $map = [
        'members'      => ['isCollector', 'registrationFeePaid'],
        'transactions' => ['transferredToTreasurer', 'approved'],
    ];
    return $map[$table] ?? [];
}

// ─── Fetch All Data ──────────────────────────────────────────────
function fetchAll(PDO $pdo): array {
    $tables = ['members', 'admins', 'transactions', 'investments', 'stakes', 'transfers', 'expenses'];
    $result = [];

    foreach ($tables as $tbl) {
        try {
            $stmt = $pdo->query("SELECT * FROM `{$tbl}`");
            $rows = $stmt->fetchAll();
        } catch (PDOException $e) {
            api_log("Failed to fetch from table {$tbl}: " . $e->getMessage());
            throw new RuntimeException("Error fetching data from table: {$tbl}.");
        }

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

        $boolCols = detectBoolColumns($tbl);
        foreach ($rows as &$row) {
            foreach ($boolCols as $col) {
                if (array_key_exists($col, $row)) {
                    $row[$col] = (bool) $row[$col];
                }
            }
            if (isset($row['joinedAt']) && $row['joinedAt']) {
                $row['joinedAt'] = date('c', strtotime($row['joinedAt']));
            }
            if (isset($row['paidAt']) && $row['paidAt']) {
                $row['paidAt'] = date('c', strtotime($row['paidAt']));
            }
            if (isset($row['date']) && $row['date']) {
                $row['date'] = date('c', strtotime($row['date']));
            }
            if (isset($row['transferredAt']) && $row['transferredAt']) {
                $row['transferredAt'] = date('c', strtotime($row['transferredAt']));
            }
        }
        unset($row);

        $result[$tbl] = $rows;
    }

    $result['pendingSignups'] = [];
    return $result;
}

// ─── Upsert Row ──────────────────────────────────────────────────
function upsertRow(PDO $pdo, string $table, array $body): array {
    unset($body['type'], $body['sheet'], $body['endpoint']);

    // Fire schema check
    syncTableSchema($pdo, $table, array_keys($body));

    if ($table === 'investments' && isset($body['profitEntries']) && is_array($body['profitEntries'])) {
        $body['profitEntries'] = json_encode($body['profitEntries']);
    }
    if ($table === 'transfers' && isset($body['transactionIds']) && is_array($body['transactionIds'])) {
        $body['transactionIds'] = json_encode($body['transactionIds']);
    }

    $pk = ($table === 'stakes') ? ['memberId', 'investmentId'] : ['id'];

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
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute($pkValues);
    $exists = $checkStmt->fetch() !== false;

    if ($exists) {
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
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        return ['ok' => true, 'action' => 'updated'];
    } else {
        $cols = array_keys($body);
        $quotedCols = array_map(function ($c) { return "`{$c}`"; }, $cols);
        $placeholders = array_fill(0, count($cols), '?');
        $sql = "INSERT INTO `{$table}` (" . implode(', ', $quotedCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($body));
        return ['ok' => true, 'action' => 'inserted'];
    }
}

// ─── Delete Row ──────────────────────────────────────────────────
function deleteRow(PDO $pdo, string $table, array $body): array {
    if (isset($body['action']) && $body['action'] === 'clear_all') {
        $tables = ['expenses', 'stakes', 'transfers', 'transactions', 'investments', 'members', 'admins'];
        foreach ($tables as $tbl) {
            $pdo->exec("DELETE FROM `{$tbl}`");
        }
        return ['ok' => true, 'action' => 'cleared_all'];
    }

    if (!isset($body['id'])) {
        return ['ok' => false, 'error' => 'No id provided for delete'];
    }

    $id = $body['id'];

    if ($table === 'members') {
        $stmt = $pdo->prepare("DELETE FROM `members` WHERE `id` = ?");
        $stmt->execute([$id]);
        $rowCount = $stmt->rowCount();
        $pdo->prepare("DELETE FROM `transactions` WHERE `memberId` = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM `stakes` WHERE `memberId` = ?")->execute([$id]);
        return ['ok' => true, 'action' => 'deleted', 'affected' => $rowCount];
    }

    $stmt = $pdo->prepare("DELETE FROM `{$table}` WHERE `id` = ?");
    $stmt->execute([$id]);
    return ['ok' => true, 'action' => 'deleted', 'affected' => $stmt->rowCount()];
}

// ═══════════════════════════════════════════════════════════════════
// ─── Main Request Handler ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
try {
    $pdo = getDbConnection();

    $method   = $_SERVER['REQUEST_METHOD'];
    $bodyRaw  = file_get_contents('php://input');
    $body     = json_decode($bodyRaw, true);
    if (!is_array($body)) {
        $body = [];
    }

    $endpoint = $body['endpoint'] ?? $_GET['endpoint'] ?? '';

    if ($endpoint === 'fetch-data') {
        $data = fetchAll($pdo);

        $etag = md5(json_encode($data));
        $clientEtag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
        if ($clientEtag && $clientEtag === $etag) {
            http_response_code(304);
            exit();
        }

        header("ETag: \"{$etag}\"");
        echo json_encode(['success' => true, 'data' => $data, 'etag' => $etag]);

    } elseif ($endpoint === 'update-data') {
        if ($method === 'DELETE') {
            $table = detectTable($body);
            if (!$table) {
                if (isset($body['action']) && $body['action'] === 'clear_all') {
                    $result = deleteRow($pdo, '', $body);
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Cannot determine table for delete']);
                    exit();
                }
            } else {
                $result = deleteRow($pdo, $table, $body);
            }
            echo json_encode(array_merge(['success' => true], $result));

        } else {
            $table = detectTable($body);
            if (!$table) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Cannot determine table for operation']);
                exit();
            }

            $type = $body['type'] ?? '';
            if (strpos($type, 'delete-') === 0) {
                $result = deleteRow($pdo, $table, $body);
                echo json_encode(array_merge(['success' => true], $result));
            } else {
                $result = upsertRow($pdo, $table, $body);
                echo json_encode(array_merge(['success' => $result['ok']], $result));
            }
        }

    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Unknown endpoint: ' . $endpoint]);
    }

} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ]);

} catch (Throwable $e) {
    api_log("[CATCH-ALL] " . get_class($e) . ": {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'An unexpected server error occurred. Please try again later.',
    ]);
}