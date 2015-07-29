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
$matched = \preg_match('#^(?P<prefix>https?://turnier\.de/sport/)draw\.aspx\?id=(?P<id>[A-F0-9-]+)&draw=(?P<draw>[0-9]+)$#', $base_url, $m);
if (! $matched) {
	error('Invalid base_url', 400);
}
$url_prefix = $m['prefix'];

$gamelist_url = $url_prefix . 'drawmatches.aspx?id=' . $m['id'] . '&draw=' . $m['draw'];
$gamelist_html = \file_get_contents($gamelist_url);

$matched = \preg_match('#<table class="ruler matches">(.*?)</table>#s', $gamelist_html, $m);
if (! $matched) {
	error('Cannot find table', 500);
}
$gamelist_table = $m[1];

\preg_match_all('#
<td\s+class="plannedtime"[^>]*?>\s*
[A-Za-z]{2,3}\s+(?P<date>[0-9.]+)\s*
<span\s+class="time">(?P<time>[0-9:]+)</span>.*?
<a\s+class="teamname"\s+href="(?P<urlpath>[^"]*)">(?P<home_team_name>[^<]+)</a></td>
<td\s+align="center">-</td>.*?
<a\s+class="teamname"\s+href="[^"]*">(?P<away_team_name>[^<]+)</a></td>
#x', $gamelist_table, $lines, \PREG_SET_ORDER);
$res = \array_map(function($line) use ($url_prefix) {
	return [
		'date' => $line['date'],
		'time' => $line['time'],
		'home_team_name' => $line['home_team_name'],
		'away_team_name' => $line['away_team_name'],
		'url' => $url_prefix . $line['urlpath']
	];
}, $lines);

echo \json_encode([
	'status' => 'ok',
	'games' => $res
], \JSON_PRETTY_PRINT);