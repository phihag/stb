"use strict";

function _read_file(f, callback) {
    var reader = new FileReader();
    if (reader.readAsBinaryString) {
        reader.onload = function(e) {
            var data = e.target.result;
            callback(data);
        }
        reader.readAsBinaryString(f);
        return;
    }

    // old IE
    reader.onload = function(e) {
        var buffer = e.target.result;
        var data = "";
        var bytes = new Uint8Array(buffer);
        var length = bytes.byteLength;
        for (var i = 0; i < length; i++) {
            data += String.fromCharCode(bytes[i]);
        }
        callback(data);
    }
    reader.readAsArrayBuffer(f);
    return;
}

function read_data(contents) {
    var workbook = XLSX.read(contents, {type:"binary"});
    var players_by_name = {};
    workbook.SheetNames.forEach(function(sn) {
        var ws = workbook.Sheets[sn];
        var keys = [];
        for (var i = 0;i < 100;i++) {
            var cell = ws[XLSX.utils.encode_cell({c:i, r:0})];
            if (!cell) {
                break;
            }
            keys.push(cell.w);
        }

        var key_indices = {};
        $.each(keys, function(idx, k) {
            key_indices[k] = idx;
        });

        var get_cell = function(col_name, row_idx) {
            var col_idx = key_indices[col_name];
            var cell = ws[XLSX.utils.encode_cell({c:col_idx, r:row_idx})];
            if (!cell) {
                return null;
            }
            return cell.w;
        };

        for (var row_idx = 1;row_idx < 100000;row_idx++) {
            var first_cell = ws[XLSX.utils.encode_cell({c:0, r:row_idx})];
            if (!first_cell) {
                break;
            }

            var player_id = get_cell('SpielerID', row_idx);
            if (!players_by_name[player_id]) {
                players_by_name[player_id] = {
                    id: player_id,
                    name: get_cell('Vorname', row_idx) + ' ' + get_cell('Nachname', row_idx),
                    disciplines: {},
                    gender: get_cell('GS', row_idx),
                };
            }

            players_by_name[player_id].disciplines[get_cell('DIS', row_idx)] = [
                get_cell('T1', row_idx),
                get_cell('T2', row_idx),
                get_cell('T3', row_idx),
                get_cell('T4', row_idx),
            ];
        }
    });

    var players = [];
    for (var name in players_by_name) {
        players.push(players_by_name[name]);
    }
    return players;
}

function analyze(contents) {
    var players = read_data(contents);
    $('#output').empty();

    analyze_played_disciplines(players);
}

function _make_boxes(num) {
    var boxes_node = $('<div class="boxes">');
    var boxes = [];
    for (var i = 0;i < num;i++) {
        var box = $('<div class="box">');
        boxes_node.append(box);
        boxes.push(box[0]);
    }
    $('#output').append(boxes_node);
    return boxes;
}


var DEFAULT_WIDTH = 500;
var DEFAULT_HEIGHT = 500;
var DEFAULT_RADIUS = 200;

function _pie_diagram(box, data) {
    _calc_percent(data);

    var color = d3.scale.category20c();
    var vis = d3.select(box)
        .append("svg:svg")
        .data([data])
            .attr("width", DEFAULT_WIDTH)
            .attr("height", DEFAULT_HEIGHT)
        .append("svg:g")
            .attr("transform", "translate(" + DEFAULT_RADIUS + "," + DEFAULT_RADIUS + ")")
    var arc = d3.svg.arc()
        .outerRadius(DEFAULT_RADIUS);
    var pie = d3.layout.pie()
        .value(function(d) { return d.value; });
    var arcs = vis.selectAll("g.slice")
        .data(pie)
        .enter()
            .append("svg:g")
                .attr("class", "slice");
        arcs.append("svg:path")
                .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
                .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
        arcs.append("svg:text")                                     //add a label to each slice
                .attr("transform", function(d) {                    //set the label's origin to the center of the arc
                d.innerRadius = 0;
                d.outerRadius = DEFAULT_RADIUS;
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .text(function(d, i) { return data[i].label + ' (' + data[i].percent + '%)'; });
}

function _table(box, data, label) {
    _calc_percent(data);
    var table = $('<table class="datatable">');
    var tbody = $('<tbody>');
    table.append(tbody);
    data.forEach(function(d) {
        var tr = $('<tr>');
        var value = $('<td>');
        value.text(d.value);
        value.appendTo(tr);
        var percent = $('<td class="datatable_percent">');
        percent.text(d.percent + '%');
        percent.appendTo(tr);
        var label = $('<th>');
        label.text(d.label);
        label.appendTo(tr);
        tbody.append(tr);
    });
    $(box).append(table);

    if (label) {
        var l = $('<div class="label">');
        l.text(label);
        $(box).append(l);
    }
}

function _calc_percent(data) {
    var sum = 0;
    for (var i = 0;i < data.length;i++) {
        sum += data[i].value;
    }
    for (var i = 0;i < data.length;i++) {
        data[i].percent = parseInt(100 * data[i].value / sum);
    }
}

function _only_plays(player, disciplines) {
    for (var i = 0;i < disciplines.length;i++) {
        var d = disciplines[i];
        if (! player.disciplines[d]) {
            return false;
        }
    }

    var num = 0;
    for (var d in player.disciplines) {
        if (disciplines.indexOf(d) < 0) {
            return false;
        }
        num += player.disciplines[d].filter(function(entry) {
            return entry > 0;
        }).length;
    }
    return num;
}

function _classify(players, classifications, weigh) {
    if (! weigh) {
        weigh = function() {return 1;};
    }

    var raw_counts = {};
    classifications.forEach(function(c) {
        raw_counts[c.label] = 0;
    });
    players.forEach(function(p) {
        var found_count = 0;
        for (var i = 0;i < classifications.length;i++) {
            var c = classifications[i];
            var test_result = c.test(p);
            if (test_result) {
                raw_counts[c.label] += weigh(test_result, p, c);
                found_count++;
            }
        }
        if (found_count != 1) {
            console.log('Cannot classify', p);
        }
    });

    return classifications.map(function(c) {
        return {
            label: c.label,
            value: raw_counts[c.label],
        };
    });
}


function analyze_played_disciplines(players) {
    $('#output').append($('<h2>Wer spielt welche Disziplinen?</h2>'));
    var boxes = _make_boxes(2);

    var CLASSIFICATIONS = [{
        'label': 'Nur Einzel',
        'test': (function(player) {
            return _only_plays(player, ['HE']) || _only_plays(player, ['DE']);
        })
    }, {
        'label': 'Nur Doppel',
        'test': (function(player) {
            return _only_plays(player, ['HD']) || _only_plays(player, ['DD']);
        })
    }, {
        'label': 'Nur Mixed',
        'test': (function(player) {
            return _only_plays(player, ['MH']) || _only_plays(player, ['MD']);
        })
    }, {
        'label': 'Einzel und Doppel',
        'test': (function(player) {
            return _only_plays(player, ['HE', 'HD']) || _only_plays(player, ['DE', 'DD']);
        })
    }, {
        'label': 'Doppel und Mixed',
        'test': (function(player) {
            return _only_plays(player, ['HD', 'MH']) || _only_plays(player, ['DD', 'MD']);
        })
    }, {
        'label': 'Einzel und Mixed',
        'test': (function(player) {
            return _only_plays(player, ['HE', 'MH']) || _only_plays(player, ['ME', 'DH']);
        })
    }, {
        label: 'Alles',
        test: (function(player) {
            return _only_plays(player, ['HE', 'HD', 'MH']) || _only_plays(player, ['DE', 'DD', 'MD']);
        })
    }];

    var data = _classify(players, CLASSIFICATIONS);
    _table(boxes[0], data, 'Spieler');

    data = _classify(players, CLASSIFICATIONS, function(test_result, player, classification) {
        return test_result;
    });
    _table(boxes[1], data, 'Teilnahmen');


};

function download(url, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function () {
        var data = new Uint8Array(req.response);
        var arr = new Array();
        for (var i = 0; i != data.length;i++) {
            arr[i] = String.fromCharCode(data[i]);
        }
        var bstr = arr.join("");
        callback(bstr);
    };
    req.send(null);
}

$(function() {
    download('Rangliste_E_D_M.xlsx', analyze);
    $('#import [name="file"]').on('change', function(e) {
        _read_file(e.target.files[0], analyze);
    });
});