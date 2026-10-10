/**
 * All persistence access for the `users` collection goes through this
 * class. No other module imports `users.model.js` directly (architecture
 * doc §7: "Do not directly access another module's MongoDB models from a
 * different module").
 */
export class UserRepository {
  /** @param {import('mongoose').Model} userModel */
  constructor(userModel) {
    this.userModel = userModel;
  }

  /**
   * @param {string} email
   * @param {{ withPasswordHash?: boolean }} [options]
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findByEmail(email, { withPasswordHash = false } = {}) {
    const query = this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (withPasswordHash) query.select('+passwordHash');
    return query.exec();
  }

  /**
   * @param {string} id
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async findById(id) {
    return this.userModel.findById(id).exec();
  }

  /**
   * @param {{ email: string, passwordHash: string, name: string }} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return this.userModel.create(data);
  }

  /**
   * @param {string} id
   * @param {Record<string, unknown>} patch - dot-path keys, e.g. `{ 'preferences.tone': 'Technical' }`
   * @returns {Promise<import('mongoose').Document|null>}
   */
  async updateById(id, patch) {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;

    for (const [path, value] of Object.entries(patch)) {
      user.set(path, value);
    }

    return user.save();
  }
}
