<?php
// Simple script to test PDO database connection directly
header("Content-Type: application/json; charset=utf-8");

$dbHost = 'sdb-85.hosting.stackcp.net';
$dbName = 'growtogether-35303938c0b0';
$dbUser = 'growtogether-35303938c0b0';
$dbPass = 'X2yK.erfcHxG';

try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "PDO Connected Successfully!",
        "host" => $dbHost,
        "database" => $dbName
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
