'use strict';

var WEEK_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function ParseError(message) {
   this.message = message;
   this.name = 'ParseError';
}
ParseError.prototype = Error.prototype;


function error(msg) {
    console.error(msg); // eslint-disable-line no-console
    alert(msg);
}

function _add_progress(button) {
    var progress = $('<img class="progress" title="Kontaktiere Server ..." />');
    progress.attr({
        src: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==',
    });
    button.insertBefore(progress[0], button.firstChild);
    button.setAttribute('disabled', 'disabled');
}

function _remove_progress(button) {
    $(button).children('.progress').remove();
    button.removeAttribute('disabled');
}

function _read_file(f, callback) {
    var reader = new FileReader();
    if (reader.readAsBinaryString) {
        reader.onload = function(e) {
            var data = e.target.result;
            callback(data);
        };
        reader.readAsBinaryString(f);
        return;
    }

    // old IE
    reader.onload = function(e) {
        var buffer = e.target.result;
        var data = '';
        var bytes = new Uint8Array(buffer);
        var length = bytes.byteLength;
        for (var i = 0; i < length; i++) {
            data += String.fromCharCode(bytes[i]);
        }
        callback(data);
    };
    reader.readAsArrayBuffer(f);
    return;
}

function _leading_zero(x) {
    if (x < 10) {
        return '0' + x;
    } else {
        return '' + x;
    }
}

function _filter_array_inplace(ar, func) {
    for (var i = ar.length - 1;i >= 0;i--) {
        if (! func(ar[i])) {
            ar.splice(i, 1);
        }
    }
}

function week_day(date) {
    return WEEK_DAYS[(new Date(date.year, date.month-1, date.day)).getDay()];
}

function is_sunday(date) {
    return (new Date(date.year, date.month-1, date.day)).getDay() === 0;
}

function iso8601(date) {
    return date.year + '-' + _leading_zero(date.month) + '-' + _leading_zero(date.day);
}

function format_date(date) {
    return _leading_zero(date.day) + '.' + _leading_zero(date.month) + '.' + date.year;
}

function parse_iso8601(s) {
    var m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (!m) {
        throw new ParseError('Nicht ISO8601: ' + s);
    }
    return {
        'year': parseInt(m[1]),
        'month': parseInt(m[2]),
        'day': parseInt(m[3]),
    };
}

function parse_date(s) {
    var m = s.match(/^([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{4})$/);
    if (!m) {
        return parse_iso8601(s);
    }
    return {
        'day': parseInt(m[1]),
        'month': parseInt(m[2]),
        'year': parseInt(m[3]),
    };
}

function parse_dates(v) {
    var lines = v.split(/\n/);
    return $.map(lines, function(line) {
        var m = line.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})\s+([0-9]{1,2}:[0-9]{2})\s+([0-9]+)\.\s*Spieltag((\s+[A-Z]\/[A-Z])+)$/);
        if (!m) {
            throw new ParseError('Zeile "' + line + '" nicht richtig formatiert');
        }
        var matchups = $.map(m[6].trim().split(/\s+/), function(matchup_str) {
            var mum = matchup_str.split('/');
            return {
                'home_team': mum[0],
                'away_team': mum[1],
                'num_str': m[5],
            };
        });
        return {
            'day': parseInt(m[1], 10),
            'month': parseInt(m[2], 10),
            'year': parseInt(m[3], 10),
            'date_default_time_str': m[4],
            'num_str': m[5],
            'matchups': matchups,
        };
    });
}

function parse_teams(v) {
    var lines = v.split(/\n/);
    return $.map(lines, function(line) {
        var m = line.match(/^([A-Z])\s+(\*?[-0-9]+\*?)\s+(.+)$/);
        if (!m) {
            return {};
        }
        return {
            'character': m[1],
            'club_id': m[2],
            'name': m[3],
        };
    });
}

var current_adjournments = [];
var current_hrts = [];
var _FIELDS = [
    'dates_in', 'teams_in', 'league_name', 'season_name', 'abbrev', 'stb',
    'kroton_url'];
function read_input() {
    var res = {};
    $.each(_FIELDS, function(_, f) {
        res[f] = $('#' + f).val();
    });
    res.adjournments = current_adjournments;
    res.hrts = current_hrts;
    res.key = res.league_name + ' ' + res.season_name;
    return res;
}

function calc_home_games(team, state)  {
    return $.grep(calc_games(state), function(game) {
        return game.home_team.name == team.name;
    });
}

function calc_games(state) {
    var games = [];
    $.each(state.rounds, function(_, round) {
        $.each(round.games, function(_, game) {
            games.push(game);
        });
    });
    return games;
}

function _compare_date(d1, d2) {
    var d1_repr = iso8601(d1);
    var d2_repr = iso8601(d2);
    if (d1_repr > d2_repr) {
        return 1;
    }
    if (d1_repr < d2_repr) {
        return -1;
    }
    return 0;
}

function _unify_team_name(name) {
    var res = (
        name
        .replace('Sterkrade-N.', 'Sterkrade-Nord')
        .replace('SC Union 08 Lüdinghausen', 'Union Lüdinghausen')
        .replace('SV Bergfried Leverkusen', 'SV Bergfried Lev.')
        .replace(/^\s*\(\*?[-0-9]+\*?\)\s+/, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .toLowerCase());

    return res;
}

function find_game(state, home_name, away_name) {
    var home_name_search = _unify_team_name(home_name);
    var away_name_search = _unify_team_name(away_name);

    for (var i = 0;i < state.rounds.length;i++) {
        var games = state.rounds[i].games;
        for (var j = 0;j < games.length;j++) {
            var game = games[j];
            var home_eq = _unify_team_name(game.original_home_team.name) == home_name_search;
            var away_eq = _unify_team_name(game.original_away_team.name) == away_name_search;
            if (home_eq && away_eq) {
                return game;
            }
        }
    }
    return undefined;
}

function calc(input) {
    if (!input.hrts) {
        throw new Error('missing hrts!');
    }
    var now = new Date();
    var state = $.extend({
        'today': (now.getDate() + '.' + (now.getMonth() + 1) + '.' + now.getFullYear()),
        'dates': parse_dates(input.dates_in),
        'teams': parse_teams(input.teams_in),
        'adjournments': input.adjournments,
        'hrts': input.hrts,
    }, input);

    state.input_base64 = btoa(JSON.stringify(input));

    if (state.teams.length < 2) {
        state.rounds = [];
        return state;
    }

    var adjourned_games = {};
    $.each(state.adjournments, function(_, a) {
        adjourned_games[a.game_num] = a;
    });

    var teams_by_char = {};
    $.each(state.teams, function(_, team) {
        teams_by_char[team.character] = team;
    });
    var rounds_dates = [
        state.dates.slice(0, state.dates.length / 2),
        state.dates.slice(state.dates.length / 2),
    ];
    var all_games = [];
    state.rounds = $.map(rounds_dates, function(dates) {
        var games = [];

        $.each(dates, function(date_index, date) {
            $.each(date.matchups, function(mu_index, matchup) {
                var game = {
                    'original_home_team': teams_by_char[matchup.home_team],
                    'original_away_team': teams_by_char[matchup.away_team],
                    'daynum_str': matchup.num_str,
                    daynum_idx: mu_index,
                    daynum_count: date.matchups.length,
                    daynum_is_first: (mu_index === 0),
                    daynum_is_second: (mu_index === 1),
                    daynum_count_minus1: (date.matchups.length - 1),
                    'game_num': all_games.length,

                    'original_date': date,
                    'original_date_str': format_date(date),
                    'original_time_str': date.date_default_time_str,
                    'original_week_day': week_day(date),
                };

                game.hrt = (state.hrts.indexOf(game.game_num) > -1);
                game.home_team = game.hrt ? game.original_away_team : game.original_home_team;
                game.away_team = game.hrt ? game.original_home_team : game.original_away_team;

                var adj = adjourned_games[game.game_num];
                if (adj) {
                    game.adjourned = true;
                    game.date = adj.date;
                    game.date_str = format_date(game.date);
                    game.time_str = adj.time;
                    game.week_day = week_day(game.date);
                } else {
                    game.adjourned = false;
                    game.date = game.original_date;
                    game.date_str = game.original_date_str;
                    game.time_str = game.original_time_str;
                    game.week_day = game.original_week_day;
                }
                game.adjourned_date = game.original_date_str != game.date_str;
                game.adjourned_weekday = game.original_week_day != game.week_day;
                game.adjourned_time = game.original_time_str != game.time_str;

                games.push(game);
                all_games.push(game);
            });
        });

        var sorted_games = games.slice();
        sorted_games.sort(function(g1, g2) {
            // Compare by date
            var cmp = _compare_date(g1.date, g2.date);
            if (cmp != 0) {
                return cmp;
            }

            // Compare by time
            if (g1.time_str > g2.time_str) {
                return 1;
            }
            if (g1.time_str < g2.time_str) {
                return -1;
            }

            // Compare by game number
            if (g1.game_num > g2.game_num) {
                return 1;
            }
            if (g1.game_num < g2.game_num) {
                return -1;
            }
            return 0;
        });

        var today = null;
        var games_today = [];
        var endofday = function() {
            var separate_daynums = !games_today.every(function(g) {
                return g.daynum_str === games_today[0].daynum_str;
            });
            $.each(games_today, function(idx, game) {
                var game_count = separate_daynums  ? 1 : games_today.length;
                game.is_all_games = parseInt(state.teams.length / 2) == games_today.length;
                game.is_multigame_day = (game_count > 1) && !separate_daynums;
                game.is_first_game_on_day = ((idx == 0) || separate_daynums);
                game.is_second_game_on_day = ((idx == 1) && !separate_daynums);
                game.game_count = game_count;
                game.game_count_minus_one = game_count - 1;
            });
        };
        $.each(sorted_games, function(_, game) {
            var d = iso8601(game.date);
            if (d == today) {
                games_today.push(game);
                return;
            }
            endofday();
            games_today = [game];
            today = d;
        });
        endofday();

        return {
            'games': games,
            'sorted_games': sorted_games,
        };
    });
    return state;
}

function format_team_name(team) {
    return '(' + team.club_id + ') ' + team.name;
}

function _xlsx_make_style(stylesheet, orig_dict, changes_dict) {
    var d = {};
    if (changes_dict) {
        $.extend(true, d, orig_dict, changes_dict);
    } else {
        $.extend(true, d, orig_dict);
    }
    return stylesheet.createFormat(d);
}

function make_plan(team) {
    var state = calc(current_input);

    var workbook = ExcelBuilder.createWorkbook();
    var ws = workbook.createWorksheet({name: team.name});
    ws.sheetProtection = true;
    var stylesheet = workbook.getStyleSheet();

    var data = [];

    var right_top_border_format = stylesheet.createFormat({
        border: {
            top: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
        },
        protection: {'locked': false},
    });
    var right_border_format = stylesheet.createFormat({
        border: {
            right: {color: 'FF000000', style: 'thin'},
        },
        protection: {'locked': false},
    });

    var team_name_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 14,
        },
        alignment: {
            vertical: 'center',
        },
        border: {
            bottom: {color: 'FF000000', style: 'thin'},
        },
        protection: {'locked': false},
    });
    data.push([
        '', '', {value: format_team_name(team), metadata: {style: team_name_format.id}},
        {value: '', metadata: {style: team_name_format.id}}, // D
        {value: '', metadata: {style: team_name_format.id}}, // E
        {value: '', metadata: {style: team_name_format.id}}, // F
        {value: '', metadata: {style: team_name_format.id}}, // G
    ]);
    ws.mergeCells('C1','G1');
    ws.setRowInstructions(0, {height: 36});

    var description_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
        },
        alignment: {
            vertical: 'center',
        },
    });
    var description_format_right = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'right',
        },
    });
    var str_numfmt = stylesheet.createNumberFormatter('@');
    var input_field_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 11,
        },
        alignment: {
            vertical: 'center',
        },
        border: {
            bottom: {color: 'FF000000', style: 'thin'},
        },
        protection: {'locked': false},
        format: str_numfmt.id,
    });

    data.push([
        '', '', {value: '(Vereinsnummer) Vereinsname, Mannschaftsnummer', metadata: {style: description_format.id}},
        '', '', '', '', '', '',
        {value: 'Kontaktperson des Teams', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
    ]);
    ws.mergeCells('C2', 'H2');
    ws.mergeCells('K2', 'M2');
    ws.setRowInstructions(1, {height: 20});


    data.push([
        '', '', '', '', '', '', '', '', '',
        {value: 'E-Mail', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
    ]);
    ws.mergeCells('K3', 'M3');
    ws.setRowInstructions(2, {height: 20});

    data.push([
        '', '', '', '', '', '', '', '', '',
        {value: 'Telefon', metadata: {style: description_format_right.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
        {value: '', metadata: {style:input_field_format.id}},
    ]);
    ws.mergeCells('K4', 'M4');
    ws.setRowInstructions(3, {height: 20});
    

    var header_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 11,
            bold: true,
        },
        alignment: {
            vertical: 'center',
        },
    });
    data.push([
        {value: 'Heimspieltermine', metadata: {style: header_format.id}},
        '', '',
        {value: state.league_name, metadata: {style: header_format.id}},
        '', '', '',
        {value: 'StB: ' + state.stb, metadata: {style: header_format.id}},
        '',
        {value: state.season_name, metadata: {style: header_format.id}},
    ]);
    ws.mergeCells('A5', 'C5');
    ws.mergeCells('D5', 'G5');
    ws.mergeCells('H5', 'I5');
    ws.setRowInstructions(4, {height: 30});

    data.push([]);
    ws.setRowInstructions(5, {height: 26});

    var title1_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 10,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center',
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            left: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
        },
    });
    var longtext_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 9,
            italic: true,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center',
            wrapText: true,
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            left: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'},
        },
    });
    data.push([
        {value: '', metadata: {style: title1_format.id}},
        {value: 'Verbandstermin', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: 'endgültiger Termin', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: '', metadata: {style: title1_format.id}},
        {value: 'Kenntnisnahme/Zustimmung\ndes Gastvereins liegt vor', metadata: {style: longtext_format.id}},
        {value: '', metadata: {style: longtext_format.id}},
        {value: '', metadata: {style: right_top_border_format.id}},
    ]);
    ws.mergeCells('B7', 'D7');
    ws.mergeCells('E7', 'G7');
    ws.mergeCells('H7', 'J7');
    ws.mergeCells('K7', 'M8');
    ws.setRowInstructions(6, {height: 30});

    var title2_format_dict = {
        font: {
            fontName: 'Arial',
            size: 10,
            italic: true,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center',
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'},
        },
    };
    var title2_format = stylesheet.createFormat($.extend(true, {}, title2_format_dict));
    var title2_format_right_dict = $.extend(true, {}, title2_format_dict);
    title2_format_right_dict.border.right = {color: 'FF000000', style: 'thin'};
    var title2_format_right = stylesheet.createFormat(title2_format_right_dict);

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
        {value: 'Gastverein', metadata: {style: title2_format_right.id}},
        {value: '', metadata: {style: title2_format.id}},
        {value: '', metadata: {style: title2_format.id}},
        {value: '', metadata: {style: right_border_format.id}},
    ]);

    var content_format_dict = {
        font: {
            fontName: 'Arial',
            size: 10,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center',
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'},
        },
    };
    var content_format = _xlsx_make_style(stylesheet, content_format_dict);
    var content_format_changeable = _xlsx_make_style(stylesheet, content_format_dict, {
        protection: {'locked': false},
        format: str_numfmt.id,
    });
    var content_format_changeable_right = _xlsx_make_style(stylesheet, content_format_dict, {
        protection: {'locked': false},
        border: {right: {color: 'FF000000', style: 'thin'}},
        format: str_numfmt.id,
    });
    var content_format_hrt_row = _xlsx_make_style(stylesheet, content_format_dict, {
        protection: {'locked': false},
        border: {
            top: {style: 'none'},
            bottom: {style: 'none'},
        },
        format: str_numfmt.id,
    });

    var content_formatdict_right = $.extend(true, {}, content_format_dict);
    content_formatdict_right.border.right = {color: 'FF000000', style: 'thin'};
    var content_format_right = stylesheet.createFormat($.extend(true, {}, content_formatdict_right));
    var content_formatdict_left = $.extend(true, {}, content_format_dict);
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
        var date_changed = (
            (home_game.original_week_day !== home_game.week_day) ||
            (home_game.original_date_str !== home_game.date_str) ||
            (home_game.original_time_str !== home_game.time_str)
        );
        var row_index = 8 + game_index;
            data.push([
            {value: home_game.daynum_str, metadata: {style: content_format_right.id}},
            {value: home_game.original_week_day, metadata: {style: content_format_left.id}},
            {value: home_game.original_date_str, metadata: {style: content_format.id}},
            {value: home_game.original_time_str, metadata: {style: content_format_right.id}},
            {value: (date_changed ? home_game.week_day : ''), metadata: {style: content_format_changeable.id}},
            {value: (date_changed ? home_game.date_str : ''), metadata: {style: content_format_changeable.id}},
            {value: (date_changed ? home_game.time_str : ''), metadata: {style: content_format_changeable_right.id}},
            {value: format_team_name(home_game.home_team), metadata: {style: home_team_format.id}},
            {value: '-', metadata: {style: content_format.id}},
            {value: format_team_name(home_game.away_team), metadata: {style: away_team_format.id}},
            {value: '', metadata: {style: content_format_changeable.id}},
            {value: '', metadata: {style: content_format_changeable.id}},
            {value: '', metadata: {style: content_format_changeable_right.id}},
            {value: (home_game.hrt ? 'HRT' : ''), metadata: {style: content_format_hrt_row.id}},
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
        {width: 25.0},
    ]);

    ws.setData(data);
    workbook.addWorksheet(ws);
    return workbook;
}

function make_xlsx_overview() {
    var state = calc(current_input);

    var workbook = ExcelBuilder.createWorkbook();
    var ws_name = state.abbrev;
    var ws = workbook.createWorksheet({name: ws_name});
    var stylesheet = workbook.getStyleSheet();

    var data = [];

    var header_format = stylesheet.createFormat({
        font: {
            fontName: 'Arial',
            size: 10,
            bold: true,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'center',
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            fgColor: 'FFCCFFCC',
        },
        border: {
            top: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'},
            left: {color: 'FF000000', style: 'thin'},
        },
    });

    var content_format_dict = {
        font: {
            fontName: 'Arial',
            size: 10,
        },
        alignment: {
            vertical: 'center',
            horizontal: 'left',
        },
        border: {
            left: {color: 'FF000000', style: 'thin'},
            top: {color: 'FF000000', style: 'thin'},
            right: {color: 'FF000000', style: 'thin'},
            bottom: {color: 'FF000000', style: 'thin'},
        },
    };
    var content_format = _xlsx_make_style(stylesheet, content_format_dict);

    var ASPECT_ATTRS = {
        'center': {alignment: {horizontal: 'center'}},
        'bold': {font: {bold: true}},
        'last': {
            border: {
                bottom: {color: 'FF000000', style: 'thick'},
            }
        },
        'alt_origday': {
            alignment: {horizontal: 'center', vertical: 'center', textRotation: 90},
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: 'FFFFFF99',
            },
        },
    };
    var _styles = {};
    function _refstyle(aspects_str) {
        if (!_styles[aspects_str]) {
            var attrs = {};
            var aspects = aspects_str.split(' ');
            for (var i = 0;i < aspects.length;i++) {
                $.extend(true, attrs, ASPECT_ATTRS[aspects[i]]);
            }
            _styles[aspects_str] = _xlsx_make_style(stylesheet, content_format_dict, attrs);
        }
        return {style: _styles[aspects_str].id};
    }

    function _write_header() {
        data.push([
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: state.league_name, metadata: _refstyle('bold center')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: state.stb, metadata: _refstyle('center')},
        ]);
        ws.mergeCells('C' + data.length, 'H' + data.length);
        ws.setRowInstructions(data.length - 1, {height: 20});

        var now = new Date();
        data.push([
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: state.season_name, metadata: _refstyle('center')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: '', metadata: _refstyle('')},
            {value: (now.getDate() + '.' + (now.getMonth() + 1) + '.' + now.getFullYear()), metadata: _refstyle('center')},
        ]);
        ws.mergeCells('C' + data.length, 'H' + data.length);
        ws.setRowInstructions(data.length - 1, {height: 20});

        ws.mergeCells('A' + (data.length - 1), 'B' + data.length);

        data.push([
            {value: 'Spt', metadata: {style: header_format.id}},
            {value: 'WT', metadata: {style: header_format.id}},
            {value: 'Datum', metadata: {style: header_format.id}},
            {value: 'Zeit', metadata: {style: header_format.id}},
            {value: 'HRT', metadata: {style: header_format.id}},
            {value: 'Heim', metadata: {style: header_format.id}},
            {value: '', metadata: {style: header_format.id}},
            {value: 'Gast', metadata: {style: header_format.id}},
            {value: '', metadata: {style: header_format.id}},
        ]);
        ws.setRowInstructions(data.length - 1, {height: 20});
        ws.mergeCells('F' + data.length, 'G' + data.length);
        ws.mergeCells('H' + data.length, 'I' + data.length);
    }

    _write_header();

    $.each(state.rounds, function(_, round) {
        var round_games = round.sorted_games;
        $.each(round_games, function(_, game) {
            var first_cell = {value: ('' + game.daynum_str), _refstyle: 'center'};
            var row = [
                first_cell,
                {value: game.week_day, _refstyle: (game.adjourned_weekday ? 'bold center' : 'center')},
                {value: game.date_str, _refstyle: (game.adjourned_date ? 'bold center' : 'center')},
                {value: game.time_str, _refstyle: (game.adjourned_time ? 'bold center' : 'center')},
                {value: (game.hrt ? 'HRT' : ''), _refstyle: 'center'},
                {value: game.home_team.character, _refstyle: 'center'},
                {value: game.home_team.name, _refstyle: ''},
                {value: game.away_team.character, _refstyle: 'center'},
                {value: game.away_team.name, _refstyle: ''},
            ];

            var is_last_row = game.daynum_idx === game.daynum_count - 1;
            row.forEach(function(cell) {
                if (is_last_row) {
                    cell._refstyle += ' last';
                }
                cell.metadata = _refstyle(cell._refstyle);
            });

            data.push(row);
            if (game.is_multigame_day && game.is_first_game_on_day) {
                ws.mergeCells('A' + data.length, 'A' + (data.length + game.game_count - 1));
            }
            ws.setRowInstructions(data.length - 1, {
                height: 20,
            });
        });
    });

    ws.setColumns([
        {width: 5},
        {width: 5},
        {width: 13},
        {width: 7},
        {width: 4.8},
        {width: 3},
        {width: 25},
        {width: 3},
        {width: 25},
    ]);

    ws.setData(data);
    workbook.addWorksheet(ws);
    return workbook;
}

function make_overview() {
    var state = calc(current_input);
    return Mustache.render(spielplan_template, state);
}

function adjournments_update_display(state) {
    var games = calc_games(state);

    var adjourned_games = {};
    $.each(state.adjournments, function(_, a) {
        adjourned_games[a.game_num] = a;
    });

    // Update "add" input
    var list_node = $('#adjournment_add [name="game"]');
    list_node.empty();
    $.each(games, function(_, game) {
        if (adjourned_games[game.game_num]) {
            return;
        }
        var n = document.createElement('option');
        n.setAttribute('value', game.game_num);
        $(n).text(
            game.home_team.name + ' - ' + game.away_team.name +
            ' (' + game.original_date_str + ' ' + game.original_time_str + ')');
        list_node.append(n);
    });

    // Update "hrt" input
    var hrt_list_node = $('#hrt_add [name="game"]');
    hrt_list_node.empty();
    var teams = state.teams;
    $.each(games, function(_, game) {
        var is_hrt = state.hrts.indexOf(game.game_num) > -1;
        if (is_hrt) {
            return;
        }

        var n = document.createElement('option');
        n.setAttribute('value', game.game_num);
        $(n).text(
            game.home_team.name + ' - ' + game.away_team.name);
        hrt_list_node.append(n);
    });

    var none = $('#adjournment_list_container .adjournment_list_empty');
    if (state.adjournments.length == 0) {
        none.show();
    } else {
        none.hide();
    }

    var lst = $('#adjournment_list_container .adjournment_list');
    lst.empty();
    $.each(state.adjournments, function(_, adj) {
        var node = $('<li>');
        var game = games[adj.game_num];
        var label = (
            game.home_team.name + ' - ' + game.away_team.name + ' ' +
            format_date(game.original_date) + ' ' + game.original_time_str + ' → ' +
            week_day(adj.date) + ' ' + format_date(adj.date) + ' ' + adj.time);
        if (game.is_online_different !== undefined) {
            node.text((game.is_online_different ? '✖' : '✔') + ' ');

            var a = $('<a>');
            node.append(a);
            a.text(label);
            a.attr({href: game.online_url});
        } else {
            node.text(label);
        }
        lst.append(node);

        var remove_btn = $('<button>');
        remove_btn.text('-');
        remove_btn.on('click', function() {
            for (var i = 0;i < current_adjournments.length;i++) {
                if (current_adjournments[i].game_num == adj.game_num) {
                    current_adjournments.splice(i, 1);
                    on_change();
                    return;
                }
            }
        });
        node.append(remove_btn);
    });

    var hrt_lst = $('#adjournment_list_container .hrt_list');
    hrt_lst.empty();
    $.each(state.hrts, function(_, hrt) {
        var node = $('<li>');
        var game = games[hrt];
        var label = 'HRT ' + game.original_home_team.name + ' - ' + game.original_away_team.name;
        node.text(label);
        lst.append(node);
    });

    adjournment_add_on_input();
}

function adjournment_add_on_input() {
    var state = calc(current_input);
    var games = calc_games(state);
    if (games.length == 0) {
        return;
    }
    var game_num_str = $('#adjournment_add [name="game"]').val();
    if ((game_num_str === '') || (game_num_str === null)) {
        return;
    }
    var g = games[parseInt(game_num_str)];
    $('#adjournment_add [name="date"]').val(iso8601(g.original_date));
    $('#adjournment_add [name="time"]').val(g.time_str);
}

function rematch(games, game) {
    for (var i = 0;i < games.length;i++) {
        var g = games[i];
        if ((g.home_team.character === game.away_team.character) && (g.away_team.character === game.home_team.character)) {
            return g;
        }
    }
    throw new Error('Cannot find rematch of ' + JSON.stringify(game));
}

function hrt_add(e) {
    e.preventDefault();

    var game_str = $('#hrt_add [name="game"]').val();
    var game_num = parseInt(game_str, 10);

    var state = calc(current_input);
    var games = calc_games(state);

    var g = games[game_num];
    var reg = rematch(games, g);
    current_hrts.push(g.game_num);
    current_hrts.push(reg.game_num);

    on_change();
    return false;
}

function adjournment_add(e) {
    e.preventDefault();
    current_adjournments.push({
        game_num: $('#adjournment_add [name="game"]').val(),
        date: parse_iso8601($('#adjournment_add [name="date"]').val()),
        time: $('#adjournment_add [name="time"]').val(),
    });
    on_change();
    return false;
}

function _jsxlsx_decode_date(workbook, cell) {
    if (!cell) {
        return null;
    }
    var date1904 = workbook.WBProps ? workbook.WBProps.date1904 : false;
    if (cell.t == 's') {
        if (!cell.w) {
            return null;
        }
        return parse_date(cell.w);
    }
    var date_obj = XLSX.SSF.parse_date_code(cell.v, {date1904: date1904});
    return {
        day: date_obj.d,
        month: date_obj.m,
        year: date_obj.y,
    };
}

function _jsxlsx_decode_time(cell) {
    if (!cell) {
        return null;
    }
    var res = ('' + cell.w);
    res = res.trim();
    res = res.replace(/^([0-9]{2})\.([0-9]{2})$/, function(_, h, m) {
        return h + ':' + m;
    });
    return res;
}

function adjournment_import(e) {
    var state = calc(current_input);
    var games = calc_games(state);

    var files = e.target.files;
    for (var i = 0;i < files.length;i++) {
        var f = files[i];
        _read_file(f, function(data) {
            var workbook = XLSX.read(data, {type: 'binary'});
            var ws = workbook.Sheets[workbook.SheetNames[0]];

            // E9 - G15
            var row_start = 8;
            for (var row = row_start;row < row_start + state.teams.length + 10;row++) {
                var home_name_cell = ws[XLSX.utils.encode_cell({c:7, r:row})];
                var away_name_cell = ws[XLSX.utils.encode_cell({c:9, r:row})];
                if (!home_name_cell || !away_name_cell) {
                    continue;
                }
                var home_name = home_name_cell.w;
                var away_name = away_name_cell.w;
                if (!home_name || !away_name) {
                    continue;
                }

                if (row == row_start) {
                    _filter_array_inplace(current_adjournments, function(adj) {
                        var g = games[parseInt(adj.game_num)];
                        return _unify_team_name(g.home_team.name) != _unify_team_name(home_name);
                    });
                }

                var date_cell = ws[XLSX.utils.encode_cell({c:5, r:row})];
                var date = _jsxlsx_decode_date(workbook, date_cell);
                if (!date) {
                    continue;
                }
                var time_cell = ws[XLSX.utils.encode_cell({c:6, r:row})];
                var time = _jsxlsx_decode_time(time_cell);

                var game = find_game(state, home_name, away_name);
                if (!game) {
                    error('Spiel ' + home_name + ' vs ' + away_name + ' konnte nicht gefunden werden.');
                    continue;
                }

                if ((_compare_date(date, game.original_date) == 0) && (time == game.original_time_str)) {
                    continue;
                }

                var adj = {
                    game_num: game.game_num,
                    date: date,
                    time: time,
                };
                current_adjournments.push(adj);
            }

            on_change();
        });
    }
    $('#adjournment_import')[0].reset();
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
        saveAs(
            new Blob([make_overview()], {type: 'text/html;charset=utf-8'}),
            overview_fn);
    });
    var xlsx_overview_fn = 'Spielplan_' + state.abbrev + '.xlsx';
    _file_link(xlsx_overview_fn, function() {
        saveAs(
            ExcelBuilder.createFile(make_xlsx_overview(), {type: 'blob'}),
            xlsx_overview_fn);
    });
    $.each(state.teams, function(_, team) {
        var file_name = 'Heimspiele ' + team.name + '.xlsx';
        _file_link(file_name, function() {
            saveAs(
                ExcelBuilder.createFile(make_plan(team), {type: 'blob'}),
                file_name);
        });
    });
    var data_fn = state.abbrev + '.json';
    _file_link(data_fn, function() {
        saveAs(new Blob(
            [JSON.stringify(current_input, undefined, 2)],
            {type: 'application/json;charset=utf-8'}), data_fn);
    });
    _file_link('Alle Dateien als zip', function() {
        var zip = new JSZip();
        zip.file(overview_fn, make_overview(false), {binary: false});
        var overview_xlsx = ExcelBuilder.createFile(make_xlsx_overview(), {type: 'base64'});
        zip.file(xlsx_overview_fn, overview_xlsx, {binary: true, base64: true});
        $.each(state.teams, function(_, team) {
            var file_name = 'Heimspiele ' + team.name + '.xlsx';
            var contents = ExcelBuilder.createFile(make_plan(team), {type: 'base64'});
            zip.file(file_name, contents, {binary: true, base64: true});
        });
        var zip_content = zip.generateAsync({type: 'blob'}).then(function(zip_content) {
            saveAs(zip_content, 'Spielpläne ' + state.abbrev + '.zip');
        });
    });

    if (spielplan_template) {
        var spielplan_html = Mustache.render(spielplan_template, state);
        var iframe = $('#output-spielplan');
        var iFrameDoc = iframe[0].contentDocument || iframe[0].contentWindow.document;
        iFrameDoc.write(spielplan_html);
        iFrameDoc.close();
    }

    adjournments_update_display(state);
}

function _download_online(on_done, btn) {
    var state = calc(current_input);

    _add_progress(btn);
    $.ajax('get_kroton_adjournments.php', {
        dataType: 'json',
        method: 'GET',
        data: {
            base_url: state.kroton_url,
        },
    }).done(function(json_doc) {
        _remove_progress(btn);

        var online_games = json_doc.games;
        if (online_games.length == 0) {
            error('Online konnten keine Spiele gefunden werden!');
            return;
        }

        for (var i = 0;i < online_games.length;i++) {
            var online_game = online_games[i];

            var home_team_name = online_game.hrt ? online_game.away_team_name : online_game.home_team_name;
            var away_team_name = online_game.hrt ? online_game.home_team_name : online_game.away_team_name;
            var local_game = find_game(state, home_team_name, away_team_name);
            if (! local_game) {
                error('Spiel ' + home_team_name + ' vs ' + away_team_name + ' kann lokal nicht gefunden werden!');
                return;
            }

            local_game.online_url = online_game.url;
            local_game.online_date = online_game.date;
            local_game.online_time_str = online_game.time_str;
            local_game.online_hrt = online_game.hrt;
        }

        on_done(state);
    }).fail(function() {
        _remove_progress(btn);
        error('Could not get online data!');
    });
}

function adjournment_compare_online(e) {
    _download_online(function(state) {
        var games = calc_games(state);
        $.each(games, function(_, g) {
            g.is_online_different = (
                (_compare_date(g.online_date, g.date) != 0) ||
                (g.online_time_str != g.time_str)
            );

            if ((! g.adjourned) && (g.is_online_different)) {
                current_adjournments.push({
                    game_num: g.game_num,
                    date: g.date,
                    time: g.time_str,
                });
            }
        });
        adjournments_update_display(state);
    }, e.target);
}

function adjournment_import_online(e) {
    _download_online(function(state) {
        // Empty all current adjournments
        current_adjournments.splice(0, current_adjournments.length);
        state.adjournments = current_adjournments;
        current_hrts.splice(0, current_hrts.length);
        state.hrts = current_hrts;

        var games = calc_games(state);
        $.each(games, function(_, g) {
            var is_online_different = (
                (_compare_date(g.online_date, g.original_date) != 0) ||
                (g.online_time_str != g.original_time_str) ||
                g.online_hrt
            );

            if (is_online_different) {
                current_adjournments.push({
                    game_num: g.game_num,
                    date: g.online_date,
                    time: g.online_time_str,
                });
            }

            g.hrt = g.online_hrt;
            if (g.hrt) {
                state.hrts.push(g.game_num);
            }
        });

        adjournments_update_display(state);
        on_change(state);
    }, e.target);
}


var spielplan_template = null;
$.get('spielplan.mustache', function(template) {
    spielplan_template = template;
    on_change();
});

function _find(ar, func) {
    for (var i = 0;i < ar.length;i++) {
        if (func(ar[i])) {
            return ar[i];
        }
    }
}

var presets = null;
$.ajax({
    dataType: 'json',
    url: `presets.json?ts=${Date.now()}`,
    success: function(loaded_presets) {
        presets = loaded_presets;
        $('#load').css({visibility: 'visible'});
        $('#load_preset').on('change', function() {
            $('#load').submit();
        });
        $('#load').on('submit', function(e) {
            e.preventDefault();
            var key2load = $('#load_preset').val();
            var preset = _find(presets, function(a_preset) {
                return a_preset.key == key2load;
            });
            $.each(_FIELDS, function(_, f) {
                $('#' + f).val(preset[f]);
            });
            current_adjournments = preset.adjournments;
            current_hrts = preset.hrts;
            on_change();
            return false;
        });

        $('#load_preset').empty();
        $.each(presets, function(_, preset) {
            var option = $('<option>');
            option.text(preset.key);
            option.attr({value: preset.key});
            $('#load_preset').append(option);
        });
        $('#load').submit();
    }, error: function() {
        error('Cannot download JSON');
    },
});

$(function() {
    var currentYear = new Date().getFullYear();
    $('#season_name').val('Saison ' + currentYear + '/' + (currentYear+1));
    on_change();

    $('#dates_in').on('input', on_change);
    $('#teams_in').on('input', on_change);
    $('#league_name').on('input', on_change);
    $('#season_name').on('input', on_change);
    $('#abbrev').on('input', on_change);
    $('#stb').on('input', on_change);
    $('#kroton_url').on('input', on_change);
    $('#adjournment_add').on('submit', adjournment_add);
    $('#adjournment_add [name="game"]').on('input', adjournment_add_on_input);
    $('#hrt_add').on('submit', hrt_add);
    $('#adjournment_import [name="files"]').on('change', adjournment_import);
    $('#import_button').on('click', function() {
        $('#adjournment_import [name="files"]').click();
    });
    $('#adjournment_compare_online').on('click', adjournment_compare_online);
    $('#adjournment_import_online').on('click', adjournment_import_online);
});