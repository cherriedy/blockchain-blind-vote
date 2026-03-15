// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./utils/RsaSignatureVerifier.sol";

/**
 * @title BlindBallotBox
 * @notice Accepts ballots accompanied by an RSA blind signature, verifies them
 *         on-chain, and records the vote counts for elections and polls.
 *
 * @dev Vote flow:
 *   1. Admin deploys the contract and calls setRsaPublicKey(n, e) with the
 *      public key from the backend's BlindRsaService (GET /voting/public-key).
 *   2. Voter obtains a blind signature from the backend:
 *        blinded  = message × r^e  mod n   (client-side blinding)
 *        blindSig = blinded^d      mod n   (server-side signing)
 *        sig      = blindSig × r⁻¹ mod n   (client-side unblinding)
 *   3. Voter calls castElectionVote / castPollVote with (eventId, choice, message, sig).
 *   4. Contract verifies:  sig^e mod n == bytes32(message) zero-padded to n.length bytes
 *   5. If valid, the corresponding vote counter is incremented.
 */
contract BlindBallotBox {

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Address of the contract administrator.
    address public admin;

    /// @notice RSA modulus used to verify blind signatures (big-endian bytes, supports 2048-bit).
    bytes public rsaN;

    /// @notice RSA public exponent used to verify blind signatures (e.g. 65537).
    uint256 public rsaE;

    /// @notice Election vote counts: eventId => candidateId => count.
    mapping(bytes32 => mapping(bytes32 => uint256)) public electionVotes;

    /// @notice Poll vote counts: eventId => option index => count.
    mapping(bytes32 => mapping(uint256 => uint256)) public pollVotes;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when the RSA public key is updated.
    event RsaPublicKeySet(bytes n, uint256 e);

    /// @notice Emitted when a valid election ballot is recorded.
    event ElectionVoteCast(
        bytes32 indexed eventId,
        bytes32 indexed candidateId,
        uint256 newTotal
    );

    /// @notice Emitted when a valid poll ballot is recorded.
    event PollVoteCast(
        bytes32 indexed eventId,
        uint256 indexed optionIndex,
        uint256 newTotal
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "BlindBallotBox: caller is not the admin");
        _;
    }

    modifier keyIsSet() {
        require(rsaN.length != 0 && rsaE != 0, "BlindBallotBox: RSA public key not set");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @notice Transfer admin rights to a new address.
     * @param _newAdmin The address of the new administrator.
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "BlindBallotBox: invalid address");
        admin = _newAdmin;
    }

    /**
     * @notice Set the RSA public key used to verify blind signatures.
     *         Obtain n and e from the backend's GET /voting/public-key endpoint.
     * @param _n RSA modulus as big-endian bytes (e.g. 256 bytes for 2048-bit RSA).
     * @param _e RSA public exponent as uint256 (e.g. 65537).
     */
    function setRsaPublicKey(bytes calldata _n, uint256 _e) external onlyAdmin {
        require(_n.length > 0 && _e != 0, "BlindBallotBox: invalid RSA parameters");
        rsaN = _n;
        rsaE = _e;
        emit RsaPublicKeySet(_n, _e);
    }

    // ─── Cast Vote ────────────────────────────────────────────────────────────

    /**
     * @notice Cast a ballot in an election.
     * @param _eventId     keccak256 hash of the election's MongoDB ObjectId.
     * @param _candidateId keccak256 hash of the candidate's MongoDB ObjectId.
     * @param _message     The message that was blind-signed by the backend (bytes32).
     * @param _signature   The unblinded RSA signature over _message (big-endian bytes).
     */
    function castElectionVote(
        bytes32 _eventId,
        bytes32 _candidateId,
        bytes32 _message,
        bytes calldata _signature
    ) external keyIsSet {
        require(
            RsaSignatureVerifier.verifyBlindSignature(_message, _signature, rsaN, rsaE),
            "BlindBallotBox: invalid blind signature"
        );

        electionVotes[_eventId][_candidateId] += 1;
        emit ElectionVoteCast(_eventId, _candidateId, electionVotes[_eventId][_candidateId]);
    }

    /**
     * @notice Cast a ballot in a poll.
     * @param _eventId      keccak256 hash of the poll's MongoDB ObjectId.
     * @param _optionIndex  Zero-based index of the chosen option.
     * @param _message      The message that was blind-signed by the backend (bytes32).
     * @param _signature    The unblinded RSA signature over _message (big-endian bytes).
     */
    function castPollVote(
        bytes32 _eventId,
        uint256 _optionIndex,
        bytes32 _message,
        bytes calldata _signature
    ) external keyIsSet {
        require(
            RsaSignatureVerifier.verifyBlindSignature(_message, _signature, rsaN, rsaE),
            "BlindBallotBox: invalid blind signature"
        );

        pollVotes[_eventId][_optionIndex] += 1;
        emit PollVoteCast(_eventId, _optionIndex, pollVotes[_eventId][_optionIndex]);
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    /**
     * @notice Returns the number of votes a candidate has received in an election.
     */
    function getElectionVoteCount(bytes32 _eventId, bytes32 _candidateId) external view returns (uint256) {
        return electionVotes[_eventId][_candidateId];
    }

    /**
     * @notice Returns the number of votes an option has received in a poll.
     */
    function getPollVoteCount(bytes32 _eventId, uint256 _optionIndex) external view returns (uint256) {
        return pollVotes[_eventId][_optionIndex];
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    /**
     * @notice Hashes a MongoDB ObjectId string to bytes32 using keccak256.
     */
    function hashMongoId(string calldata _mongoId) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_mongoId));
    }
}
