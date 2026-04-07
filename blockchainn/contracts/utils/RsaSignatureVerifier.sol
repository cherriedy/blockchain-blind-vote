// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library RsaSignatureVerifier {
    /**
     * @notice Verifies an RSA blind signature.
     * @dev Computes signature^e mod n via the modexp precompile and checks
     *      that the result equals the message zero-padded to n.length bytes.
     *      Supports variable-size RSA because all parameters are variable-length.
     * @param message   The original message (bytes32) that was blind-signed.
     * @param signature The unblinded RSA signature as bytes (big-endian).
     * @param n         RSA modulus as bytes (big-endian).
     * @param e         RSA public exponent.
     * @return True if the signature is valid.
     */
    function verifyBlindSignature(
        bytes32 message,
        bytes memory signature,
        bytes memory n,
        uint256 e
    ) internal view returns (bool) {
        require(n.length > 0 && e != 0, "Invalid RSA parameters");
        require(signature.length == n.length, "Signature size mismatch");

        bytes memory eBytes = _uint256ToMinBytes(e);

        bytes memory input = abi.encodePacked(
            uint256(signature.length),
            uint256(eBytes.length),
            uint256(n.length),
            signature,
            eBytes,
            n
        );

        (bool success, bytes memory result) = address(0x05).staticcall(input);
        if (!success || result.length != n.length) {
            return false;
        }

        if (n.length < 32) {
            return false;
        }

        uint256 padLen = n.length - 32;
        for (uint256 i = 0; i < padLen; i++) {
            if (result[i] != 0) {
                return false;
            }
        }

        bytes32 recovered;
        assembly {
            recovered := mload(add(result, mload(result)))
        }

        return recovered == message;
    }

    function _uint256ToMinBytes(uint256 value) private pure returns (bytes memory) {
        if (value == 0) {
            bytes memory zero = new bytes(1);
            return zero;
        }

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
