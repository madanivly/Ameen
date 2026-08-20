<?php
/**
 * Temporary deploy receiver – deletes itself after extraction.
 * Protected by a one-time token.
 */
$TOKEN = 'grt_deploy_2026_xK9mPqZ7';

if (!isset($_GET['token']) || $_GET['token'] !== $TOKEN) {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'status';

if ($action === 'status') {
    echo json_encode(['ok' => true, 'msg' => 'Deploy receiver ready', 'php' => PHP_VERSION]);
    exit;
}

if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $target = sys_get_temp_dir() . '/grt_pwa_deploy.zip';
    $data = file_get_contents('php://input');
    if (!$data) {
        echo json_encode(['error' => 'No data received']);
        exit;
    }
    $written = file_put_contents($target, $data);
    echo json_encode(['ok' => true, 'bytes' => $written, 'path' => $target]);
    exit;
}

if ($action === 'extract') {
    $zip_path = sys_get_temp_dir() . '/grt_pwa_deploy.zip';
    if (!file_exists($zip_path)) {
        echo json_encode(['error' => 'ZIP not found at ' . $zip_path]);
        exit;
    }

    // Determine document root (public_html)
    $doc_root = dirname(dirname(__FILE__)); // go up from api/ to public_html/

    $zip = new ZipArchive();
    $res = $zip->open($zip_path);
    if ($res !== true) {
        echo json_encode(['error' => 'Cannot open ZIP: ' . $res]);
        exit;
    }

    $extracted = [];
    $failed = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $entry = $zip->getNameIndex($i);
        // Strip leading dist/ prefix
        $relative = preg_replace('#^dist/#', '', $entry);
        if ($relative === '' || substr($relative, -1) === '/') continue;
        // Skip junk
        if (strpos($relative, '.DS_Store') !== false) continue;
        if (strpos($relative, '/Icon') !== false && strlen($relative) <= 6) continue;

        $dest = $doc_root . '/' . $relative;
        $dir  = dirname($dest);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $content = $zip->getFromIndex($i);
        if (file_put_contents($dest, $content) !== false) {
            $extracted[] = $relative;
        } else {
            $failed[] = $relative;
        }
    }
    $zip->close();
    unlink($zip_path);

    // Self-destruct
    $self = __FILE__;

    echo json_encode([
        'ok' => true,
        'extracted' => count($extracted),
        'failed' => $failed,
        'files' => $extracted,
    ]);

    // Delete self after response sent
    register_shutdown_function(function() use ($self) {
        @unlink($self);
    });
    exit;
}

echo json_encode(['error' => 'Unknown action']);
