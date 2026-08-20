<?php
// Absolute minimal test - no DB, no logic
header("Content-Type: application/json");
echo json_encode(["status" => "php_works", "time" => date('c'), "php" => PHP_VERSION]);
