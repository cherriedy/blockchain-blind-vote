// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./utils/RsaSignatureVerifier.sol";

contract BlindBallotBox {
    address public admin;
    bytes public rsaN;
    uint256 public rsaE;

    mapping(bytes32 => mapping(bytes32 => uint256)) public electionVotes;
    mapping(bytes32 => mapping(uint256 => uint256)) public pollVotes;
    mapping(bytes32 => bool) public usedMessages;

    event RsaPublicKeySet(bytes n, uint256 e);
    event ElectionVoteCast(
        bytes32 indexed eventId,
        bytes32 indexed candidateId,
        uint256 newTotal
    );
    event PollVoteCast(
        bytes32 indexed eventId,
        uint256 indexed optionIndex,
        uint256 newTotal
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "BlindBallotBox: caller is not the admin");
        _;
    }

    modifier keyIsSet() {
        require(
            rsaN.length != 0 && rsaE != 0,
            "BlindBallotBox: RSA public key not set"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "BlindBallotBox: invalid address");
        admin = _newAdmin;
    }

    function setRsaPublicKey(bytes calldata _n, uint256 _e) external onlyAdmin {
        require(
            _n.length > 0 && _e != 0,
            "BlindBallotBox: invalid RSA parameters"
        );
        rsaN = _n;
        rsaE = _e;
        emit RsaPublicKeySet(_n, _e);
    }

    function castElectionVote(
        bytes32 _eventId,
        bytes32 _candidateId,
        bytes32 _message,
        bytes calldata _signature
    ) external keyIsSet {
        // 1. Verify signature
        require(
            RsaSignatureVerifier.verifyBlindSignature(
                _message,
                _signature,
                rsaN,
                rsaE
            ),
            "BlindBallotBox: invalid blind signature"
        );

        // 2. Anti replay
        require(!usedMessages[_message], "Already voted");
        usedMessages[_message] = true;

        // 3. Count vote
        electionVotes[_eventId][_candidateId] += 1;

        emit ElectionVoteCast(
            _eventId,
            _candidateId,
            electionVotes[_eventId][_candidateId]
        );
    }

    function castPollVote(
        bytes32 _eventId,
        uint256 _optionIndex,
        bytes32 _message,
        bytes calldata _signature
    ) external keyIsSet {
        // 1. Verify signature
        require(
            RsaSignatureVerifier.verifyBlindSignature(
                _message,
                _signature,
                rsaN,
                rsaE
            ),
            "BlindBallotBox: invalid blind signature"
        );

        // 2. Anti replay
        require(!usedMessages[_message], "Already voted");
        usedMessages[_message] = true;

        // 3. Count vote
        pollVotes[_eventId][_optionIndex] += 1;

        emit PollVoteCast(
            _eventId,
            _optionIndex,
            pollVotes[_eventId][_optionIndex]
        );
    }

    function getElectionVoteCount(
        bytes32 _eventId,
        bytes32 _candidateId
    ) external view returns (uint256) {
        return electionVotes[_eventId][_candidateId];
    }

    function getPollVoteCount(
        bytes32 _eventId,
        uint256 _optionIndex
    ) external view returns (uint256) {
        return pollVotes[_eventId][_optionIndex];
    }

    function hashMongoId(
        string calldata _mongoId
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_mongoId));
    }
}
