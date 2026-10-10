import { AuthenticationError, ConflictError } from '../../shared/errors/index.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';

/**
 * Auth never returns a full user profile (that's `GET /api/users/me`'s
 * job) — only the minimal identity fields needed to establish a session.
 * @param {import('mongoose').Document} userDoc
 * @returns {{ id: string, email: string, name: string }}
 */
function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name,
  };
}

/**
 * Registration and credential verification. Deliberately has no
 * LinkedIn-specific logic (architecture doc §8) and no direct MongoDB
 * access of its own — persistence goes through the `users` module's
 * repository, injected here rather than importing `users.model.js`
 * directly (architecture doc §7).
 */
export class AuthService {
  /** @param {import('../users/users.repository.js').UserRepository} userRepository */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {{ email: string, password: string, name: string }} input
   * @returns {Promise<ReturnType<typeof toPublicUser>>}
   */
  async register({ email, password, name }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const user = await this.userRepository.create({ email, passwordHash, name });
    return toPublicUser(user);
  }

  /**
   * @param {{ email: string, password: string }} input
   * @returns {Promise<ReturnType<typeof toPublicUser>>}
   */
  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email, { withPasswordHash: true });
    if (!user) {
      // Same message for "no such user" and "wrong password" — never
      // reveal which one it was.
      throw new AuthenticationError('Invalid email or password.');
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthenticationError('Invalid email or password.');
    }

    return toPublicUser(user);
  }
}
