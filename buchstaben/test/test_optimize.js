'use strict';

const assert = require('assert');
const tutils = require('./tutils');
const optimize = require('../optimize');

const _describe = tutils._describe;
const _it = tutils._it;


_describe('optimize', function() {
	_it('permutations', function() {
		function calc_perms(r) {
			const res = [];
			for (const ar of optimize.permutations(r)) {
				res.push(ar.join(''));
			}
			res.sort();
			return res;
		}

		assert.deepStrictEqual(
			calc_perms([]),
			[]
		);
		assert.deepStrictEqual(
			calc_perms(['A']),
			['A']
		);
		assert.deepStrictEqual(
			calc_perms(['A', 'B']),
			['AB', 'BA']
		);
		assert.deepStrictEqual(
			calc_perms(['A', 'B', 'C', 'D']), [
			'ABCD', 'ABDC', 'ACBD', 'ACDB', 'ADBC', 'ADCB',
			'BACD', 'BADC', 'BCAD', 'BCDA', 'BDAC', 'BDCA',
			'CABD', 'CADB', 'CBAD', 'CBDA', 'CDAB', 'CDBA',
			'DABC', 'DACB', 'DBAC', 'DBCA', 'DCAB', 'DCBA',
		]);
	});
});
