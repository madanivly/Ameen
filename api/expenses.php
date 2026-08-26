<?php
/**
 * Ameen Portal – Dedicated Expenses API Endpoint
 * Handles administrative & official expenses with source flag.
 *   GET  /api/expenses.php          → All expenses
 *   POST /api/expenses.php (JSON)   → Add / update / delete
 *   POST /api/expenses.php (multi)  → Receipt photo upload
 */

if (file_exists(__DIR__ . '/init.php')) {
    require_once __DIR__ . '/init.php';
}
if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

try {
    $pdo = getDbConnection();

    // Ensure extra columns exist
    try {
        $existing = $pdo->query("DESCRIBE `expenses`")->fetchAll(PDO::FETCH_COLUMN);
        foreach (['notes' => 'TEXT NULL', 'source' => "VARCHAR(255) NULL DEFAULT 'official'", 'receiptPhoto' => 'VARCHAR(255) NULL'] as $col => $def) {
            if (!in_array($col, $existing)) {
                $pdo->exec("ALTER TABLE `expenses` ADD COLUMN `{$col}` {$def}");
            }
        }
    } catch (Throwable $ignored) {}

    $method = $_SERVER['REQUEST_METHOD'];

    // ── Receipt photo upload ─────────────────────────────────────
    if (!empty($_FILES)) {
        $file = $_FILES['receipt'] ?? $_FILES['file'] ?? reset($_FILES);
        $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__), '/');
        $uploadDir = $docRoot . '/uploads/receipts/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowed)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid file type.']);
            exit();
        }
        $extMap = ['image/jpeg'=>'jpg','image/png'=>'png','image/gif'=>'gif','image/webp'=>'webp','application/pdf'=>'pdf'];
        $ext = $extMap[$mime] ?? 'bin';
        $filename = 'receipt_' . time() . '_' . mt_rand(1000,9999) . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            echo json_encode(['success' => true, 'url' => '/uploads/receipts/' . $filename]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Upload failed. Code: ' . ($file['error'] ?? 0)]);
        }
        exit();
    }

    // ── GET: list all expenses ───────────────────────────────────
    if ($method === 'GET') {
        $rows = $pdo->query("SELECT * FROM `expenses` ORDER BY `date` DESC")->fetchAll();
        echo json_encode(['success' => true, 'data' => $rows]);
        exit();
    }

    // ── POST: parse JSON body ────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $action = $body['action'] ?? $body['type'] ?? '';

    // Delete
    if (in_array($action, ['delete-expense', 'delete'])) {
        $id = $body['id'] ?? '';
        if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'ID required']); exit(); }
        $pdo->prepare("DELETE FROM `expenses` WHERE `id` = ?")->execute([$id]);
        echo json_encode(['success' => true, 'deletedId' => $id]);
        exit();
    }

    // Upsert
    $id           = $body['id'] ?? ('exp_' . substr(md5(uniqid('', true)), 0, 8));
    $description  = $body['description'] ?? 'Administrative Expense';
    $amount       = (float)($body['amount'] ?? 0);
    $category     = $body['category'] ?? 'Administrative';
    $date         = $body['date'] ?? date('c');
    $addedBy      = $body['addedBy'] ?? 'Admin';
    $notes        = $body['notes'] ?? '';
    $source       = $body['source'] ?? 'official';
    $receiptPhoto = $body['receiptPhoto'] ?? '';

    $exists = $pdo->prepare("SELECT 1 FROM `expenses` WHERE `id` = ? LIMIT 1");
    $exists->execute([$id]);

    if ($exists->fetch()) {
        $pdo->prepare("UPDATE `expenses` SET `description`=?,`amount`=?,`category`=?,`date`=?,`addedBy`=?,`notes`=?,`source`=?,`receiptPhoto`=? WHERE `id`=?")
            ->execute([$description, $amount, $category, $date, $addedBy, $notes, $source, $receiptPhoto, $id]);
        echo json_encode(['success' => true, 'action' => 'updated', 'id' => $id]);
    } else {
        $pdo->prepare("INSERT INTO `expenses` (`id`,`description`,`amount`,`category`,`date`,`addedBy`,`notes`,`source`,`receiptPhoto`) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([$id, $description, $amount, $category, $date, $addedBy, $notes, $source, $receiptPhoto]);
        echo json_encode(['success' => true, 'action' => 'inserted', 'id' => $id]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
