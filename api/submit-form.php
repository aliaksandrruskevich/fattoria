<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

// Validate required fields
if (empty($data['name']) || empty($data['contact'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and contact are required']);
    exit();
}

// Bitrix24 configuration
$bitrixWebhookUrl = 'https://b24-7f121e.bitrix24.by/rest/1/p1a3njih5vb5x0oj/';

// Prepare lead data for Bitrix24
$leadData = [
    'TITLE' => 'Заявка с сайта: ' . ($data['source'] ?? 'Обратная связь'),
    'NAME' => $data['name'] ?? '',
    'PHONE' => [['VALUE' => $data['contact'] ?? '', 'VALUE_TYPE' => 'WORK']],
    'EMAIL' => !empty($data['email']) ? [['VALUE' => $data['email'], 'VALUE_TYPE' => 'WORK']] : [],
    'COMMENTS' => $data['message'] ?? $data['request'] ?? '',
    'SOURCE_ID' => 'WEB',
    'ASSIGNED_BY_ID' => 1,
    'STATUS_ID' => 'NEW'
];

// Add additional fields if available
if (!empty($data['propertyUnid'])) {
    $leadData['UF_CRM_123456789'] = $data['propertyUnid'];
}
if (!empty($data['propertyTitle'])) {
    $leadData['TITLE'] .= ' - ' . $data['propertyTitle'];
}
if (!empty($data['budget'])) {
    $leadData['OPPORTUNITY'] = floatval($data['budget']);
    $leadData['CURRENCY_ID'] = $data['currency'] ?? 'USD';
}

// Submit to Bitrix24 using GET request with JSON-RPC format
$requestData = [
    'method' => 'crm.lead.add',
    'params' => [
        'fields' => $leadData
    ],
    'id' => 1
];

$ch = curl_init($bitrixWebhookUrl . 'crm.lead.add.json');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Check response
$bitrixResponse = json_decode($response, true);

if ($bitrixResponse && isset($bitrixResponse['result'])) {
    // Success - save to log
    $logFile = __DIR__ . '/../form-submissions.log';
    $logEntry = date('Y-m-d H:i:s') . ' - SUCCESS - Lead ID: ' . $bitrixResponse['result'] . ' - ' . json_encode($data) . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена!', 'leadId' => $bitrixResponse['result']]);
} else {
    // Error - save to log
    $logFile = __DIR__ . '/../form-submissions.log';
    $logEntry = date('Y-m-d H:i:s') . ' - ERROR - ' . json_encode($bitrixResponse) . ' - ' . json_encode($data) . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Ошибка отправки заявки: ' . ($bitrixResponse['error_description'] ?? 'Неизвестная ошибка')]);
}
?>
