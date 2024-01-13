'use strict';

var callBound = require('call-bind/callBound');
var isArray = require('isarray');
var keys = require('object-keys');
var regexTester = require('safe-regex-test');
var safeConcat = require('safe-array-concat');

var $charAt = callBound('String.prototype.charAt');
var $join = callBound('Array.prototype.join');
var $sort = callBound('Array.prototype.sort');
var hasNMSegment = regexTester(/(^|\/)node_modules(\/|$)/);

var fnMsg = 'package `exports` is invalid; how did you get a function in there?';

/** @typedef {'empty' | 'files' | 'conditions'} StatusString */

/** @typedef {{ [fileURL in `./${string}`]: Exports }} ExportsFiles */

/** @typedef {{ [condition: string]: condition extends `./${string}` ? never : Exports; }} ExportsConditions */

/** @typedef {Array<Exports>} ExportsArray */

/** @typedef {null | string | ExportsConditions | ExportsFiles | ExportsArray} Exports */

/** @type {<T = unknown>(obj: T) => { __proto__: null, normalized: undefined | Exports, problems: string[], status: false | StatusString }} */
module.exports = function validateExportsObject(obj) {
	if (!obj || typeof obj !== 'object') {
		var isFn = typeof obj === 'function';
		return {
			__proto__: null,
			normalized: isFn ? void undefined : { __proto__: null },
			problems: isFn ? [fnMsg] : [],
			status: !isFn && 'empty'
		};
	}
	var exportKeys = keys(obj);

	var seenDot = false;
	var seenNonDot = false;
	/** @type {string[]} */ var nmSegments = [];
	var seenFn = false;
	/** @type {string[]} */ var problems = [];
	/** @type {StatusString} */ var status = 'empty';

	/** @type {Exports} */ var normalized = isArray(obj) ? [] : { __proto__: null };

	for (var i = 0; i < exportKeys.length; i++) {
		var key = exportKeys[i];
		var start = $charAt(key, 0);
		// @ts-expect-error ts(7053) we know this is a valid key. TODO: fix the fn type to handle this
		/** @type {unknown} */ var value = obj[key];

		if (typeof value === 'function') {
			seenFn = true;
		} else if (typeof value === 'string') {
			if (hasNMSegment(decodeURI(value))) {
				nmSegments[nmSegments.length] = '`' + key + '`: `' + value + '`';
			} else if (start === '.') {
				seenDot = true;
				if (status !== 'conditions') {
					// @ts-expect-error ts(7053) objects are arbitrarily writable
					normalized[key] = value;
					status = 'files';
				}
			} else {
				seenNonDot = true;
				if (status !== 'files') {
					// @ts-expect-error ts(7053) objects are arbitrarily writable
					normalized[key] = value;
					status = 'conditions';
				}
			}
		} else {
			var subObjectResult = validateExportsObject(value);
			if (subObjectResult.problems.length > 0) {
				problems = safeConcat(problems, subObjectResult.problems);
				break; // eslint-disable-line no-restricted-syntax
			}

			if (subObjectResult.status !== 'empty') {
				if (start === '.') {
					seenDot = true;
					if (status !== 'conditions') {
						status = 'files';
					}
				} else {
					seenNonDot = true;
					if (status !== 'files') {
						status = 'conditions';
					}
				}
			}

			// @ts-expect-error ts(7053) objects are arbitrarily writable
			normalized[key] = subObjectResult.normalized;
		}
	}

	if (seenDot && seenNonDot) {
		problems[problems.length] = 'ERR_INVALID_PACKAGE_CONFIG: package `exports` is invalid; an object in "exports" cannot contain some keys starting with `.` and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.';
	}

	if (seenFn) {
		problems[problems.length] = fnMsg;
	}

	if (nmSegments.length > 0) {
		problems[problems.length] = 'ERR_INVALID_PACKAGE_TARGET: package `exports` is invalid; values may not contain a `node_modules` path segment (' + $join($sort(nmSegments), ', ') + ').';
	}

	return {
		__proto__: null,
		normalized: normalized,
		problems: $sort(problems),
		status: status
	};
};
