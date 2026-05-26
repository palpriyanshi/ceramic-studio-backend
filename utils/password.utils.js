/**
 * @file password.utils.js
 * @description Bcrypt helpers used by auth and user controllers.
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
