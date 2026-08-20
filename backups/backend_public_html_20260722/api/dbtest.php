<?php
header("Content-Type: application/json");
$dbHost = '198.251.83.217';
$dbName = 'madanime_ameen';
$dbUser = 'madanime_ameen';
$dbPass = '853VXL3SPVM4jWt2qEvF';
$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['success' => true, 'tables' => $tables]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
