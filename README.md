# validate-exports-object <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Validate an object in the "exports" field.

## Example

```js
const assert = require('assert');
const validateExportsObject = require('validate-exports-object');
const pkg = require('./package.json');

const results = validateExportsObject(pkg.exports);

assert.deepEqual(
    results,
    {
        __proto__: null,
        normalized: {
            __proto__: null,
            '.': './index.js',
            './package.json': './package.json'
        },
        problems: [],
        status: 'files'
    }
);
```

## Tests
Simply clone the repo, `npm install`, and run `npm test`

## Security

Please email [@ljharb](https://github.com/ljharb) or see https://tidelift.com/security if you have a potential security vulnerability to report.

[package-url]: https://npmjs.org/package/validate-exports-object
[npm-version-svg]: https://versionbadg.es/ljharb/validate-exports-object.svg
[deps-svg]: https://david-dm.org/ljharb/validate-exports-object.svg
[deps-url]: https://david-dm.org/ljharb/validate-exports-object
[dev-deps-svg]: https://david-dm.org/ljharb/validate-exports-object/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/validate-exports-object#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/validate-exports-object.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/validate-exports-object.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/validate-exports-object.svg
[downloads-url]: https://npm-stat.com/charts.html?package=validate-exports-object
[codecov-image]: https://codecov.io/gh/ljharb/validate-exports-object/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/validate-exports-object/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/validate-exports-object
[actions-url]: https://github.com/ljharb/validate-exports-object/actions
