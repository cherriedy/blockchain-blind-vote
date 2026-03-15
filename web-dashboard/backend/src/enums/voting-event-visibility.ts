/**
 * @description Enum representing the visibility of a voting event.
 *
 * @enum {string}
 * @property {string} PUBLIC - The voting event is visible to everyone.
 * @property {string} PRIVATE - The voting event is only visible to authorized users.
 */
export enum VotingEventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}
