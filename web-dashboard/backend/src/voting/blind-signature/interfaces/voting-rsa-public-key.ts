/**
 * @description
 * This interface represents the structure of a voting RSA public key used in blind signature schemes.
 *
 * @property {string} n - The RSA modulus, represented as a hex string.
 * @property {string} e - The RSA public exponent, represented as a hex string.
 * @property {number} size - The size of the RSA key in bits (e.g., 2048).
 * @property {string} voteType - The type of voting event (e.g., "ELECTION").
 * @property {string} voteId - The unique identifier for the voting event.
 *
 * @example
 * {
 *   n: 'c1a2b3...',
 *   e: '10001...',
 *   keySize: 2048,
 *   voteType: 'ELECTION',
 *   voteId: '6630a1b2c3d4e5f6a7b8c9d0'
 * }
 */
export interface VotingRsaPublicKey {
  n: string;
  e: string;
  size: number;
  voteType: string;
  voteId: string;
}
