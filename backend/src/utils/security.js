import argon2 from 'argon2';

import { env } from '../config/env.js';

const withPepper = (value) => `${value}${env.BCRYPT_OR_ARGON2_PEPPER}`;

export const hashPassword = async (password) =>
  argon2.hash(withPepper(password), {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 1,
  });

export const verifyPassword = async (hash, password) =>
  argon2.verify(hash, withPepper(password));

