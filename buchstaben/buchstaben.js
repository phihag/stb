'use strict';

const SOLUTION_COUNT = 5;

function parse_input(input_str) {
	const lines = input_str.split(/\n+/).filter(s => s).map(s => s.trim());
	return lines.map(line => {
		const m = /^(.+?)((?:\s+[A-Z])*)$/.exec(line);
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
	const output = uiu.qs('#output');
	uiu.empty(output);
	uiu.text(output, 'Suche Lösungen ...');

	const input_str = uiu.qs('#input').value;
	const teams = parse_input(input_str);
	const best = optimize.calc_best(teams, SOLUTION_COUNT).filter(solution => solution);

	uiu.empty(output);
	const wish_count = Math.max(...teams.map(p => p.wishes.length));

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
			const l = b.letters[team_idx];
			const fulfilled = (team.wishes.length === 0) || (team.wishes[0] === l);
			uiu.el(tr, 'td', 'solution_val' + (fulfilled ? '' : ' unfulfilled'), l);
		});
	});
	const cost_tr = uiu.el(tbody, 'tr');
	uiu.el(cost_tr, 'th', {
		'class': 'cost_label',
		colspan: (1 + wish_count + 1),
	}, 'Kosten:');
	best.forEach(function(b) {
		uiu.el(cost_tr, 'td', 'cost_val', b.cost);
	});
}

document.addEventListener('DOMContentLoaded', function() {
	uiu.qs('#input').addEventListener('input', recalc);
	recalc();
});
