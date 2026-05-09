// Bu dosyayı frontend projesine kopyala ve CONTRACT_ADDRESS'i
// deploy sonrası alınan adresle güncelle.
// Local ağ adresi: ignition/deployments/chain-31337/deployed_addresses.json
// Sepolia adresi:  ignition/deployments/chain-11155111/deployed_addresses.json

export const CONTRACT_ADDRESS = "0x79878186b6FA4719e93a1604563c41b45ddFCA96"; // local

export const SUPPORTED_CHAIN_ID = 31337; // local hardhat
// Sepolia için: 11155111

export const CHARITY_ABI = [
  {
    "type": "event",
    "name": "Donated",
    "inputs": [
      { "name": "donor",  "type": "address", "indexed": true  },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "RequestCreated",
    "inputs": [
      { "name": "requestId",   "type": "uint256", "indexed": true  },
      { "name": "description", "type": "string",  "indexed": false },
      { "name": "vendor",      "type": "address", "indexed": true  },
      { "name": "amount",      "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Voted",
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": true },
      { "name": "voter",     "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "RequestFinalized",
    "inputs": [
      { "name": "requestId", "type": "uint256", "indexed": true  },
      { "name": "vendor",    "type": "address", "indexed": true  },
      { "name": "amount",    "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "function", "name": "donate",
    "stateMutability": "payable",
    "inputs": [], "outputs": []
  },
  {
    "type": "function", "name": "createRequest",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "_desc",   "type": "string"  },
      { "name": "_vendor", "type": "address" },
      { "name": "_amount", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function", "name": "voteRequest",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "_index", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function", "name": "finalizeRequest",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "_index", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function", "name": "getBalance",
    "stateMutability": "view",
    "inputs": [], "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function", "name": "getRequestsCount",
    "stateMutability": "view",
    "inputs": [], "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function", "name": "getRequest",
    "stateMutability": "view",
    "inputs": [{ "name": "_index", "type": "uint256" }],
    "outputs": [
      { "name": "description", "type": "string"  },
      { "name": "vendor",      "type": "address" },
      { "name": "amount",      "type": "uint256" },
      { "name": "votes",       "type": "uint256" },
      { "name": "completed",   "type": "bool"    }
    ]
  },
  {
    "type": "function", "name": "manager",
    "stateMutability": "view",
    "inputs": [], "outputs": [{ "type": "address" }]
  },
  {
    "type": "function", "name": "totalDonors",
    "stateMutability": "view",
    "inputs": [], "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function", "name": "donations",
    "stateMutability": "view",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function", "name": "hasVoted",
    "stateMutability": "view",
    "inputs": [
      { "name": "", "type": "uint256" },
      { "name": "", "type": "address" }
    ],
    "outputs": [{ "type": "bool" }]
  }
] as const;
