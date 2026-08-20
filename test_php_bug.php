<?php
$body = [
    'id' => 'MOH008',
    'name' => 'Mohamed Madani',
    'shares' => 3,
    'type' => 'member',
    'endpoint' => 'update-data'
];
unset($body['sheet'], $body['endpoint'], $body['entity']);
unset($body['type']);
foreach ($body as $col => &$val) {
    if ($col === 'shares') {
        $val = min(10, max(1, (int)$val));
    }
}
foreach ($body as $col => $val) {
    // doing something
}
print_r($body);
?>
