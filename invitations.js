"use strict";

var WEEK_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function ParseException(message) {
   this.message = message;
   this.name = "ParseException";
}

function format_date(date) {
    var leading_zero = function(x) {
        if (x < 10) {
            return '0' + x;
        } else {
            return '' + x;
        }
    }
    return leading_zero(date.day) + '.' + leading_zero(date.month) + '.' + date.year;
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

var _FIELDS = ['dates_in', 'teams_in', 'league_name', 'season_name', 'abbrev', 'stb', 'default_time'];
function read_input() {
    var res = {};
    $.each(_FIELDS, function(_, f) {
        res[f] = $('#' + f).val();
    });
    return res;
}

function calc_home_games(team, state)  {
    var team_games = [];
    $.each(state.rounds, function(_, round) {
        $.each(round.game_days, function(_, game_day) {
            $.each(game_day.games, function(_, game) {
                if (game.home_team.name == team.name) {
                    team_games.push(game);
                }
            });
        });
    });
    return team_games;
}

function calc(input) {
    var now = new Date();
    var state = $.extend({
        'today': (now.getDate() + '.' + (now.getMonth() + 1) + '.' + now.getFullYear()),
        'dates': parse_dates(input.dates_in),
        'teams': parse_teams(input.teams_in)
    }, input);

    var teams_by_char = {};
    $.each(state.teams, function(_, team) {
        teams_by_char[team.character] = team;
    });
    var rounds_dates = [
        state.dates.slice(0, state.dates.length / 2),
        state.dates.slice(state.dates.length / 2)
    ];
    state.rounds = $.map(rounds_dates, function(dates) {
        var game_days = $.map(dates, function(date) {
            var games = $.map(date.matchups, function (matchup, mu_index) {
                var week_day = WEEK_DAYS[(new Date(date.year, date.month-1, date.day)).getDay()];
                return {
                    'is_first_game_on_day': mu_index == 0,
                    'is_second_game_on_day': mu_index == 1,
                    'home_team': teams_by_char[matchup.home_team],
                    'away_team': teams_by_char[matchup.away_team],
                    'date_str': format_date(date),
                    'time_str': state.default_time,
                    'week_day': week_day,
                    'daynum_str': date.num_str
                }
            });
            return $.extend({
                'num_str': date.num_str,
                'day_str': format_date(date),
                'games': games,
                'game_count': games.length,
                'game_count_minus_one': games.length - 1
            }, date);
        });
        return {
            'game_days': game_days
        }
    });
    return state;
}

function format_team_name(team) {
    return '(' + team.club_id + ') ' + team.name;
}

function make_plan(team) {
    var state = calc(current_input);

    var workbook = ExcelBuilder.createWorkbook();
    var ws = workbook.createWorksheet({name: team.name});
    var stylesheet = workbook.getStyleSheet();

    var data = [];

    var right_border_format = stylesheet.createFormat({
        border: {
            right: {color: 'FF000000', style: 'thin'}
        }
    });

    var team_name_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 14,
        },
        alignment: {
            vertical: 'center'
        },
        border: {
            bottom: {color: 'FF000000', style: 'thin'}
        }
    });
    data.push([
        '', '', {value: format_team_name(team), metadata: {style: team_name_format.id}}
    ]);
    ws.mergeCells('C1','G1');
    ws.setRowInstructions(0, {height: 36});

    var description_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
        },
        alignment: {
            vertical: 'center'
        }
    });
    var description_format_right = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'right'
        }
    });
    var input_field_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 11,
        },
        alignment: {
            vertical: 'center'
        },
        border: {
            bottom: {color: 'FF000000', style: 'thin'}
        }
    });

    data.push([
        '', '', {value: '(Vereinsnummer) Vereinsname, Mannschaftsnummer', metadata: {style: description_format.id}},
        '', '', '', '', '', '',
        {value: 'Kontaktperson des Teams', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}}
    ]);
    ws.mergeCells('C2', 'G2');
    ws.mergeCells('K2', 'M2');
    ws.setRowInstructions(1, {height: 20});


    data.push([
        '', '', '', '', '', '', '', '', '',
        {value: 'E-Mail', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}}
    ]);
    ws.mergeCells('K3', 'M3');
    ws.setRowInstructions(2, {height: 20});

    data.push([
        '', '', '', '', '', '', '', '', '',
        {value: 'Telefon', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}}
    ]);
    ws.mergeCells('K4', 'M4');
    ws.setRowInstructions(3, {height: 20});
    

    var header_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 11,
            bold: true
        },
        alignment: {
            vertical: 'center'
        },
    });
    data.push([
        {value: 'Heimspieltermine', metadata: {style: header_format.id}},
        '', '',
        {value: state.league_name, metadata: {style: header_format.id}},
        '', '', '', '', '',
        {value: state.season_name, metadata: {style: header_format.id}},
    ]);
    ws.mergeCells('A5', 'C5');
    ws.mergeCells('D5', 'G5');
    ws.setRowInstructions(4, {height: 30});

    data.push([]);
    ws.setRowInstructions(5, {height: 26});

    var title1_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 10
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center'
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            left: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'}
        }
    });
    var longtext_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
            italic: true
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center'
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            left: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'}
        }
    });
    data.push([
        {value: '', metadata: {style: title1_format.id}},
        {value: 'Verbandstermin', metadata: {style: title1_format.id}}, '', '',
        {value: 'endgültiger Termin', metadata: {style: title1_format.id}}, '', '',
        {value: '', metadata: {style: title1_format.id}}, '', '',
        {value: 'falls erforderlich:\nKenntnisnahme/Zustimmung\ndes Gastvereins liegt vor (ja/nein)', metadata: {style: longtext_format.id}},
        '', {value: '', metadata: {style: right_border_format.id}}
    ]);
    ws.mergeCells('B7', 'D7');
    ws.mergeCells('E7', 'G7');
    ws.mergeCells('H7', 'J7');
    ws.mergeCells('K7', 'M8');
    ws.setRowInstructions(6, {height: 30});

    var title2_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 10,
            italic: true
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center'
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'}
        }
    });
    var title2_format_right = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 10,
            italic: true
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center'
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'}
        }
    });
    data.push([
        {value: 'Spt.', metadata: {style: title2_format_right.id}},
        {value: 'Wt', metadata: {style: title2_format.id}},
        {value: 'Datum', metadata: {style: title2_format.id}},
        {value: 'Zeit', metadata: {style: title2_format_right.id}},
        {value: 'Wt', metadata: {style: title2_format.id}},
        {value: 'Datum', metadata: {style: title2_format.id}},
        {value: 'Zeit', metadata: {style: title2_format_right.id}},
        {value: 'Heimverein', metadata: {style: title2_format.id}},
        {value: '', metadata: {style: title2_format.id}},
        {value: 'Gastverein', metadata: {style: title2_format_right.id}}
    ]);


    var content_formatdict = {
        font: {
            fontName: 'Arial',
            size: 10
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center'
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'}
        }
    };
    var content_format = stylesheet.createFormat($.extend(true, {}, content_formatdict));
    var content_formatdict_right = $.extend(true, {}, content_formatdict);
    content_formatdict_right.border.right = {color: 'FF000000', style: 'thin'};
    var content_format_right = stylesheet.createFormat($.extend(true, {}, content_formatdict_right));
    var content_formatdict_left = $.extend(true, {}, content_formatdict);
    content_formatdict_left.border.left = {color: 'FF000000', style: 'thin'};
    var content_format_left = stylesheet.createFormat($.extend(true, {}, content_formatdict_left));
    var home_teamdict = $.extend(true, {}, content_formatdict_left);
    home_teamdict.alignment.horizontal = 'left';
    var home_team_format = stylesheet.createFormat($.extend(true, {}, home_teamdict));
    var away_teamdict = $.extend(true, {}, content_formatdict_right);
    away_teamdict.alignment.horizontal = 'left';
    var away_team_format = stylesheet.createFormat($.extend(true, {}, away_teamdict));

    var home_games = calc_home_games(team, state);
    $.each(home_games, function(game_index, home_game) {
        var row_index = 8 + game_index;
        data.push([
            {value: home_game.daynum_str, metadata: {style: content_format_right.id}},
            {value: home_game.week_day, metadata: {style: content_format_left.id}},
            {value: home_game.date_str, metadata: {style: content_format.id}},
            {value: home_game.time_str, metadata: {style: content_format_right.id}},
            {value: '', metadata: {style: content_format.id}},
            {value: '', metadata: {style: content_format.id}},
            {value: '', metadata: {style: content_format_right.id}},
            {value: format_team_name(home_game.home_team), metadata: {style: home_team_format.id}},
            {value: '-', metadata: {style: content_format_right.id}},
            {value: format_team_name(home_game.away_team), metadata: {style: away_team_format.id}},
            {value: '', metadata: {style: content_format.id}},
            {value: '', metadata: {style: content_format.id}},
            {value: '', metadata: {style: content_format_right.id}}
        ]);
        ws.setRowInstructions(row_index, {height: 30});
        ws.mergeCells('K' + (row_index + 1), 'M' + (row_index + 1));
    });

    ws.setColumns([
        {width: 3.4},
        {width: 3.4},
        {width: 9.8},
        {width: 5.8},
        {width: 3.4},
        {width: 9.8},
        {width: 5.8},
        {width: 25.0},
        {width: 2.0},
        {width: 25.0}
    ]);

    ws.setData(data);
    workbook.addWorksheet(ws);
    return workbook;
}

function write_plan(team, filename) {
    var workbook = make_plan(team);
    var wbout = ExcelBuilder.createFile(workbook, {type: 'blob'});

    saveAs(wbout, filename);
}

function write_overview(filename) {
    var state = calc(current_input);
    var spielplan_html = Mustache.render(spielplan_template, state);

    saveAs(new Blob([spielplan_html], {type: "text/html;charset=utf-8"}), filename);
}

var current_input;
function on_change() {
    current_input = read_input();
    var state = calc(current_input);

    function _file_link(name, func) {
        var li = $('<li>');
        var a = $('<a>');
        a.attr({'href': '#'});
        a.on('click', function(e) {
            e.preventDefault();
            func();
            return false;
        });
        a.text(name);
        a.appendTo(li);
        li.appendTo('#output-files');
    }
    $('#output-files>*').remove();
    var overview_fn = 'Spielplan_' + state.abbrev + '.html';
    _file_link(overview_fn, function() {
        write_overview(overview_fn);
    });
    $.each(state.teams, function(_, team) {
        var file_name = 'Heimspiele ' + team.name + '.xlsx';
        _file_link(file_name, function() {
            write_plan(team, file_name);
        });
    });

    if (!spielplan_template) {
        return;
    }
    var spielplan_html = Mustache.render(spielplan_template, state);
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

var presets = null;
$.getJSON('presets.json', function(loaded_presets) {
    presets = loaded_presets;
    $('#load').css({visibility: 'visible'});
    $('#load').on('submit', function(e) {
        e.preventDefault();
        var preset = presets[$('#load_preset').val()];
        $.each(_FIELDS, function(_, f) {
            $('#' + f).val(preset[f]);
        });
        on_change();
        return false;
    });

    $.each(Object.keys(presets), function(_, preset_name) {
        var option = $('<option>');
        option.text(preset_name);
        option.attr({value: preset_name});
        $('#load_preset').append(option);
    });
    $('#load').submit();
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