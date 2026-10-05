const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function page(fetch) {
  let submit;
  const fields = { name: 'Visitor', email: 'visitor@example.com', occasion: 'Birthday', details: 'Three gifts', website: '' };
  const form = {
    addEventListener: (_, handler) => { submit = handler; },
    reportValidity: () => true,
    setAttribute() {}, removeAttribute() {},
    reset() { this.didReset = true; }
  };
  const button = { disabled: false, textContent: 'Send enquiry' };
  const status = { textContent: '', focus() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../src/contact.js'), 'utf8'), {
    document: { getElementById: id => ({ 'enquiry-form': form, 'send-enquiry': button, 'form-status': status })[id] },
    FormData: class { get(key) { return fields[key]; } }, fetch
  });
  return { submit: () => submit({ preventDefault() {} }), form, button, status };
}

test('successful submission uses the API and confirms without exposing an inbox', async () => {
  const state = page(async (url, options) => {
    assert.equal(url, '/api/enquiry');
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.equal(payload.email, 'visitor@example.com');
    assert.equal(payload.to, undefined);
    return { ok: true, json: async () => ({ message: 'Sent' }) };
  });
  await state.submit();
  assert.equal(state.form.didReset, true);
  assert.equal(state.button.disabled, false);
  assert.match(state.status.textContent, /has been sent/);
});

test('failed delivery retains the enquiry and never shows server internals', async () => {
  const state = page(async () => ({ ok: false, json: async () => ({ message: 'private-recipient@example.com' }) }));
  await state.submit();
  assert.equal(state.form.didReset, undefined);
  assert.equal(state.button.disabled, false);
  assert.match(state.status.textContent, /could not confirm/);
  assert.doesNotMatch(state.status.textContent, /private-recipient/);
});

test('a pending request prevents duplicate submissions', async () => {
  let finish, count = 0;
  const state = page(() => { count++; return new Promise(resolve => { finish = resolve; }); });
  const pending = state.submit();
  assert.equal(state.button.disabled, true);
  await state.submit();
  assert.equal(count, 1);
  finish({ ok: true, json: async () => ({ message: 'Sent' }) });
  await pending;
});
