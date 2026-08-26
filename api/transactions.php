<?php
/**
 * Ameen Portal – Transactions API Endpoint
 *
 * Handles updating target month for receipts/transactions:
 *   POST ?action=update-month OR body { receipt_id, monthKey }
 */

if (file_exists(__DIR__ . '/init.php')) {
    require_once __DIR__ . '/init.php';
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
}

try {
    $pdo = getDbConnection();

    $bodyRaw = file_get_contents('php://input');
    $body = json_decode($bodyRaw, true);
    if (!is_array($body)) {
        $body = $_POST;
    }

    $receiptId = trim((string)($body['receipt_id'] ?? $body['id'] ?? $body['transaction_id'] ?? ''));
    $monthKey = trim((string)($body['monthKey'] ?? $body['month_key'] ?? $body['for_month'] ?? ''));

    if (empty($receiptId) || empty($monthKey)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Both receipt_id and monthKey are required.'
        ]);
        exit();
    }

    // Format readable month label (e.g., "2026-07" => "July 2026")
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

    // Dynamic schema check for columns
    $existingFields = [];
    try {
        $stmt = $pdo->query("DESCRIBE `transactions`");
        $existingFields = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $e) {}

    foreach (['monthKey', 'for_month', 'month_paid_for', 'contribution_month'] as $col) {
        if (!in_array($col, $existingFields)) {
            try {
                $pdo->exec("ALTER TABLE `transactions` ADD COLUMN `{$col}` VARCHAR(255) NULL");
            } catch (PDOException $e) {}
        }
    }

    $sql = "UPDATE `transactions` 
            SET `monthKey` = ?, `for_month` = ?, `month_paid_for` = ?, `contribution_month` = ? 
            WHERE `id` = ? OR `receiptNo` = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$monthKey, $monthDisplay, $monthDisplay, $monthDisplay, $receiptId, $receiptId]);

    echo json_encode([
        'success' => true,
        'message' => 'Receipt target payment month updated successfully.',
        'data' => [
            'receipt_id' => $receiptId,
            'monthKey' => $monthKey,
            'for_month' => $monthDisplay,
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
