import { NotFoundError } from '../../shared/errors/index.js';

/**
 * @param {import('mongoose').Document} userDoc
 * @returns {{ id: string, email: string, name: string, preferences: object, aiSettings: object, createdAt: Date }}
 */
function toProfileDto(userDoc) {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    name: userDoc.name,
    preferences: userDoc.preferences,
    aiSettings: userDoc.aiSettings,
    createdAt: userDoc.createdAt,
  };
}

export class UsersService {
  /** @param {import('./users.repository.js').UserRepository} userRepository */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {string} userId
   * @returns {Promise<ReturnType<typeof toProfileDto>>}
   */
  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found.');
    return toProfileDto(user);
  }

  /**
   * @param {string} userId
   * @param {{ name?: string, preferences?: object, aiSettings?: object }} patch
   * @returns {Promise<ReturnType<typeof toProfileDto>>}
   */
  async updateProfile(userId, patch) {
    const update = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.preferences !== undefined) {
      for (const [key, value] of Object.entries(patch.preferences)) {
        update[`preferences.${key}`] = value;
      }
    }
    if (patch.aiSettings !== undefined) {
      for (const [key, value] of Object.entries(patch.aiSettings)) {
        update[`aiSettings.${key}`] = value;
      }
    }

    const user = await this.userRepository.updateById(userId, update);
    if (!user) throw new NotFoundError('User not found.');
    return toProfileDto(user);
  }
}
