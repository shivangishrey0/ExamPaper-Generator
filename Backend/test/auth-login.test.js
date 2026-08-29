import test from 'node:test';
import assert from 'node:assert/strict';

import User from '../models/User.js';
import * as authController from '../controllers/authController.js';

const originalFindOne = User.findOne;

test('resolveLoginUser falls back to username when email is not found', async () => {
  User.findOne = async (query) => {
    if (query.email === 'missing@example.com') return null;
    if (query.username === 'Super Admin') {
      return {
        _id: 'user-1',
        username: 'Super Admin',
        email: 'superadmin@example.com',
        role: 'superadmin',
        isActive: true,
        isVerified: true,
        password: 'hashed-password'
      };
    }
    return null;
  };

  try {
    const user = await authController.resolveLoginUser({ email: 'missing@example.com', username: 'Super Admin' });
    assert.ok(user);
    assert.equal(user.role, 'superadmin');
    assert.equal(user.email, 'superadmin@example.com');
  } finally {
    User.findOne = originalFindOne;
  }
});
