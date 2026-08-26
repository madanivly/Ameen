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

if (file_exists(__DIR__ . '/init.php')) {
    require_once __DIR__ . '/init.php';
}

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
if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
} else {
    function getDbConnection(): PDO {
        static $pdo = null;
        if ($pdo !== null) {
            return $pdo;
        }

        $dbHost = (!empty($_SERVER['DB_HOST'])) ? $_SERVER['DB_HOST'] : ((!empty(getenv('DB_HOST'))) ? getenv('DB_HOST') : 'sdb-85.hosting.stackcp.net');
        $dbName = (!empty($_SERVER['DB_NAME'])) ? $_SERVER['DB_NAME'] : ((!empty(getenv('DB_NAME'))) ? getenv('DB_NAME') : 'growtogether-35303938c0b0');
        $dbUser = (!empty($_SERVER['DB_USER'])) ? $_SERVER['DB_USER'] : ((!empty(getenv('DB_USER'))) ? getenv('DB_USER') : 'growtogether-35303938c0b0');
        
        $dbPass = '';
        if (!empty($_SERVER['DB_PASSWORD'])) {
            $dbPass = $_SERVER['DB_PASSWORD'];
        } elseif (!empty(getenv('DB_PASSWORD'))) {
            $dbPass = getenv('DB_PASSWORD');
        } else {
            $dbPass = 'X2yK.erfcHxG';
        }

        if (empty($dbHost) || empty($dbName) || empty($dbUser) || empty($dbPass)) {
            api_log("Database configuration is incomplete.");
            throw new RuntimeException('Database configuration is incomplete.');
        }

        $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

        try {
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            
            if (function_exists('ensureTablesExist')) {
                ensureTablesExist($pdo);
            }
            initializeDefaultAdmin($pdo);
            
            return $pdo;
        } catch (PDOException $e) {
            api_log("Database connection failed: " . $e->getMessage());
            throw new RuntimeException('Database connection failed. Please try again later.');
        }
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
        // Auto-seeding of a default admin is intentionally disabled.
        // Admins must be created explicitly through the application.
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
            if (in_array($key, ['id', 'sheet', 'endpoint', 'entity'])) continue;

            if (!in_array($key, $existingFields)) {
                $colType = "VARCHAR(255) NULL";
                if ($key === 'shares') {
                    $colType = "INT NOT NULL DEFAULT 1";
                } elseif (strpos(strtolower($key), 'amount') !== false || strpos(strtolower($key), 'fee') !== false) {
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

    // The current schema stores both members and promoted collectors in
    // `members`. Build an identifier lookup once so transaction records can be
    // enriched without any legacy collectors/admins JOINs.
    $memberLookup = [];

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
                    $val = $row[$col];
                    $row[$col] = ($val == 1 || $val === true || $val === '1' || $val === 'true');
                }
            }
            if ($tbl === 'transactions') {
                if ((empty($row['type']) || $row['type'] === 'transaction')) {
                    $row['type'] = !empty($row['monthKey']) ? 'monthly' : 'registration';
                }

                // Format monthKey into readable contribution_month / month_paid_for (e.g. "August 2026")
                $row['for_month'] = null;
                $row['month_paid_for'] = null;
                $row['contribution_month'] = null;

                if (!empty($row['monthKey']) && $row['monthKey'] !== 'N/A') {
                    $parts = explode('-', $row['monthKey']);
                    if (count($parts) === 2) {
                        $yr = (int)$parts[0];
                        $mo = (int)$parts[1];
                        if ($yr > 0 && $mo >= 1 && $mo <= 12) {
                            $dt = DateTime::createFromFormat('!Y-m', $row['monthKey']);
                            if ($dt) {
                                $formattedMonth = $dt->format('F Y'); // e.g. "August 2026"
                                $row['for_month'] = $formattedMonth;
                                $row['month_paid_for'] = $formattedMonth;
                                $row['contribution_month'] = $formattedMonth;
                            }
                        }
                    }
                }

                // Transactions may reference either members.id or
                // members.memberId. Resolve both formats and expose the
                // member-backed collector relationship to the client.
                $member = $memberLookup[(string) ($row['memberId'] ?? '')] ?? null;
                if ($member) {
                    $row['collectorName'] = $member['collectorName'] ?? null;
                    $row['collectorId'] = $member['adminId'] ?? null;
                }
            }
            // Ensure memberId is always populated (fallback to id) so frontend login works
            if ($tbl === 'members') {
                if (empty($row['memberId']) && !empty($row['id'])) {
                    $row['memberId'] = $row['id'];
                }
                $row['shares'] = isset($row['shares']) ? min(10, max(1, (int)$row['shares'])) : 1;
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

        if ($tbl === 'members') {
            foreach ($rows as $member) {
                if (!empty($member['id'])) {
                    $memberLookup[(string) $member['id']] = $member;
                }
                if (!empty($member['memberId'])) {
                    $memberLookup[(string) $member['memberId']] = $member;
                }
            }
        }
    }

    $result['pendingSignups'] = [];
    return $result;
}

/**
 * The promoted-collector list is deliberately sourced only from members.
 * There is no collectors table: promotion is represented by isCollector = 1
 * on the member's own record.
 */
function fetchCollectors(PDO $pdo): array {
    $stmt = $pdo->query("SELECT * FROM `members` WHERE `isCollector` = 1 ORDER BY `name` ASC");
    $collectors = $stmt->fetchAll();

    foreach ($collectors as &$collector) {
        $collector['isCollector'] = true;
        if (empty($collector['memberId']) && !empty($collector['id'])) {
            $collector['memberId'] = $collector['id'];
        }
    }
    unset($collector);

    return $collectors;
}

// ─── Upsert Row ──────────────────────────────────────────────────
function upsertRow(PDO $pdo, string $table, array $body): array {
    $txType = $body['type'] ?? null;
    unset($body['sheet'], $body['endpoint'], $body['entity']);

    if ($table === 'transactions') {
        if (!empty($txType) && $txType !== 'transaction') {
            $body['type'] = $txType;
        } elseif (!empty($body['monthKey'])) {
            $body['type'] = 'monthly';
        } else {
            $body['type'] = 'registration';
        }
    } else {
        unset($body['type']);
    }

    // Fire schema check
    syncTableSchema($pdo, $table, array_keys($body));

    // Cast numeric and boolean fields
    foreach ($body as $col => &$val) {
        if ($col === 'shares') {
            $val = min(10, max(1, (int)$val));
        } elseif (strpos(strtolower($col), 'amount') !== false || strpos(strtolower($col), 'fee') !== false) {
            $val = (float) $val;
        } elseif (is_bool($val)) {
            $val = $val ? 1 : 0;
        }
    }
    unset($val);

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
        if ($table === 'members' && !empty($body['mobile'])) {
            $cleanMobile = preg_replace('/[^0-9]/', '', $body['mobile']);
            $last8 = substr($cleanMobile, -8);
            if (strlen($last8) === 8) {
                try {
                    $mobileStmt = $pdo->prepare("SELECT `id` FROM `members` WHERE RIGHT(REGEXP_REPLACE(`mobile`, '[^0-9]', ''), 8) = ? OR RIGHT(`mobile`, 8) = ? LIMIT 1");
                    $mobileStmt->execute([$last8, $last8]);
                } catch (Throwable $e) {
                    $mobileStmt = $pdo->prepare("SELECT `id` FROM `members` WHERE RIGHT(`mobile`, 8) = ? LIMIT 1");
                    $mobileStmt->execute([$last8]);
                }
                if ($mobileStmt->fetch()) {
                    return ['ok' => false, 'message' => 'You have already registered.'];
                }
            }
        }

        if ($table === 'transactions' && (!isset($body['type']) || $body['type'] === 'monthly') && !empty($body['memberId']) && !empty($body['monthKey'])) {
            $dupStmt = $pdo->prepare("SELECT `id` FROM `transactions` WHERE `memberId` = ? AND `monthKey` = ? AND (`type` = 'monthly' OR `type` IS NULL OR `type` = '' OR `type` = 'transaction') LIMIT 1");
            $dupStmt->execute([$body['memberId'], $body['monthKey']]);
            if ($dupStmt->fetch()) {
                return ['ok' => false, 'message' => 'A payment has already been recorded for this month.'];
            }
        }

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
        $pdo->exec("INSERT INTO `admins` (`id`, `name`, `username`, `role`, `password`, `mobile`, `whatsapp`) VALUES ('ADM001', 'Ismail Kallan', 'admin', 'admin', 'admin', '', '')");
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

    // For multipart/form-data uploads (file uploads), php://input is empty and
    // json_decode returns null. We must also check $_POST for the endpoint field.
    $endpoint = $body['endpoint'] ?? $_POST['endpoint'] ?? $_GET['endpoint'] ?? '';

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

    } elseif ($endpoint === 'fetch-collectors') {
        // Keep both the initial load and post-promotion refresh on the same
        // members-table query. Never consult the legacy admins table here.
        echo json_encode(['success' => true, 'data' => fetchCollectors($pdo)]);

    } elseif ($endpoint === 'login' || $endpoint === 'authenticate') {
        $username = strtolower(trim((string)($body['username'] ?? $body['inputId'] ?? $body['name'] ?? '')));
        $password = (string)($body['password'] ?? '');

        // ── STRICT ADMIN PRIORITIZATION ──────────────────────────────────────
        // If the username is 'admin' OR the supplied ID is 'ADM001', validate
        // EXCLUSIVELY against the admins table.  The members table must NEVER
        // be consulted for this identity, regardless of what rows it may contain.
        if ($username === 'admin' || strtoupper($username) === 'ADM001') {
            $stmt = $pdo->prepare(
                "SELECT * FROM `admins`
                  WHERE LOWER(`username`) = 'admin'
                     OR LOWER(`id`)       = 'admin'
                     OR LOWER(`id`)       = 'adm001'
                  LIMIT 1"
            );
            $stmt->execute();
            $adminRow = $stmt->fetch();

            if (!$adminRow) {
                // Fallback: honour the hard-coded master credentials even when
                // the admins table is empty (e.g. fresh install).
                $adminRow = [
                    'id'       => 'ADM001',
                    'name'     => 'Ismail Kallan',
                    'username' => 'admin',
                    'role'     => 'admin',
                    'password' => 'admin',
                ];
            }

            $expectedPass = (string)($adminRow['password'] ?? 'admin');
            if ($password === $expectedPass) {
                echo json_encode([
                    'success' => true,
                    'role'    => 'admin',
                    'user'    => $adminRow,
                    'message' => 'Logged in as Admin',
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error'   => 'Incorrect password.',
                ]);
            }
            // ALWAYS exit here — never fall through to any members-table lookup.
            exit;
        }

        // ── NON-ADMIN MEMBER / COLLECTOR LOGIN ────────────────────────────────
        // Explicitly guard: any attempt to authenticate as ADM001 via this
        // branch is rejected outright (belt-and-suspenders check).
        if (strtoupper($username) === 'ADM001') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Use the admin credentials to log in as admin.']);
            exit;
        }

        // Look up in admins table first (handles collectors stored there).
        $adminStmt = $pdo->prepare(
            "SELECT * FROM `admins`
              WHERE LOWER(`username`) = ? OR LOWER(`id`) = ?
              LIMIT 1"
        );
        $adminStmt->execute([$username, $username]);
        $adminRow = $adminStmt->fetch();

        if ($adminRow) {
            $expectedPass = (string)($adminRow['password'] ?? '');
            if ($password === $expectedPass) {
                echo json_encode([
                    'success' => true,
                    'role'    => $adminRow['role'] ?? 'collector',
                    'user'    => $adminRow,
                    'message' => 'Logged in as ' . ($adminRow['name'] ?? 'Admin'),
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Incorrect password.']);
            }
            exit;
        }

        // Finally, check members table — but NEVER for ADM001 / admin-role rows.
        $memberStmt = $pdo->prepare(
            "SELECT * FROM `members`
              WHERE (LOWER(`id`) = ? OR LOWER(`memberId`) = ?)
                AND UPPER(`id`)   != 'ADM001'
                AND UPPER(COALESCE(`memberId`, '')) != 'ADM001'
                AND LOWER(COALESCE(`role`, ''))     != 'admin'
              LIMIT 1"
        );
        $memberStmt->execute([$username, $username]);
        $memberRow = $memberStmt->fetch();

        if ($memberRow) {
            $expectedPass = (string)($memberRow['password'] ?? '');
            if ($password === $expectedPass) {
                $role = (!empty($memberRow['isCollector']) && $memberRow['isCollector'] != 0) ? 'collector' : 'member';
                echo json_encode([
                    'success' => true,
                    'role'    => $role,
                    'user'    => $memberRow,
                    'message' => 'Welcome back.',
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Incorrect password.']);
            }
            exit;
        }

        // No matching account found.
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Member not found. Please check your Member ID.']);
    } elseif ($endpoint === 'set-collector-status') {
        $memberId = trim((string) ($body['id'] ?? $body['memberId'] ?? ''));
        $isCollector = !empty($body['isCollector']) ? 1 : 0;
        if ($memberId === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'A member id is required.']);
            exit();
        }

        // SECURITY: The master admin account must never be promoted or demoted via this endpoint.
        if (strtoupper($memberId) === 'ADM001' || strtolower($memberId) === 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'The master admin account cannot be modified through the promotion system.']);
            exit();
        }

        // Also block any members whose role column is flagged as admin.
        $roleCheckStmt = $pdo->prepare("SELECT `role` FROM `members` WHERE `id` = ? LIMIT 1");
        $roleCheckStmt->execute([$memberId]);
        $roleCheckRow = $roleCheckStmt->fetch();
        if ($roleCheckRow && strtolower((string)($roleCheckRow['role'] ?? '')) === 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Admin-role accounts cannot be modified through the promotion system.']);
            exit();
        }

        // Collector status belongs exclusively to the members table. This is
        // intentionally a direct, parameterized update—not a generic upsert.
        $stmt = $pdo->prepare('UPDATE `members` SET `isCollector` = ? WHERE `id` = ?');
        $stmt->execute([$isCollector, $memberId]);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT 1 FROM `members` WHERE `id` = ? LIMIT 1');
            $exists->execute([$memberId]);
            if (!$exists->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Member not found.']);
                exit();
            }
        }

        echo json_encode([
            'success' => true,
            'data' => fetchCollectors($pdo),
        ]);

    } elseif ($endpoint === 'get-settings') {
        $stmt = $pdo->query("SELECT * FROM `system_settings` WHERE `key` = 'terms_and_conditions'");
        $row = $stmt->fetch();
        echo json_encode(['success' => true, 'data' => $row]);

    } elseif ($endpoint === 'update-settings') {
        $stmt = $pdo->prepare("INSERT INTO `system_settings` (`key`, `value`) VALUES ('terms_and_conditions', ?) ON DUPLICATE KEY UPDATE `value` = ?");
        $stmt->execute([$body['value'], $body['value']]);
        echo json_encode(['success' => true]);

    } elseif ($endpoint === 'update-receipt-month' || $endpoint === 'update-payment-month') {
        $receiptId = trim((string)($body['receipt_id'] ?? $body['id'] ?? $body['transaction_id'] ?? ''));
        $monthKey = trim((string)($body['monthKey'] ?? $body['month_key'] ?? ''));

        if (empty($receiptId) || empty($monthKey)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Both receipt_id and monthKey are required.']);
            exit();
        }

        $monthDisplay = $monthKey;
        if ($monthKey !== 'N/A') {
            $parts = explode('-', $monthKey);
            if (count($parts) === 2) {
                $yr = (int)$parts[0];
                $mo = (int)$parts[1];
                if ($yr > 0 && $mo >= 1 && $mo <= 12) {
                    $dt = DateTime::createFromFormat('!Y-m', $monthKey);
                    if ($dt) {
                        $monthDisplay = $dt->format('F Y');
                    }
                }
            }
        }

        $stmt = $pdo->prepare("UPDATE `transactions` SET `monthKey` = ?, `for_month` = ?, `month_paid_for` = ?, `contribution_month` = ? WHERE `id` = ? OR `receiptNo` = ?");
        $stmt->execute([$monthKey, $monthDisplay, $monthDisplay, $monthDisplay, $receiptId, $receiptId]);

        echo json_encode([
            'success' => true,
            'message' => 'Receipt target month updated successfully.',
            'data' => [
                'receipt_id' => $receiptId,
                'monthKey' => $monthKey,
                'for_month' => $monthDisplay,
            ]
        ]);

    } elseif ($endpoint === 'update-data') {
        if (isset($body['action']) && $body['action'] === 'clear_all') {
            $result = deleteRow($pdo, '', $body);
            echo json_encode(array_merge(['success' => true], $result));
            exit();
        }

        if ($method === 'DELETE') {
            $table = detectTable($body);
            if (!$table) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Cannot determine table for delete']);
                exit();
            }
            $result = deleteRow($pdo, $table, $body);
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

    } elseif ($endpoint === 'upload-avatar') {
        if (!isset($_FILES['avatar'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No file uploaded.']);
            exit();
        }
        
        $file = $_FILES['avatar'];
        $memberId = $_POST['memberId'] ?? '';
        
        if (empty($memberId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Member ID is required.']);
            exit();
        }
        
        // Use DOCUMENT_ROOT so the avatars directory is inside public_html and
        // served directly by the web server via /uploads/avatars/<filename>.
        $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__), '/');
        $uploadDir = $docRoot . '/uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Validate file type (only allow images)
        $allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($detectedMime, $allowedMime)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.']);
            exit();
        }

        $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
        $ext = $extMap[$detectedMime] ?? pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeId = preg_replace('/[^a-zA-Z0-9]/', '', $memberId);
        $filename = 'avatar_' . $safeId . '_' . time() . '.' . $ext;
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            $relativeUrl = '/uploads/avatars/' . $filename;
            
            try {
                // Ensure profilePhoto column exists non-destructively
                $pdo->exec("ALTER TABLE `members` ADD COLUMN `profilePhoto` VARCHAR(255) NULL DEFAULT NULL");
            } catch (Throwable $e) {
                // Column already exists — safe to continue
            }
            
            // Update the database with the new avatar URL
            $stmt = $pdo->prepare("UPDATE `members` SET `profilePhoto` = ? WHERE `id` = ?");
            $stmt->execute([$relativeUrl, $memberId]);
            
            api_log("Avatar uploaded for member {$memberId}: {$relativeUrl}");
            echo json_encode(['success' => true, 'url' => $relativeUrl]);
        } else {
            $uploadError = $file['error'] ?? UPLOAD_ERR_OK;
            api_log("move_uploaded_file failed for member {$memberId}. PHP upload error code: {$uploadError}. Target: {$filepath}");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file. Server error code: ' . $uploadError]);
        }
        exit();

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