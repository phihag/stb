'use strict';

function parse_input(input_str) {
	const lines = input_str.split(/\n+/).filter(s => s).map(s => s.trim());
	return lines.map(line => {
		const m = /^(.+[0-9]+)((?:\s+[A-Z])*)$/.exec(line);
		if (!m) { // No wishes
			return {
				name: line,
				wishes: [],
			};
		}

		const name = m[1];
		const wishes = m[2].trim().split(/\s+/).filter(w => w);

		return {
			name,
			wishes,
		};
	});
}

function recalc() {
	const input_str = uiu.qs('#input').value;
	const teams = parse_input(input_str);
	const best = optimize.calc_best(teams, 3).filter(solution => solution);

	const wish_count = Math.max(...teams.map(p => p.wishes.length));

	const output = uiu.qs('#output');
	uiu.empty(output);

	const table = uiu.el(output, 'table');
	const thead = uiu.el(table, 'thead');
	const thead_tr = uiu.el(thead, 'tr');
	uiu.el(thead_tr, 'th', {}, 'Mannschaft');
	for (let i = 0;i < wish_count;i++) {
		uiu.el(thead_tr, 'th', {
			title: 'Wunsch ' + (i + 1),
			'class': ((i === wish_count - 1) ? 'last_wish' : ''),
		}, 'W' + (i + 1));
	}
	uiu.el(thead_tr, 'th', 'buf');
	best.forEach(function(b, b_idx) {
		uiu.el(thead_tr, 'th', {
			title: 'Lösung' + (b_idx + 1),
		}, 'L' + (b_idx + 1));
	});

	const tbody = uiu.el(table, 'tbody');
	teams.forEach(function(team, team_idx) {
		const tr = uiu.el(tbody, 'tr');
		uiu.el(tr, 'td', {}, team.name);
		for (let i = 0;i < wish_count;i++) {
			uiu.el(tr, 'td', {}, team.wishes[i] ? team.wishes[i] : '');
		}
		uiu.el(tr, 'td', 'buf');
		best.forEach(function(b) {
			uiu.el(tr, 'td', {}, b.letters[team_idx]);
		});
	});
	const cost_tr = uiu.el(tbody, 'tr');
	uiu.el(cost_tr, 'th', {colspan: (1 + wish_count)}, 'Kosten:');
	uiu.el(cost_tr, 'td', 'buf');
	best.forEach(function(b) {
		uiu.el(cost_tr, 'td', {}, b.cost);
	});
}

document.addEventListener('DOMContentLoaded', function() {
	uiu.qs('#inputform').addEventListener('submit', function(e) {
		e.preventDefault();
		recalc();
	});
	recalc();
});
