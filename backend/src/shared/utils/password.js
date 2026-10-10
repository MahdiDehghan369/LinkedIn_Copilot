import bcrypt from 'bcryptjs';
import { config } from '../../infrastructure/config/env.js';

/**
 * @param {string} plainTextPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, config.bcrypt.saltRounds);
}

/**
 * @param {string} plainTextPassword
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainTextPassword, passwordHash) {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
