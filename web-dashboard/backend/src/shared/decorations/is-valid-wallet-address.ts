import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export type AddressVariant = 'ethereum' | 'bitcoin' | 'solana' | 'tron';

export interface IsValidWalletAddressOptions extends ValidationOptions {
  variant?: AddressVariant;
  patterns?: RegExp[];
  allowEmpty?: boolean;
}

const WALLET_ADDRESS_PATTERNS: Record<AddressVariant, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

/**
 * Validates if a given string is a valid wallet address for the specified blockchain variant.
 * @param value - The wallet address to validate.
 * @param variant - The type of blockchain.
 * @param patterns - Optional additional regex patterns to validate against.
 */
export function isWalletAddress(
  value: string,
  variant: AddressVariant,
  patterns?: RegExp[],
): boolean {
  if (value.trim() === '') return false;
  if (patterns && patterns.length > 0) {
    return patterns.some((p) => p.test(value.trim()));
  }
  return WALLET_ADDRESS_PATTERNS[variant].test(value.trim());
}

/**
 * @description
 * Kiểm tra địa chỉ ví hợp lệ cho các loại blockchain.
 *
 * @param {IsValidWalletAddressOptions} options - Tuỳ chọn kiểm tra địa chỉ ví.
 * - `variant`: Loại blockchain (mặc định: 'ethereum').
 * - `patterns`: Mảng các biểu thức chính quy bổ sung để kiểm tra địa chỉ.
 * - `allowEmpty`: Cho phép giá trị rỗng hoặc chỉ chứa khoảng trắng (mặc định: false).
 *
 * @example
 * ```
 * class UserDto {
 *   @IsValidWalletAddress({ variant: 'ethereum' })
 *   walletAddress: string;
 * }
 * ```
 */
export function IsValidWalletAddress(
  options: IsValidWalletAddressOptions = {},
) {
  const {
    variant = 'ethereum',
    patterns = [],
    allowEmpty = false,
    ...validationOptions
  } = options;

  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'IsValidWalletAddress',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          // If allowEmpty is true, then empty strings or strings with only whitespace are considered
          // valid addresses. Otherwise, they are invalid.
          if (!value || typeof value !== 'string' || value.trim() === '') {
            return allowEmpty;
          }
          return isWalletAddress(value, variant, patterns);
        },

        defaultMessage(args: ValidationArguments): string {
          const property = args.property;
          return `${property} must be a valid wallet address (${variant})`;
        },
      },
    });
  };
}
