import type { Address } from 'viem'

// npm run deploy sonrası ignition/deployments/chain-31337/deployed_addresses.json
// dosyasından alınan adres buraya yazılır.
export const CONTRACT_ADDRESS: Address = '0x79878186b6FA4719e93a1604563c41b45ddFCA96'

export const CHARITY_ABI = [
  {
    type: 'event', name: 'Donated',
    inputs: [
      { name: 'donor',  type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'RequestCreated',
    inputs: [
      { name: 'requestId',   type: 'uint256', indexed: true  },
      { name: 'description', type: 'string',  indexed: false },
      { name: 'vendor',      type: 'address', indexed: true  },
      { name: 'amount',      type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'Voted',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'voter',     type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'RequestFinalized',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true  },
      { name: 'vendor',    type: 'address', indexed: true  },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function', name: 'donate',
    stateMutability: 'payable',
    inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'createRequest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_desc',   type: 'string'  },
      { name: '_vendor', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'voteRequest',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'finalizeRequest',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'getBalance',
    stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'getRequestsCount',
    stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'getRequest',
    stateMutability: 'view',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [
      { name: 'description', type: 'string'  },
      { name: 'vendor',      type: 'address' },
      { name: 'amount',      type: 'uint256' },
      { name: 'votes',       type: 'uint256' },
      { name: 'completed',   type: 'bool'    },
    ],
  },
  {
    type: 'function', name: 'manager',
    stateMutability: 'view',
    inputs: [], outputs: [{ type: 'address' }],
  },
  {
    type: 'function', name: 'totalDonors',
    stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'donations',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'hasVoted',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'event', name: 'CampaignProposed',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: true },
      { name: 'proposer',   type: 'address', indexed: true },
      { name: 'title',      type: 'string',  indexed: false },
    ],
  },
  {
    type: 'event', name: 'CampaignApproved',
    inputs: [{ name: 'proposalId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event', name: 'CampaignRejected',
    inputs: [{ name: 'proposalId', type: 'uint256', indexed: true }],
  },
  {
    type: 'function', name: 'proposeCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_title',       type: 'string'  },
      { name: '_description', type: 'string'  },
      { name: '_emoji',       type: 'string'  },
      { name: '_goalWei',     type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'approveCampaign',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'rejectCampaign',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'getCampaignProposalsCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'getCampaignProposal',
    stateMutability: 'view',
    inputs: [{ name: '_index', type: 'uint256' }],
    outputs: [
      { name: 'proposer',    type: 'address' },
      { name: 'title',       type: 'string'  },
      { name: 'description', type: 'string'  },
      { name: 'emoji',       type: 'string'  },
      { name: 'goalWei',     type: 'uint256' },
      { name: 'approved',    type: 'bool'    },
      { name: 'rejected',    type: 'bool'    },
    ],
  },
] as const
