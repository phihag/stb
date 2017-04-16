
var optimize = (function() {

function alphabet(count) {
	const res = [];
	const A = 'A'.charCodeAt(0);
	for (let i = 0;i < count;i++) {
		res.push(String.fromCharCode(A + i));
	}
	return res;
}

function swap(ar, i, j) {
	const tmp = ar[i];
	ar[i] = ar[j];
	ar[j] = tmp;
}

function* permutations(all_values) {
	const ar = all_values.slice();
	const len = ar.length;

	// https://en.wikipedia.org/wiki/Heap%27s_algorithm
	const c = [];
	for (let i = 0;i < len;i++) {
		c.push(0);
	}

	if (len > 0) {
		yield ar;
	}

	for (let i = 0;i < len;) {
		if (c[i] < i) {
			if (i % 2 === 0) {
				swap(ar, 0, i);
			} else {
				swap(ar, c[i], i);
			}
			yield ar;
			c[i]++;
			i = 0;
		} else {
			c[i] = 0;
			i++;
		}
	}
}

function evaluate(teams, letters) {
	let res = 0;
	for (let i = 0;i < teams.length;i++) {
		const l = letters[i];
		const wishes = teams[i].wishes;
		if (wishes.length === 0) {
			continue;
		}

		let found = false;
		for (let j = 0;j < wishes.length;j++) {
			const w = wishes[j];
			if (w === l) {
				found = true;
				res += 10 * j;
				break;
			}
		}
		if (!found) {
			res += 100 + wishes.length;
		}
	}
	return res;
}

function calc_best(teams, n) {
	const letters = alphabet(teams.length);
	const res = [];
	for (const p of permutations(letters)) {
		const cost = evaluate(teams, p);
		for (let i = 0;i < n;i++) {
			if (!res[i] || (cost < res[i].cost)) {
				for (let j = n - 1;j > i;j--) {
					res[j] = res[j - 1];
				}
				res[i] = {
					cost,
					letters: p.slice(),
				};
				break;
			}
		}
	}
	return res;
}

return {
	calc_best,
	permutations,
};

})();

if (typeof module !== 'undefined') {
	module.exports = optimize;
}
