<?php
/*
 * Ardahan Taksi — Müşteri yorumları API
 *
 * Herkese açık:
 *   GET  reviews.php                       -> onaylı yorumlar
 *   POST reviews.php  action=submit        -> yeni yorum (onay bekler)
 * Yönetici (oturum gerekir):
 *   POST action=login | logout | list | approve | hide | delete | reply
 *
 * Veriler api/data/reviews.php içinde JSON olarak saklanır. Dosyanın başındaki
 * PHP satırı, sunucu .htaccess desteklemese bile içeriğin tarayıcıdan okunmasını engeller.
 */
declare(strict_types=1);
require __DIR__ . '/settings.php';
date_default_timezone_set('Europe/Istanbul');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const DATA_FILE = __DIR__ . '/data/reviews.php';
const GUARD = "<?php http_response_code(404); exit; ?>\n";

session_name('at_admin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): void
{
    out(['ok' => false, 'error' => $msg], $code);
}

/** Dosyayı kilitleyip okur; $fn verilirse veriyi değiştirip geri yazar. */
function store(?callable $fn = null): array
{
    if (!is_dir(dirname(DATA_FILE))) mkdir(dirname(DATA_FILE), 0755, true);
    $fh = fopen(DATA_FILE, 'c+');
    if (!$fh) fail('Sunucu veri dosyasını açamadı.', 500);
    flock($fh, $fn ? LOCK_EX : LOCK_SH);
    $raw = stream_get_contents($fh);
    $data = json_decode(substr($raw, strlen(GUARD)) ?: '', true);
    if (!is_array($data)) $data = ['reviews' => [], 'ips' => []];

    if ($fn) {
        $data = $fn($data);
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, GUARD . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        fflush($fh);
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $data;
}

function clean(string $s, int $max): string
{
    $s = trim(preg_replace('/\s+/u', ' ', strip_tags($s)) ?? '');
    return mb_substr($s, 0, $max);
}

function publicView(array $r): array
{
    return [
        'name'  => $r['name'],
        'stars' => $r['stars'],
        'text'  => $r['text'],
        'date'  => substr($r['created'], 0, 10),
        'reply' => $r['reply'] ?? '',
    ];
}

function requireAdmin(): void
{
    session_start();
    if (empty($_SESSION['admin'])) fail('Oturum açmanız gerekiyor.', 401);
    if (!hash_equals($_SESSION['csrf'] ?? '', $_SERVER['HTTP_X_CSRF'] ?? '')) fail('Geçersiz istek.', 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = store();
    $list = array_values(array_filter($data['reviews'], fn($r) => $r['status'] === 'approved'));
    usort($list, fn($a, $b) => strcmp($b['created'], $a['created']));
    $count = count($list);
    $avg = $count ? round(array_sum(array_column($list, 'stars')) / $count, 1) : 0;
    out(['ok' => true, 'count' => $count, 'average' => $avg, 'reviews' => array_map('publicView', array_slice($list, 0, 30))]);
}

if ($method !== 'POST') fail('Desteklenmeyen istek.', 405);

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) $in = $_POST;
$action = (string)($in['action'] ?? '');

switch ($action) {
    case 'submit':
        // Bot tuzakları: gizli alan dolu ya da form çok hızlı gönderildiyse sessizce kabul edilmiş gibi davran.
        $elapsed = time() - (int)($in['t'] ?? 0);
        if (!empty($in['website']) || $elapsed < 4) out(['ok' => true]);

        $name  = clean((string)($in['name'] ?? ''), NAME_MAX_LEN);
        $text  = clean((string)($in['text'] ?? ''), REVIEW_MAX_LEN);
        $stars = (int)($in['stars'] ?? 0);
        if (mb_strlen($name) < 2) fail('Lütfen adınızı yazın.');
        if ($stars < 1 || $stars > 5) fail('Lütfen 1-5 arası puan verin.');
        if (mb_strlen($text) < REVIEW_MIN_LEN) fail('Yorumunuz en az ' . REVIEW_MIN_LEN . ' karakter olmalı.');
        if (preg_match('~https?://|www\.~i', $text)) fail('Yorumlarda bağlantı paylaşılamaz.');

        $ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __DIR__);
        $now = time();
        store(function (array $d) use ($ip, $now, $name, $text, $stars) {
            $d['ips'] = array_filter($d['ips'] ?? [], fn($t) => $t > $now - REVIEW_COOLDOWN);
            if (isset($d['ips'][$ip])) fail('Kısa süre önce yorum gönderdiniz. Lütfen biraz sonra tekrar deneyin.', 429);
            $d['ips'][$ip] = $now;
            $d['reviews'][] = [
                'id' => bin2hex(random_bytes(8)),
                'name' => $name,
                'stars' => $stars,
                'text' => $text,
                'status' => 'pending',
                'reply' => '',
                'created' => date('c', $now),
            ];
            return $d;
        });
        out(['ok' => true]);

    case 'login':
        session_start();
        if (strlen(ADMIN_PASSWORD) < 10) fail('Yönetici şifresi belirlenmemiş. api/settings.php dosyasında ADMIN_PASSWORD alanını doldurun.', 500);
        $tries = $_SESSION['tries'] ?? 0;
        if ($tries >= 5 && time() - ($_SESSION['last_try'] ?? 0) < 300) fail('Çok fazla hatalı deneme. 5 dakika sonra tekrar deneyin.', 429);
        if (!hash_equals(ADMIN_PASSWORD, (string)($in['password'] ?? ''))) {
            $_SESSION['tries'] = $tries + 1;
            $_SESSION['last_try'] = time();
            sleep(1);
            fail('Şifre hatalı.', 401);
        }
        session_regenerate_id(true);
        $_SESSION = ['admin' => true, 'csrf' => bin2hex(random_bytes(16))];
        out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

    case 'logout':
        session_start();
        $_SESSION = [];
        session_destroy();
        out(['ok' => true]);

    case 'list':
        requireAdmin();
        $list = store()['reviews'];
        usort($list, fn($a, $b) => strcmp($b['created'], $a['created']));
        out(['ok' => true, 'reviews' => $list]);

    case 'approve':
    case 'hide':
    case 'delete':
    case 'reply':
        requireAdmin();
        $id = (string)($in['id'] ?? '');
        $reply = clean((string)($in['reply'] ?? ''), REVIEW_MAX_LEN);
        $found = false;
        store(function (array $d) use ($action, $id, $reply, &$found) {
            foreach ($d['reviews'] as $i => &$r) {
                if ($r['id'] !== $id) continue;
                $found = true;
                if ($action === 'delete') {
                    unset($d['reviews'][$i]);
                    break;
                }
                // Panelde yazılı yanıt her işlemde (onay/gizle/kaydet) birlikte kaydedilir.
                $r['reply'] = $reply;
                if ($action !== 'reply') $r['status'] = $action === 'approve' ? 'approved' : 'pending';
                break;
            }
            unset($r);
            $d['reviews'] = array_values($d['reviews']);
            return $d;
        });
        if (!$found) fail('Yorum bulunamadı.', 404);
        out(['ok' => true]);

    default:
        fail('Bilinmeyen işlem.');
}
