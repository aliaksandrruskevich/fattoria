<?php
// Proxy script to fetch data from external API and serve it to frontend

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$apiUrl = 'https://realt.by/bff/proxy/export/api/export/token/e68b296c864d8a9';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

if(curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch data from external API']);
    curl_close($ch);
    exit;
}

curl_close($ch);

echo $response;
?>
