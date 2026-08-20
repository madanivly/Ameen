<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$dbHost = '198.251.83.217';
$dbName = 'madanime_ameen';
$dbUser = 'madanime_ameen';
$dbPass = 'Pandikasala!1!1';

$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    echo json_encode(['success' => true, 'message' => 'Connected successfully!']);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'host' => $dbHost,
        'user' => $dbUser,
        'db' => $dbName,
        // Also try localhost
    ]);
}

// Also try localhost
echo "\n\n--- Trying localhost ---\n";
$dsn2 = "mysql:host=localhost;dbname={$dbName};charset=utf8mb4";
try {
    $pdo2 = new PDO($dsn2, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    echo json_encode(['success' => true, 'message' => 'Connected via localhost!']);
} catch (PDOException $e) {
    echo json_encode(['localhost_error' => $e->getMessage()]);
}
