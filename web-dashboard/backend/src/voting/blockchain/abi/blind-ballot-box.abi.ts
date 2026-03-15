export const BLIND_BALLOT_BOX_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'eventId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'candidateId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newTotal',
        type: 'uint256',
      },
    ],
    name: 'ElectionVoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'eventId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'optionIndex',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newTotal',
        type: 'uint256',
      },
    ],
    name: 'PollVoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes', name: 'n', type: 'bytes' },
      { indexed: false, internalType: 'uint256', name: 'e', type: 'uint256' },
    ],
    name: 'RsaPublicKeySet',
    type: 'event',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_eventId', type: 'bytes32' },
      { internalType: 'bytes32', name: '_candidateId', type: 'bytes32' },
      { internalType: 'bytes32', name: '_message', type: 'bytes32' },
      { internalType: 'bytes', name: '_signature', type: 'bytes' },
    ],
    name: 'castElectionVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_eventId', type: 'bytes32' },
      { internalType: 'uint256', name: '_optionIndex', type: 'uint256' },
      { internalType: 'bytes32', name: '_message', type: 'bytes32' },
      { internalType: 'bytes', name: '_signature', type: 'bytes' },
    ],
    name: 'castPollVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_eventId', type: 'bytes32' },
      { internalType: 'bytes32', name: '_candidateId', type: 'bytes32' },
    ],
    name: 'getElectionVoteCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_eventId', type: 'bytes32' },
      { internalType: 'uint256', name: '_optionIndex', type: 'uint256' },
    ],
    name: 'getPollVoteCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_mongoId', type: 'string' }],
    name: 'hashMongoId',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: '_n', type: 'bytes' },
      { internalType: 'uint256', name: '_e', type: 'uint256' },
    ],
    name: 'setRsaPublicKey',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_newAdmin', type: 'address' }],
    name: 'transferAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
