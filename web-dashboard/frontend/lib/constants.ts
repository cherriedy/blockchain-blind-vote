// lib/constants.ts
// CONTRACT_ADDRESS: fill in after deploying BlindBallotBox via `npx hardhat run scripts/deploy.js --network <network>`
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "eventId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "candidateId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTotal",
        type: "uint256",
      },
    ],
    name: "ElectionVoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "eventId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "optionIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTotal",
        type: "uint256",
      },
    ],
    name: "PollVoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "n", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "e", type: "uint256" },
    ],
    name: "RsaPublicKeySet",
    type: "event",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_eventId", type: "bytes32" },
      { internalType: "bytes32", name: "_candidateId", type: "bytes32" },
      { internalType: "bytes32", name: "_message", type: "bytes32" },
      { internalType: "uint256", name: "_signature", type: "uint256" },
    ],
    name: "castElectionVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_eventId", type: "bytes32" },
      { internalType: "uint256", name: "_optionIndex", type: "uint256" },
      { internalType: "bytes32", name: "_message", type: "bytes32" },
      { internalType: "uint256", name: "_signature", type: "uint256" },
    ],
    name: "castPollVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "bytes32", name: "", type: "bytes32" },
    ],
    name: "electionVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_eventId", type: "bytes32" },
      { internalType: "bytes32", name: "_candidateId", type: "bytes32" },
    ],
    name: "getElectionVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_eventId", type: "bytes32" },
      { internalType: "uint256", name: "_optionIndex", type: "uint256" },
    ],
    name: "getPollVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_mongoId", type: "string" }],
    name: "hashMongoId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "pollVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rsaE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rsaN",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_n", type: "uint256" },
      { internalType: "uint256", name: "_e", type: "uint256" },
    ],
    name: "setRsaPublicKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_newAdmin", type: "address" }],
    name: "transferAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
