<?php
// U-EventTrack - Root Index
// This file helps debug deployment issues

header('Content-Type: application/json');

$status = [
    'status' => 'ok',
    'message' => 'U-EventTrack is deployed',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
    'script_path' => __DIR__,
];

// Check if directories exist
$status['checks'] = [
    'frontend_dist_exists' => file_exists(__DIR__ . '/frontend/dist/index.html'),
    'backend_exists' => file_exists(__DIR__ . '/backend/public/index.php'),
    'node_modules_exists' => file_exists(__DIR__ . '/node_modules'),
    'server_js_exists' => file_exists(__DIR__ . '/server.js'),
];

// Check permissions
$status['permissions'] = [
    'root_readable' => is_readable(__DIR__),
    'frontend_readable' => is_readable(__DIR__ . '/frontend/dist'),
];

echo json_encode($status, JSON_PRETTY_PRINT);
