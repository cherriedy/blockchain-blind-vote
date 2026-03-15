import {
  EligibilityChallengeResponseDto,
  EligibilityAlreadyVerifiedResponseDto,
} from './eligibility.dto';

export function toEligibilityChallengeResponseDto(
  nonce: string,
  expiresAt: Date,
  message: string,
): EligibilityChallengeResponseDto {
  return { nonce, expiresAt, message };
}

export function toEligibilityAlreadyVerifiedResponseDto(
  message: string,
): EligibilityAlreadyVerifiedResponseDto {
  return { verified: true, message };
}
