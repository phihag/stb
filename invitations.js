"use strict";

var WEEK_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function ParseException(message) {
   this.message = message;
   this.name = "ParseException";
}

function parse_dates(v) {
	var lines = v.split(/\n/);
	return $.map(lines, function(line) {
		var m = line.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})\s+([0-9]+)\.\s*Spieltag((\s+[A-Z]\/[A-Z])+)$/);
		if (!m) {
			throw new ParseException('Zeile "' + line + '" nicht richtig formatiert');
		}
		var matchups = $.map(m[5].trim().split(/\s+/), function(matchup_str) {
			var m = matchup_str.split("/");
			return {
				'home_team': m[0],
				'away_team': m[1],
			}
		});
		return {
			'day': parseInt(m[1], 10),
			'month': parseInt(m[2], 10),
			'year': parseInt(m[3], 10),
			'num_str': m[4],
			'matchups': matchups
		};
	});
}

function parse_teams(v) {
	var lines = v.split(/\n/);
	return $.map(lines, function(line) {
		var m = line.match(/^([A-Z])\s+([0-9]+)\s+(.+)$/);
		return {
			'character': m[1],
			'club_id': m[2],
			'name': m[3],
		}
	});
}

function read_input() {
	return {
		"dates": parse_dates($('#dates').val()),
		"teams": parse_teams($('#teams').val()),
		"league_name": $('#league_name').val(),
		"season_name": $('#season_name').val(),
		"abbrev": $('#abbrev').val(),
		"stb": $('#stb').val(),
		"default_time": $('#default_time').val(),
	}
}

function calc(input) {
	var teams_by_char = {};
	$.each(input.teams, function(_, team) {
		teams_by_char[team.character] = team;
	});

	var now = new Date();
	var data = $.extend({
		'today': (now.getDate() + '.' + (now.getMonth() + 1) + '.' + now.getFullYear())
	}, input);
	var rounds_dates = [
		input.dates.slice(0, input.dates.length / 2),
		input.dates.slice(input.dates.length / 2)
	];
	data.rounds = $.map(rounds_dates, function(dates) {
		var game_days = $.map(dates, function(date) {
			var games = $.map(date.matchups, function (matchup, mu_index) {
				var week_day = WEEK_DAYS[(new Date(date.year, date.month-1, date.day)).getDay()];
				return {
					'is_first_game_on_day': mu_index == 0,
					'is_second_game_on_day': mu_index == 1,
					'home_team': teams_by_char[matchup.home_team],
					'away_team': teams_by_char[matchup.away_team],
					'date_str': date.day + '.' + date.month + '.' + date.year,
					'time_str': input.default_time,
					'week_day': week_day
				}
			});
			return $.extend({
				'day_str': date.day + '.' + date.month + '.' + date.year,
				'games': games,
				'game_count': games.length,
				'game_count_minus_one': games.length - 1
			}, date);
		});
		return {
			'game_days': game_days
		}
	});
	return data;
}

function on_change() {
	var input = read_input();
	var data = calc(input);

	$('#output-invitations>*').remove();
	$.each(input.teams, function(_, team) {
		var li = $('<li>');
		var a = $('<a>');
		a.attr({'href': 'TODO'});
		a.text('Heimspiele ' + team.name + '.xlsx');
		a.appendTo(li);
		li.appendTo('#output-invitations');
	});

	if (!spielplan_template) {
		return;
	}
	var spielplan_html = Mustache.render(spielplan_template, data);
	var iframe = $('#output-spielplan');
	var iFrameDoc = iframe[0].contentDocument || iframe[0].contentWindow.document;
	iFrameDoc.write(spielplan_html);
	iFrameDoc.close();
}

var spielplan_template = null;
$.get('spielplan.mustache', function(template) {
	spielplan_template = template;
	on_change();
});

$(function() {
	var currentYear = new Date().getFullYear();
	$('#season_name').val('Saison ' + currentYear + '/' + (currentYear+1));
	on_change();

	$('#dates').on('input', on_change);
	$('#teams').on('input', on_change);
	$('#league_name').on('input', on_change);
	$('#season_name').on('input', on_change);
	$('#abbrev').on('input', on_change);
	$('#stb').on('input', on_change);
});