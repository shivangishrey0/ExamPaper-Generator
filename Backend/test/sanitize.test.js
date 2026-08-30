import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeRegex } from '../utils/sanitize.js';

test('escapeRegex neutralizes regex metacharacters in user input', () => {
  const malicious = '.*';
  const pattern = new RegExp(`^${escapeRegex(malicious)}$`, 'i');
  assert.equal(pattern.test('anything'), false);
  assert.equal(pattern.test('.*'), true);
});

test('escapeRegex leaves plain text matching unaffected', () => {
  const pattern = new RegExp(escapeRegex('DBMS'), 'i');
  assert.equal(pattern.test('Intro to dbms'), true);
});

test('escapeRegex handles a string with every special character', () => {
  const raw = '.*+?^${}()|[]\\';
  const pattern = new RegExp(`^${escapeRegex(raw)}$`);
  assert.equal(pattern.test(raw), true);
});
