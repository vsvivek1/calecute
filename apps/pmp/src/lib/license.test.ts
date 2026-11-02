import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAccessCode, issueLicense, verifyLicense } from './license.ts';

const KEY = 'test-secret-at-least-16-chars';
const p = { sid: 'cs_test_abc', email: 'a@b.com', iat: 1 };

test('a licence round-trips', () => {
  assert.deepEqual(verifyLicense(issueLicense(p, KEY), KEY), p);
});

test('a tampered or foreign licence is rejected', () => {
  const t = issueLicense(p, KEY);
  const [pre, , sig] = t.split('.');
  const forged = `${pre}.${Buffer.from(JSON.stringify({ ...p, email: 'x@y.com' })).toString('base64url')}.${sig}`;
  assert.equal(verifyLicense(forged, KEY), null);
  assert.equal(verifyLicense(issueLicense(p, 'another-secret-entirely'), KEY), null);
  assert.equal(verifyLicense('garbage', KEY), null);
  assert.equal(verifyLicense('', KEY), null);
});

test('access codes match exactly and only when set', () => {
  assert.equal(isAccessCode('Open-1234', 'Open-1234'), true);
  assert.equal(isAccessCode(' Open-1234 ', 'x, Open-1234'), true);
  assert.equal(isAccessCode('open-1234', 'Open-1234'), false);
  assert.equal(isAccessCode('Open-1234', ''), false);
  assert.equal(isAccessCode('', ','), false);
});
