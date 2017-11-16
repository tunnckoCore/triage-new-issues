/**
 * @copyright 2017-present, Charlike Mike Reagent <olsten.larck@gmail.com>
 * @license Apache-2.0
 */

const test = require('mukla')
const triage = require('../src/index.js')

test('preset/config export tasks object', (done) => {
  test.strictEqual(typeof triage, 'function')
  done()
})
