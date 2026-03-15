// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library RsaSignatureVerifier {

/**
 * @notice Verifies an RSA blind signature.
 * @dev Computes signature^e mod n via the modexp precompile and checks
 *      that the result equals the message zero-padded to n.length bytes.
 *      Supports 2048-bit (and other sizes) RSA because all parameters are
 *      passed as variable-length byte arrays.
 * @param message   The original message (bytes32) that was blind-signed.
 * @param signature The unblinded RSA signature: message^d mod n (as bytes, big-endian).
 * @param n         RSA modulus (bytes, big-endian).
 * @param e         RSA public exponent (uint256, e.g. 65537).
 * @return True if signature^e mod n == uint256(message), false otherwise.
 */
    function verifyBlindSignature(
        bytes32 message,
        bytes memory signature,
        bytes memory n,
        uint256 e
    ) internal view returns (bool) {
        require(n.length > 0 && e != 0, "Invalid RSA parameters");
        require(signature.length == n.length, "Signature size mismatch");

        // Encode e as a minimal big-endian byte array (strip leading zero bytes).
        bytes memory eBytes = _uint256ToMinBytes(e);

        // Modexp precompile (EIP-198) input:
        //   <uint256: base_len> <uint256: exp_len> <uint256: mod_len>
        //   <base_len bytes: base> <exp_len bytes: exp> <mod_len bytes: mod>
        bytes memory input = abi.encodePacked(
            uint256(signature.length), // base  = signature
            uint256(eBytes.length),    // exp   = e
            uint256(n.length),         // mod   = n
            signature,
            eBytes,
            n
        );

        (bool success, bytes memory result) = address(0x05).staticcall(input);
        if (!success || result.length != n.length) {
            return false;
        }

        // The result should equal the message (bytes32) zero-padded to n.length bytes:
        //   result[0 .. n.length-33]  must all be 0x00
        //   result[n.length-32 .. n.length-1]  must equal message
        if (n.length < 32) return false;

        uint256 padLen = n.length - 32;
        for (uint256 i = 0; i < padLen; i++) {
            if (result[i] != 0) return false;
        }

        // Read the last 32 bytes of result.
        // Memory layout of `bytes memory result`:
        //   result            → pointer (ptr)
        //   mload(ptr)        → length (= n.length)
        //   ptr + 32          → first data byte
        //   ptr + n.length    → last 32 data bytes start here
        bytes32 recovered;
        assembly {
            recovered := mload(add(result, mload(result)))
        }
        return recovered == message;
    }

    /**
     * @dev Converts a uint256 to a minimal big-endian byte array (no leading zeros).
     *      Used to encode the RSA public exponent for the modexp precompile.
     */
    function _uint256ToMinBytes(uint256 value) private pure returns (bytes memory) {
        if (value == 0) {
            bytes memory zero = new bytes(1);
            return zero;
        }
        // Count significant bytes.
        uint256 temp = value;
        uint256 byteCount = 0;
        while (temp > 0) {
            byteCount++;
            temp >>= 8;
        }
        bytes memory result = new bytes(byteCount);
        temp = value;
        for (uint256 i = byteCount; i > 0; i--) {
            result[i - 1] = bytes1(uint8(temp & 0xff));
            temp >>= 8;
        }
        return result;
    }
}