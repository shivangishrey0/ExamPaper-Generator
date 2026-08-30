import test from 'node:test';
import assert from 'node:assert/strict';

import { getPermissionsForRole } from '../utils/permissions.js';

test('superadmin gets manage_users plus every teacher permission', () => {
  const perms = getPermissionsForRole('superadmin');
  assert.ok(perms.includes('manage_users'));
  for (const perm of getPermissionsForRole('teacher')) {
    assert.ok(perms.includes(perm), `superadmin missing teacher permission: ${perm}`);
  }
});

test('teacher does not get manage_users', () => {
  assert.ok(!getPermissionsForRole('teacher').includes('manage_users'));
});

test('student only gets student-scoped permissions', () => {
  const perms = getPermissionsForRole('student');
  assert.deepEqual(perms, ['take_exam', 'view_own_results']);
});

test('an unknown role gets no permissions', () => {
  assert.deepEqual(getPermissionsForRole('admin'), []);
  assert.deepEqual(getPermissionsForRole(undefined), []);
});
