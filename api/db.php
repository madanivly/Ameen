<?php
/**
 * Ameen Portal – Database Connection Initialization
 */

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
        if (function_exists('api_log')) {
            api_log("Database configuration is incomplete.");
        }
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
        if (function_exists('initializeDefaultAdmin')) {
            initializeDefaultAdmin($pdo);
        }
        
        return $pdo;
    } catch (PDOException $e) {
        if (function_exists('api_log')) {
            api_log("Database connection failed: " . $e->getMessage());
        }
        throw new RuntimeException('Database connection failed. Please try again later.');
    }
}
