<?php
// Secure Hourly MySQL Backup Script for Ameen App
// Triggers via Cron, keeps 48 hours of history.

// Security token check to prevent unauthorized execution
$EXPECTED_KEY = "ameen_backup_12345_xyz"; 

$is_cli = php_sapi_name() === 'cli';
$provided_key = isset($_GET['key']) ? $_GET['key'] : (isset($argv[1]) ? $argv[1] : '');

if ($provided_key !== $EXPECTED_KEY) {
    http_response_code(403);
    die("Error: Unauthorized access.");
}

$envPath = __DIR__ . '/../.env';
$envFile = file_exists($envPath) ? parse_ini_file($envPath) : [];

$DB_HOST = $envFile['DB_HOST'] ?? 'localhost';
$DB_NAME = $envFile['DB_NAME'] ?? 'madanime_ameen2';
$DB_USER = $envFile['DB_USER'] ?? 'madanime_ameen_dbuser2';
$DB_PASS = $envFile['DB_PASS'] ?? 'f*8q5{S;h=m-';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database Connection failed: " . $e->getMessage());
}

$backup_dir = __DIR__ . '/../backups_hourly';

if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
    // Secure the directory from web access
    file_put_contents("$backup_dir/.htaccess", "Order deny,allow\nDeny from all");
}

$date = date('Y-m-d_H-i-s');
$backup_file = "$backup_dir/db_backup_$date.sql";

$sql_dump = "-- MySQL dump\n-- Date: $date\n\n";

$tables = [];
$result = $pdo->query("SHOW TABLES");
while ($row = $result->fetch(PDO::FETCH_NUM)) {
    $tables[] = $row[0];
}

foreach ($tables as $table) {
    $sql_dump .= "-- Table structure for table `$table`\n";
    $sql_dump .= "DROP TABLE IF EXISTS `$table`;\n";
    $create_table = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
    $sql_dump .= $create_table[1] . ";\n\n";

    $sql_dump .= "-- Dumping data for table `$table`\n";
    $rows = $pdo->query("SELECT * FROM `$table`");
    while ($row = $rows->fetch(PDO::FETCH_ASSOC)) {
        $keys = array_keys($row);
        $keys = array_map(function($key) { return "`$key`"; }, $keys);
        
        $values = array_values($row);
        $values = array_map(function($val) use ($pdo) {
            if ($val === null) return 'NULL';
            return $pdo->quote($val);
        }, $values);

        $sql_dump .= "INSERT INTO `$table` (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $values) . ");\n";
    }
    $sql_dump .= "\n\n";
}

if (file_put_contents($backup_file, $sql_dump) !== false) {
    echo "Backup saved to $backup_file\n";
} else {
    die("Error writing backup file.");
}

// Cleanup backups older than 48 hours
$files = glob("$backup_dir/db_backup_*.sql");
$now = time();
$cleared = 0;

foreach ($files as $file) {
    if (is_file($file)) {
        if ($now - filemtime($file) >= 48 * 3600) {
            unlink($file);
            $cleared++;
        }
    }
}

echo "Cleanup finished. Removed $cleared old backup(s).\n";

?>