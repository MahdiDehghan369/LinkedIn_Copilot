import { apiClient } from './client.js';

/**
 * @param {{ email: string, password: string, name: string }} input
 * @returns {Promise<{ user: { id: string, email: string, name: string } }>}
 */
export function register(input) {
  return apiClient.post('/api/auth/register', input);
}

/**
 * @param {{ email: string, password: string }} input
 * @returns {Promise<{ user: { id: string, email: string, name: string } }>}
 */
export function login(input) {
  return apiClient.post('/api/auth/login', input);
}

/** @returns {Promise<{ message: string }>} */
export function logout() {
  return apiClient.post('/api/auth/logout');
}
