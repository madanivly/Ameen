<?php
// Ensure clean JSON output for init endpoint
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

if (file_exists(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
}

/**
 * Safe Schema & Table Initialization
 */
function ensureTablesExist(PDO $pdo): void {
    $tables = [
        "members" => "CREATE TABLE IF NOT EXISTS `members` (
          `id` varchar(255) NOT NULL,
          `memberId` varchar(255) DEFAULT NULL,
          `name` varchar(255) DEFAULT NULL,
          `place` varchar(255) DEFAULT NULL,
          `mobile` varchar(255) DEFAULT NULL,
          `whatsapp` varchar(255) DEFAULT NULL,
          `role` varchar(255) DEFAULT NULL,
          `shares` int(11) DEFAULT 1,
          `monthlyTarget` decimal(10,2) DEFAULT 0.00,
          `adminId` varchar(255) DEFAULT NULL,
          `joinDate` varchar(255) DEFAULT NULL,
          `status` varchar(255) DEFAULT 'active',
          `isCollector` tinyint(1) DEFAULT 0,
          `registrationFeePaid` tinyint(1) DEFAULT 0,
          `password` varchar(255) DEFAULT NULL,
          `nomineeName` varchar(255) DEFAULT NULL,
          `nomineeRelation` varchar(255) DEFAULT NULL,
          `nomineeContact` varchar(255) DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "admins" => "CREATE TABLE IF NOT EXISTS `admins` (
          `id` varchar(255) NOT NULL,
          `name` varchar(255) DEFAULT NULL,
          `role` varchar(255) DEFAULT NULL,
          `username` varchar(255) DEFAULT NULL,
          `password` varchar(255) DEFAULT NULL,
          `mobile` varchar(255) DEFAULT NULL,
          `whatsapp` varchar(255) DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "transactions" => "CREATE TABLE IF NOT EXISTS `transactions` (
          `id` varchar(255) NOT NULL,
          `memberId` varchar(255) DEFAULT NULL,
          `amount` decimal(10,2) DEFAULT 0.00,
          `monthKey` varchar(255) DEFAULT NULL,
          `collectorId` varchar(255) DEFAULT NULL,
          `collectorName` varchar(255) DEFAULT NULL,
          `collectedAt` datetime DEFAULT NULL,
          `transferredToTreasurer` tinyint(1) DEFAULT 0,
          `transferredAt` datetime DEFAULT NULL,
          `receiptNo` varchar(255) DEFAULT NULL,
          `notes` text DEFAULT NULL,
          `approved` tinyint(1) DEFAULT 1,
          `type` varchar(255) DEFAULT 'monthly',
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "investments" => "CREATE TABLE IF NOT EXISTS `investments` (
          `id` varchar(255) NOT NULL,
          `name` varchar(255) DEFAULT NULL,
          `type` varchar(255) DEFAULT NULL,
          `capitalDeployed` decimal(10,2) DEFAULT 0.00,
          `currentValue` decimal(10,2) DEFAULT 0.00,
          `startDate` varchar(255) DEFAULT NULL,
          `status` varchar(255) DEFAULT 'active',
          `profitEntries` json DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "stakes" => "CREATE TABLE IF NOT EXISTS `stakes` (
          `memberId` varchar(255) NOT NULL,
          `investmentId` varchar(255) NOT NULL,
          `shareCount` int(11) DEFAULT 1,
          PRIMARY KEY (`memberId`,`investmentId`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "transfers" => "CREATE TABLE IF NOT EXISTS `transfers` (
          `id` varchar(255) NOT NULL,
          `adminId` varchar(255) DEFAULT NULL,
          `collectorName` varchar(255) DEFAULT NULL,
          `amount` decimal(10,2) DEFAULT 0.00,
          `transactionCount` int(11) DEFAULT 0,
          `transactionIds` json DEFAULT NULL,
          `transferredAt` datetime DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "expenses" => "CREATE TABLE IF NOT EXISTS `expenses` (
          `id` varchar(255) NOT NULL,
          `description` text DEFAULT NULL,
          `amount` decimal(10,2) DEFAULT 0.00,
          `date` varchar(255) DEFAULT NULL,
          `category` varchar(255) DEFAULT NULL,
          `addedBy` varchar(255) DEFAULT NULL,
          `notes` text DEFAULT NULL,
          `source` varchar(255) DEFAULT 'official',
          `receiptPhoto` varchar(255) DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

        "pins" => "CREATE TABLE IF NOT EXISTS `pins` (
          `role` varchar(255) NOT NULL,
          `pin` varchar(255) NOT NULL,
          PRIMARY KEY (`role`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    ];

    foreach ($tables as $name => $sql) {
        try {
            $pdo->exec($sql);
        } catch (PDOException $e) {
            if (function_exists('api_log')) {
                api_log("Table initialization error for {$name}: " . $e->getMessage());
            }
        }
    }
}

// If directly invoked via HTTP/script, run initialization and return status JSON
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'init.php') {
    try {
        $pdo = getDbConnection();
        ensureTablesExist($pdo);
        echo json_encode([
            "success" => true,
            "message" => "Tables verified/created successfully."
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

