import { BlindRsaPublicKeyResponseDto } from './blind-rsa.dto';

export const toBlindRsaPublicKeyResponseDto = (
  data: any,
): BlindRsaPublicKeyResponseDto => ({
  n: data.n,
  e: data.e,
  keyBits: data.keyBits,
  voteType: data.voteType,
  voteId: data.voteId,
});

export interface BlindSignatureResponseDto {
  blindSignature: string;
}

export const toBlindSignatureResponseDto = (
  blindSignature: string,
): BlindSignatureResponseDto => ({
  blindSignature,
});
