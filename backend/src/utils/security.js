import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

const withPepper = (value) => `${value}${env.BCRYPT_OR_ARGON2_PEPPER}`;

// New passwords use bcrypt so forgot/reset and registration share the same hashing strategy.
export const hashPassword = async (password) =>
  bcrypt.hash(withPepper(password), 12);

// Existing users may still have Argon2 hashes, so we support both during verification.
export const verifyPassword = async (hash, password) => {
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, withPepper(password));
  }

  return bcrypt.compare(withPepper(password), hash);
};

