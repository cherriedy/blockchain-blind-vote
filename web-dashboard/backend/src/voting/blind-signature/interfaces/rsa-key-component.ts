/**
 * @description Defines the components of an RSA key pair used in the blind signature scheme.
 *
 * @interface RsaKeyComponent
 * @property {bigint} n - The RSA modulus, a product of two large primes (p and q).
 * @property {bigint} e - The RSA public exponent, typically a small odd integer (e.g., 65537).
 * @property {bigint} d - The RSA private exponent, computed as the modular inverse of e mod φ(n).
 * @property {number} size - The bit length of the RSA modulus n (e.g., 2048).
 *
 */
export interface RsaKeyComponent {
  n: bigint;
  e: bigint;
  d: bigint;
  size: number;
}
