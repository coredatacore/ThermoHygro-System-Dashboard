<?php
declare(strict_types=1);
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$to = isset($data['to']) ? $data['to'] : '';
$status = isset($data['status']) ? $data['status'] : '';
$temperature = isset($data['temperature']) ? $data['temperature'] : '';
$humidity = isset($data['humidity']) ? $data['humidity'] : '';
$timestamp = isset($data['timestamp']) ? $data['timestamp'] : '';
if (!$to) { http_response_code(400); echo json_encode(['error'=>'Missing recipient email']); exit; }
$config = include __DIR__ . '/../config.php';
$apiKey = $config['brevo_api_key'] ?? '';
$fromEmail = $config['alerts_from_email'] ?? 'alerts@example.com';
$fromName = $config['alerts_from_name'] ?? 'ThermoHygro Alerts';
if (!$apiKey) { http_response_code(500); echo json_encode(['error'=>'BREVO_API_KEY not configured']); exit; }
$subject = 'System ' . $status;
$htmlContent = '<h2>ThermoHygro Status: ' . htmlspecialchars($status, ENT_QUOTES, 'UTF-8') . '</h2>'
  . '<p><strong>Temperature:</strong> ' . htmlspecialchars((string)$temperature, ENT_QUOTES, 'UTF-8') . ' °C</p>'
  . '<p><strong>Humidity:</strong> ' . htmlspecialchars((string)$humidity, ENT_QUOTES, 'UTF-8') . ' %</p>'
  . '<p><strong>Time:</strong> ' . htmlspecialchars((string)$timestamp, ENT_QUOTES, 'UTF-8') . '</p>';
$payload = json_encode([
  'sender' => ['name' => $fromName, 'email' => $fromEmail],
  'to' => [['email' => $to]],
  'subject' => $subject,
  'htmlContent' => $htmlContent
]);
$ch = curl_init('https://api.brevo.com/v3/smtp/email');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'api-key: ' . $apiKey],
  CURLOPT_POSTFIELDS => $payload,
]);
$respBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
if ($err) { http_response_code(502); echo json_encode(['error'=>'Brevo send failed','detail'=>$err]); exit; }
if ($httpCode < 200 || $httpCode >= 300) { http_response_code(502); echo $respBody ?: json_encode(['error'=>'Brevo send failed']); exit; }
echo json_encode(['ok'=>true]);
