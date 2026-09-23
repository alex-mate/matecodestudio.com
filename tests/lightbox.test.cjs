// Unit coverage for shared lightbox event handling. Native dialog behaviour
// (keyboard activation, focus containment and rendering) still needs a browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const script = readFileSync(require.resolve('../static/script.js'), 'utf8');
const lightboxScript = script.slice(
  script.indexOf('const lightbox ='),
  script.indexOf('// REVEAL ON SCROLL'),
);

function fixture(tagName = 'DIALOG') {
  let focused = null;
  function element(tag = '') {
    const listeners = {};
    const classes = new Set();
    return {
      tagName: tag, isConnected: true, attributes: {},
      classList: {
        add: value => classes.add(value),
        remove: value => classes.delete(value),
        contains: value => classes.has(value),
      },
      addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
      dispatch(type, event = {}) {
        for (const handler of listeners[type] || []) handler(event);
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { focused = this; },
    };
  }
  const overlay = element(tagName);
  const expanded = element('IMG');
  const close = element('BUTTON');
  overlay.showModal = () => { overlay.open = true; };
  overlay.close = () => { overlay.open = false; overlay.dispatch('close'); };
  const buttons = [element('BUTTON'), element('BUTTON')];
  const images = buttons.map((button, index) => Object.assign(element('IMG'), {
    src: `image-${index}.webp`, alt: `Project screen ${index}`,
    closest: () => tagName === 'DIALOG' ? button : null,
  }));
  const document = Object.assign(element(), {
    body: { style: { overflow: 'auto' } },
    getElementById: id => ({ lightbox: overlay, lightboxImg: expanded, lightboxClose: close })[id],
    querySelectorAll: () => images,
  });
  vm.runInNewContext(lightboxScript, { document });
  return { overlay, expanded, close, buttons, images, document, focused: () => focused };
}

test('each opener loads its image and description, focuses close and restores the exact opener', () => {
  const f = fixture();
  for (const [index, button] of f.buttons.entries()) {
    button.dispatch('click');
    assert.equal(f.overlay.open, true);
    assert.equal(f.overlay.attributes['aria-hidden'], 'false');
    assert.equal(f.expanded.src, f.images[index].src);
    assert.equal(f.expanded.alt, f.images[index].alt);
    assert.equal(f.focused(), f.close);
    assert.equal(f.document.body.style.overflow, 'hidden');
    f.close.dispatch('click');
    assert.equal(f.overlay.open, false);
    assert.equal(f.overlay.attributes['aria-hidden'], 'true');
    assert.equal(f.overlay.classList.contains('active'), false);
    assert.equal(f.focused(), button);
    assert.equal(f.document.body.style.overflow, 'auto');
  }
});

test('Escape handler dismisses and restores focus; unrelated keys leave it open', () => {
  const f = fixture();
  f.buttons[0].dispatch('click');
  f.document.dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(f.overlay.open, true);
  let prevented = false;
  f.document.dispatch('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.overlay.open, false);
  assert.equal(f.focused(), f.buttons[0]);
});

test('only the overlay background dismisses; native close events also clean up', () => {
  const f = fixture();
  f.buttons[1].dispatch('click');
  f.overlay.dispatch('click', { target: f.expanded });
  assert.equal(f.overlay.open, true);
  f.overlay.dispatch('click', { target: f.overlay });
  assert.equal(f.overlay.open, false);
  assert.equal(f.focused(), f.buttons[1]);
  f.buttons[0].dispatch('click');
  f.overlay.close();
  assert.equal(f.focused(), f.buttons[0]);
  assert.equal(f.document.body.style.overflow, 'auto');
});

test('legacy non-dialog image handling remains available', () => {
  const f = fixture('DIV');
  f.images[0].dispatch('click');
  assert.equal(f.overlay.classList.contains('active'), true);
  f.close.dispatch('click');
  assert.equal(f.overlay.classList.contains('active'), false);
});

test('pages without a lightbox initialise without errors', () => {
  vm.runInNewContext(lightboxScript, {
    document: { getElementById: () => null, querySelectorAll: () => [], addEventListener() {} },
  });
});
