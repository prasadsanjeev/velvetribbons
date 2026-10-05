const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnquiryHandler } = require('../src/enquiry');
const env = {
  CONTACT_TO: 'private-recipient@example.com',
  SMTP_USER: 'private-sender@example.com',
  SMTP_PASSWORD: 'private-password'
};
const valid = {
  name: 'Test visitor', email: 'visitor@example.com',
  occasion: 'Birthday', details: 'Please wrap three gifts.', website: ''
};
const request = (data, headers = {}) => new Request('https://velvetribbons.ca/api/enquiry', {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://velvetribbons.ca', ...headers },
  body: typeof data === 'string' ? data : JSON.stringify(data)
});
const context = { error() {} };

test('sends to the private configured inbox with the visitor as reply-to', async () => {
  let sent;
  const handler = createEnquiryHandler({ env, sendMail: async message => {
    sent = message;
    return { accepted: [env.CONTACT_TO], rejected: [] };
  } });
  const result = await handler(request({ ...valid, to: 'attacker@example.com' }), context);
  assert.equal(result.status, 200);
  assert.equal(sent.to, env.CONTACT_TO);
  assert.equal(sent.from.address, env.SMTP_USER);
  assert.equal(sent.replyTo, valid.email);
  assert.match(sent.text, /Please wrap three gifts/);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.ok(!JSON.stringify(result).includes(env.CONTACT_TO));
});

test('rejects invalid input without sending', async () => {
  let count = 0;
  const handler = createEnquiryHandler({ env, sendMail: async () => { count++; } });
  for (const data of [null, [], '{', { ...valid, email: 'bad' },
    { ...valid, name: 'Injected\r\nBcc: other@example.com' },
    { ...valid, email: 'visitor@example.com\r\nBcc:other@example.com' },
    { ...valid, occasion: 'Invalid' }, { ...valid, details: '' },
    { ...valid, details: 'x'.repeat(4001) }]) {
    assert.equal((await handler(request(data), context)).status, 400);
  }
  assert.equal(count, 0);
});

test('rejects oversized requests and untrusted origins', async () => {
  const handler = createEnquiryHandler({ env, sendMail: async () => assert.fail('Should not send') });
  assert.equal((await handler(request('x'.repeat(12001)), context)).status, 413);
  assert.equal((await handler(request(valid, { origin: 'https://other.example' }), context)).status, 403);
  assert.equal((await handler(request(valid, { 'content-type': 'text/plain' }), context)).status, 415);
});

test('honeypot submissions do not send email', async () => {
  const handler = createEnquiryHandler({ env, sendMail: async () => assert.fail('Should not send') });
  assert.equal((await handler(request({ ...valid, website: 'spam' }), context)).status, 200);
});

test('missing credentials fail without exposing private settings', async () => {
  const handler = createEnquiryHandler({ env: { ...env, SMTP_PASSWORD: '' }, sendMail: async () => assert.fail('Should not send') });
  const result = await handler(request(valid), context);
  assert.equal(result.status, 503);
  assert.ok(!JSON.stringify(result).includes(env.CONTACT_TO));
});

test('delivery errors are redacted from responses and logs', async () => {
  const logs = [];
  const handler = createEnquiryHandler({ env, sendMail: async () => {
    throw new Error(`${env.CONTACT_TO} ${env.SMTP_PASSWORD}`);
  } });
  const result = await handler(request(valid), { error: value => logs.push(value) });
  assert.equal(result.status, 502);
  const output = JSON.stringify({ result, logs });
  assert.ok(!output.includes(env.CONTACT_TO));
  assert.ok(!output.includes(env.SMTP_PASSWORD));
});

test('an SMTP rejection cannot produce a success confirmation', async () => {
  const handler = createEnquiryHandler({ env, sendMail: async () => ({ accepted: [], rejected: [env.CONTACT_TO] }) });
  assert.equal((await handler(request(valid), context)).status, 502);
});

test('public assets contain neither a recipient address nor mailto routing', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const file of ['index.html', 'contact.js', 'staticwebapp.config.json']) {
    const source = fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
    assert.doesNotMatch(source, /mailto:|velvetribbonsinfo@gmail\.com|hello@velvetribbons\.ca/i);
  }
});
