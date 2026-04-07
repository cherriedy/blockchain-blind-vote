import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createPrivateKey, generateKeyPairSync, KeyObject } from 'crypto';
import { modPow } from 'bigint-mod-arith';
import { RsaKeyComponent, VotingRsaPublicKey } from './interfaces';
import { VotingContextService } from '../context';
import { prisma } from 'prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class BlindRsaService {
  private readonly logger = new Logger(BlindRsaService.name);

  /** RSA public modulus */
  private readonly n: bigint;
  /** RSA public exponent */
  private readonly e: bigint;
  /** RSA private exponent */
  private readonly d: bigint;
  /** n as fixed-length hex (modulusBits / 4 chars) */
  private readonly nHex: string;
  /** e as minimal hex */
  private readonly eHex: string;
  /** Number of bits in the modulus n (e.g. 2048) */
  private readonly modulusSize: number;

  constructor(private readonly votingContextService: VotingContextService) {
    const { n, e, d, size } = this.loadOrGenerateKeyPair();
    this.n = n;
    this.e = e;
    this.d = d;
    this.modulusSize = size;

    // Store n and e as hex strings for easy transmission to clients.
    this.nHex = n.toString(16).padStart(size / 4, '0');
    this.eHex = e.toString(16);

    this.logger.log(`RSA n: 0x${this.nHex}`);
    this.logger.log(`RSA e: 0x${this.eHex}`);
  }

  // ─── Key management ──────────────────────────────────────────────────────────

  /**
   * Loads the RSA private key from the `RSA_BLIND_PRIVATE_KEY` environment variable, or generates
   * a new ephemeral 2048-bit key if not set.
   *
   * @remarks
   * In production, you should set `RSA_BLIND_PRIVATE_KEY` to a securely generated RSA private key in PEM format.
   * ```bash
   * openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
   * ```
   * Then set the environment variable, ensuring to properly escape newlines if needed (e.g. in Docker):
   * ```bash
   * export RSA_BLIND_PRIVATE_KEY="$(cat private_key.pem | awk '{printf "%s\\n", $0}')"
   * ```
   *
   * @return {RsaKeyComponent} The RSA key components (n, e, d) and modulus bit length.
   */
  private loadOrGenerateKeyPair(): RsaKeyComponent {
    try {
      // Đọc key từ file
      const pem = fs.readFileSync('keys/private.pem', 'utf-8');

      // Convert sang KeyObject
      const keyObj: KeyObject = createPrivateKey(pem);

      // Export sang JWK
      const jwk = keyObj.export({ format: 'jwk' }) as Record<string, string>;

      const nBuf = Buffer.from(jwk.n, 'base64url');

      return {
        n: this.base64urlToBigInt(jwk.n),
        e: this.base64urlToBigInt(jwk.e),
        d: this.base64urlToBigInt(jwk.d),
        size: nBuf.length * 8,
      };
    } catch (err) {
      this.logger.warn('⚠️ Không tìm thấy key, đang generate mới...');

      // Generate key mới nếu chưa có
      const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      // Lưu lại để dùng lần sau
      if (!fs.existsSync('keys')) {
        fs.mkdirSync('keys');
      }

      fs.writeFileSync('keys/private.pem', privateKey);
      fs.writeFileSync('keys/public.pem', publicKey);

      // Convert sang KeyObject
      const keyObj: KeyObject = createPrivateKey(privateKey);
      const jwk = keyObj.export({ format: 'jwk' }) as Record<string, string>;

      const nBuf = Buffer.from(jwk.n, 'base64url');

      return {
        n: this.base64urlToBigInt(jwk.n),
        e: this.base64urlToBigInt(jwk.e),
        d: this.base64urlToBigInt(jwk.d),
        size: nBuf.length * 8,
      };
    }
  }

  // ─── Math helpers ─────────────────────────────────────────────────────────────

  /** Converts a base64url-encoded string to a BigInt. */
  private base64urlToBigInt(b64url: string): bigint {
    return BigInt('0x' + Buffer.from(b64url, 'base64url').toString('hex'));
  }

  /** Parses a hex string (with optional 0x prefix) into a BigInt, validating that it is non-empty and contains only hex digits. */
  private parseHexToBigInt(value: string, fieldName: string): bigint {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
      throw new BadRequestException(
        `${fieldName} must be a non-empty hex string`,
      );
    }
    return BigInt('0x' + hex);
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  /**
   * Returns the RSA public key components `(n, e)` for the given vote scope.
   *
   * @example
   * ```JavaScript
   *  // The client uses these to blind their vote token before submitting it
   *  blinded = H(token) × r^e mod n
   * ```
   *
   * @param voteType - Type of voting event
   * @param voteId   - Identifier of the voting event
   * @returns The RSA public key components and metadata about the voting event.
   */
  getPublicKey(voteType: string, voteId: string): VotingRsaPublicKey {
    this.votingContextService.assertVoteScope(voteType, voteId);
    return {
      n: this.nHex,
      e: this.eHex,
      size: this.modulusSize,
      voteType,
      voteId,
    };
  }

  /**
   * Issues an RSA blind signature over the submitted blinded message.
   *
   * Protocol step (server side):
   *   blindSig = blindedMessage^d mod n
   *
   * The client then unblinds with their secret blinding factor r:
   *   sig = blindSig × r⁻¹ mod n  =  H(token)^d mod n
   *
   * @param studentId       - The student ID of the voter requesting the blind signature.
   * @param blindedMessage - Hex-encoded blinded message (0x-prefix optional)
   * @param voteType       - Type of voting event
   * @param voteId         - Identifier of the voting event
   * @returns `{ blindSignature }` — hex-encoded, 0x-prefixed blind signature
   */
  async requestBlindSig(
    studentId: string,
    blindedMessage: string,
    voteType: string,
    voteId: string,
  ) {
    this.votingContextService.assertVoteScope(voteType, voteId);

    const blindedBigInt = this.parseHexToBigInt(
      blindedMessage,
      'blindedMessage',
    );

    if (blindedBigInt <= 0n || blindedBigInt >= this.n) {
      throw new BadRequestException(
        'blindedMessage must be in the range (0, n); check that you are using the correct public key',
      );
    }

    // Check eligibility challenge status before issuing blind signature
    const ballotRequest = await prisma.ballotRequest.findFirst({
      where: {
        studentId,
        voteType,
        voteId,
        isChallenged: true,
      },
    });
    if (!ballotRequest) {
      throw new BadRequestException(
        'You must complete eligibility challenge before requesting a blind signature.',
      );
    }

    // Prevent issuing a second blind signature for the same voter/event.
    if (ballotRequest.isSigned) {
      throw new BadRequestException(
        'A blind signature has already been issued for this voter and voting event.',
      );
    }

    // Core RSA blind signing: b^d mod n
    const blindSigBigInt = modPow(blindedBigInt, this.d, this.n);
    const blindSignature =
      '0x' + blindSigBigInt.toString(16).padStart(this.modulusSize / 4, '0');

    // Mark as signed so this voter cannot request another blind signature
    await prisma.ballotRequest.update({
      where: { id: ballotRequest.id },
      data: { isSigned: true },
    });

    return { blindSignature };
  }
}
