const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const script = readFileSync(require.resolve('../static/script.js'), 'utf8');
const revealScript = script.slice(script.indexOf('const reveals ='), script.indexOf('// CAROUSELS'));

function revealFixture({ reduce = false, observer = true } = {}) {
  const classes = new Set();
  const element = { classList: { add: value => classes.add(value) } };
  let options, callback, observed, unobserved;
  class Observer {
    constructor(cb, config) { callback = cb; options = config; }
    observe(e) { observed = e; }
    unobserve(e) { unobserved = e; }
  }
  const window = { matchMedia: () => ({ matches: reduce }) };
  if (observer) window.IntersectionObserver = Observer;
  vm.runInNewContext(revealScript, {
    window, document: { querySelectorAll: () => [element] }, IntersectionObserver: Observer,
  });
  return { classes, options, observed, element,
    intersect: () => callback([{ isIntersecting: true, target: element }], new Observer()),
    unobserved: () => unobserved };
}

test('reduced motion and missing observer leave content immediately available', () => {
  for (const settings of [{ reduce: true }, { observer: false }]) {
    const f = revealFixture(settings);
    assert.ok(f.classes.has('visible'));
    assert.ok(!f.classes.has('reveal-ready'));
    assert.equal(f.observed, undefined);
  }
});

test('very tall sections reveal on first intersection and stop observing', () => {
  const f = revealFixture();
  assert.equal(f.options.threshold, 0);
  assert.equal(f.observed, f.element);
  assert.ok(f.classes.has('reveal-ready'));
  f.intersect();
  assert.ok(f.classes.has('visible'));
  assert.equal(f.unobserved(), f.element);
});

test('unavailable preference storage cannot abort later shared initialization', () => {
  const themeScript = script.slice(script.indexOf('const toggle ='), script.indexOf('// LIGHTBOX'));
  let handler;
  const button = { addEventListener: (_, cb) => { handler = cb; } };
  const document = { getElementById: () => button, body: { classList: {
    add() {}, remove() {}, contains: () => false,
  } } };
  const localStorage = { getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } };
  assert.doesNotThrow(() => vm.runInNewContext(themeScript, { document, localStorage }));
  assert.doesNotThrow(() => handler());
});
