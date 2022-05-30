<?php

function error($message, $code) {
	$code_msg = $code == 400 ? 'Bad Request' : 'Internal Server Error';
	\header('HTTP/1.1 ' . $code . ' ' . $message);
	echo \json_encode([
		'status' => 'error',
		'message' => $message
	]);
	exit();
}

if (! isset($_GET['base_url'])) {
	error('Missing base_url', 400);
}

$base_url = $_GET['base_url'];
$matched = \preg_match('#^(?P<prefix>https?://(?:www\.|dbv\.)?turnier\.de/sport/)league/draw\?id=(?P<id>[A-F0-9-]+)&draw=(?P<draw>[0-9]+)$#', $base_url, $m);
if (! $matched) {
	error('Invalid base_url', 400);
}
$url_prefix = $m['prefix'];
$http_opts = [
    'http' => [
        'method' => 'GET',
        'header' => 'Cookie: st=s=2&m=0&c=1&cp=20\r\n',
    ]
];
$context = stream_context_create($http_opts);

$gamelist_url = $url_prefix . 'drawmatches.aspx?id=' . $m['id'] . '&draw=' . $m['draw'];
$gamelist_html = \file_get_contents($gamelist_url, false, $context);


$matched = \preg_match('#<table class="ruler matches">(.*?)</table>#s', $gamelist_html, $m);
if (! $matched) {
	error('Cannot find table', 500);
}
$gamelist_table = $m[1];

\preg_match_all('#
<td\s+class="plannedtime"[^>]*?>\s*
[A-Za-z]{2,3}\s+
(?P<date_day>[0-9]{1,2})\.\s?(?P<date_month>[0-9]{1,2})\.\s?(?P<date_year>[0-9]{4,})\s*
<span\s+class="time">(?P<time>[0-9:]+)</span>.*?
<a\s+class="teamname"\s+href="(?P<urlpath>[^"]*)">(?P<home_team_name>[^<]+)</a>(?:</strong>)?</td>
<td\s+align="center">-</td>.*?
<a\s+class="teamname"\s+href="[^"]*">(?P<away_team_name>[^<]+)</a>(?:</strong>)?</td>
<td>[^<]*</td>
(?:<td><a.*?>[^<]*</a></td>)?
(?:<td>[^<]*</td>)?
<td>(?P<hrt><img\s+id="[^"]*"\s+class="icon_homeawayreversed".*?)?</td>
#x', $gamelist_table, $lines, \PREG_SET_ORDER);

$res = \array_map(function($line) use ($url_prefix) {
	return [
		'date' => [
			'day' => \intval($line['date_day']),
			'month' => \intval($line['date_month']),
			'year' => \intval($line['date_year']),
		],
		'time_str' => $line['time'],
		'home_team_name' => $line['home_team_name'],
		'away_team_name' => $line['away_team_name'],
		'hrt' => \array_key_exists('hrt', $line),
		'url' => $url_prefix . $line['urlpath']
	];
}, $lines);

header("Content-Type: application/json");
echo \json_encode([
	'status' => 'ok',
	'games' => $res,
], \JSON_PRETTY_PRINT);
