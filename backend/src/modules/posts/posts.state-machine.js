import { InvalidTransitionError } from './posts.errors.js';

/**
 * `DRAFT` is treated the same as `GENERATED` for outgoing transitions — a
 * manually-started blank post and an AI-generated one both become
 * `EDITED` on first edit or `APPROVED` on direct approval. The
 * architecture doc's diagram shows `DRAFT` collapsing into `GENERATED`
 * immediately on creation ("AI generates or user starts blank" both
 * produce `GENERATED`); this keeps that intent while still recording
 * which posts started as a truly blank draft (`sourceGenerationId` unset)
 * versus an AI generation.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  DRAFT: ['EDITED', 'APPROVED', 'CANCELLED'],
  GENERATED: ['EDITED', 'APPROVED', 'CANCELLED'],
  EDITED: ['EDITED', 'APPROVED', 'CANCELLED'],
  APPROVED: ['PUBLISHING', 'SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PUBLISHING', 'CANCELLED'],
  PUBLISHING: ['PUBLISHED', 'FAILED'],
  PUBLISHED: [],
  FAILED: ['APPROVED', 'CANCELLED'],
  CANCELLED: [],
});

/**
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  return Boolean(ALLOWED_TRANSITIONS[from]?.includes(to));
}

/**
 * @param {string} from
 * @param {string} to
 * @throws {InvalidTransitionError} if the transition isn't allowed
 */
export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(`Cannot move a post from ${from} to ${to}.`);
  }
}
