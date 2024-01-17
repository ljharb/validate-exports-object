'use strict';

var test = require('tape');
var path = require('path');
var fs = require('fs');
var forEach = require('for-each');
var v = require('es-value-fixtures');
var inspect = require('object-inspect');

var validateExportsObject = require('../');

var fnMsg = 'package `exports` is invalid; how did you get a function in there?';
var comboMsg = 'ERR_INVALID_PACKAGE_CONFIG: package `exports` is invalid; an object in "exports" cannot contain some keys starting with `.` and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.';
/** @type {(pairs: string[]) => string} */
var nmMsg = function (pairs) {
	return 'ERR_INVALID_PACKAGE_TARGET: package `exports` is invalid; values may not contain a `node_modules` path segment (' + pairs.sort().join(', ') + ').';
};

var fixturesDir = path.resolve(__dirname, './list-exports/packages/tests/fixtures');

test('validateExportsObject', function (t) {
	forEach(v.primitives, function (x) {
		t.deepEqual(
			validateExportsObject(x),
			{
				__proto__: null,
				normalized: { __proto__: null },
				problems: [],
				status: 'empty'
			},
			inspect(x) + ' is not an object, and thus is valid but empty'
		);
	});

	t.deepEqual(
		validateExportsObject({}),
		{
			__proto__: null,
			normalized: { __proto__: null },
			problems: [],
			status: 'empty'
		},
		inspect({}) + ' is an object with no own keys, and thus is valid and empty'
	);

	t.deepEqual(
		validateExportsObject([]),
		{
			__proto__: null,
			normalized: [],
			problems: [],
			status: 'empty'
		},
		inspect([]) + ' is an object with no own enumerable keys, and thus is valid and empty'
	);

	var func = function () {};
	t.deepEqual(
		validateExportsObject(func),
		{
			__proto__: null,
			normalized: undefined,
			problems: [fnMsg],
			status: false
		},
		inspect(func) + ' is a function, and thus is invalid'
	);

	var conditionsObj = {
		'import': 'mjs',
		require: 'cjs',
		'default': 'js'
	};
	t.deepEqual(
		validateExportsObject(conditionsObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'import': 'mjs',
				require: 'cjs',
				'default': 'js'
			},
			problems: [],
			status: 'conditions'
		},
		inspect(conditionsObj) + ' is a valid conditions object'
	);

	var filesObj = {
		'./a': './a.js',
		'./b': './b.js',
		'./c': './c.js'
	};
	t.deepEqual(
		validateExportsObject(filesObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'./a': './a.js',
				'./b': './b.js',
				'./c': './c.js'
			},
			problems: [],
			status: 'files'
		},
		inspect(filesObj) + ' is a valid files object'
	);

	var bothObj = {
		'./a': './a.js',
		'import': 'mjs',
		'./b': './b.js',
		'default': 'js'
	};
	t.deepEqual(
		validateExportsObject(bothObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'./a': './a.js',
				'./b': './b.js'
			},
			problems: [comboMsg],
			status: 'files'
		},
		inspect(bothObj) + ' is an invalid exports object'
	);

	var fnObj = {
		'./foo': './foo.js',
		'./bar': function () {},
		'./baz': './baz.js'
	};
	t.deepEqual(
		validateExportsObject(fnObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'./foo': './foo.js',
				'./baz': './baz.js'
			},
			problems: [fnMsg],
			status: 'files'
		},
		inspect(fnObj) + ' is an invalid exports object'
	);

	var nmObj = {
		'./node_modules/foo': './valid.js',
		'./valid': './node_modules/invalid/index.js'
	};
	t.deepEqual(
		validateExportsObject(nmObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'./node_modules/foo': './valid.js'
			},
			problems: [nmMsg(['`./valid`: `./node_modules/invalid/index.js`'])],
			status: 'files'
		},
		inspect(nmObj) + ' is an invalid exports object'
	);

	var superBadObj = {
		'import': 'mjs',
		'./foo': './foo.js',
		'./bar': './node_modules/invalid/index.js',
		'./fn': function () {},
		'something else': 'to cover the early exit optimizations'
	};
	t.deepEqual(
		validateExportsObject(superBadObj),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'import': 'mjs',
				'something else': 'to cover the early exit optimizations'
			},
			problems: [comboMsg, fnMsg, nmMsg(['`./bar`: `./node_modules/invalid/index.js`'])].sort(),
			status: 'conditions'
		},
		inspect(superBadObj) + ' is an invalid exports object'
	);

	var goodTopBadNested = {
		'.': [[[[[[[[[[[[[{ './foo': './node_modules/index.js' }]]]]]]]]]]]]]
	};
	t.deepEqual(
		validateExportsObject(goodTopBadNested),
		{
			__proto__: null,
			normalized: {
				__proto__: null
			},
			problems: [nmMsg(['`./foo`: `./node_modules/index.js`'])],
			status: 'empty'
		},
		inspect(goodTopBadNested) + ' is an invalid exports object'
	);

	var nestedEmpty = {
		'./foo': {
			'import': './foo.mjs',
			'default': './foo.js'
		},
		'./bar': {}
	};
	t.deepEqual(
		validateExportsObject(nestedEmpty),
		{
			__proto__: null,
			normalized: {
				__proto__: null,
				'./foo': {
					__proto__: null,
					'import': './foo.mjs',
					'default': './foo.js'
				}
			},
			problems: [
				'ERR_INVALID_PACKAGE_CONFIG: package `exports` is invalid; sub-object for `./bar` is empty.'
			],
			status: 'files'
		},
		inspect(nestedEmpty) + ' is invalid; only a non-nested object can have file path keys'
	);

	/** @type {string[]} */ var fixtures;
	try { fixtures = fs.readdirSync(fixturesDir); } catch (e) {}
	// @ts-expect-error ts(2454) TS can't narrow based on tape's `skip`
	t.test('fixtures', { skip: !fixtures }, function (st) {
		forEach(fixtures, function (fixture) {
			var fixtureDir = path.resolve(fixturesDir, fixture);
			var pkg = require(path.resolve(fixtureDir, 'project/package.json')); // eslint-disable-line global-require

			if ('exports' in pkg) {
				var expectedProblems = fixture === 'ex-node-modules' ? [nmMsg(['`./local`: `./node_modules/dep/dep.js`', '`./local-encoded`: `./no%64e_modules/dep/dep.js`'])] : [];
				st.test('fixture: ' + fixture, function (s2t) {
					var result = validateExportsObject(pkg.exports);

					s2t.deepEqual(
						result,
						{
							__proto__: null,
							normalized: result.normalized,
							problems: expectedProblems,
							status: result.status // TODO: figure out how to test the status properly
						},
						'fixture ' + fixture + ' has ' + (result.problems.length > 0 ? 'an invalid' : 'a valid') + ' exports object'
					);

					s2t.deepEqual(
						validateExportsObject(result.normalized),
						{
							__proto__: null,
							normalized: result.normalized,
							problems: [],
							status: result.status
						},
						'fixture ' + fixture + ' has a valid `normalized` value'
					);

					s2t.end();
				});
			}
		});
		st.end();
	});

	t.end();
});
