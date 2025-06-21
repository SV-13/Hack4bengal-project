# Loan Agreement Smart Contract Deployment Guide

This guide explains how to deploy the LendIt loan agreement smart contracts using Hardhat and Infura.

## Prerequisites

1. Node.js (v14+) and npm installed
2. Ethereum wallet with ETH for gas fees
3. Infura API key (already set up in config)

## Setup

1. Install Hardhat and dependencies:

```bash
cd hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
```

2. Create a `.env` file in the hardhat directory with your private key:

```
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

> **IMPORTANT**: Never commit your private key to git or share it with anyone!

3. Update `hardhat.config.js` to use your private key:

```javascript
require("dotenv").config();
// Uncomment the accounts line in the network config
```

## Deployment

### Local Deployment (Testing)

To deploy on a local Hardhat network for testing:

```bash
npx hardhat node
# In a separate terminal
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment (Goerli or Sepolia)

To deploy on Ethereum testnet:

```bash
# For Goerli
npx hardhat run scripts/deploy.js --network goerli

# For Sepolia 
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet Deployment

To deploy on Ethereum mainnet:

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

> **IMPORTANT**: Deploying to mainnet costs real ETH. Ensure your contract is thoroughly tested before deploying.

## Contract Verification

The deployment script automatically attempts to verify the contract on Etherscan. If verification fails, you can verify manually:

```bash
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS
```

## After Deployment

1. Save the deployed factory contract address for use in your frontend application
2. Update the `LOAN_FACTORY_ADDRESS` constant in `src/utils/contractGenerator.ts`
3. Update ABI if needed

## Contract Interaction

Once deployed, your smart contract can be interacted with using:

1. Web3.js or Ethers.js via your frontend application
2. Hardhat console for testing

```bash
npx hardhat console --network goerli
```

Example interaction using Hardhat console:

```javascript
// Get the factory contract
const factory = await ethers.getContractAt("LoanAgreementFactory", "YOUR_DEPLOYED_ADDRESS");

// Create a loan agreement
const tx = await factory.createLoanAgreement(
  "BORROWER_ADDRESS", 
  ethers.parseEther("1.0"), // 1 ETH
  500, // 5% interest
  12 // 12 months
);

// Wait for transaction confirmation
await tx.wait();

// Get all loan agreements
const agreements = await factory.getLoanAgreements();
```

## Security Considerations

1. Use a dedicated wallet for contract deployment and interaction
2. Consider having your contracts audited before mainnet deployment
3. Monitor your contracts for any suspicious activity

## Troubleshooting

1. **Error: Nonce too high**: Reset your account nonce in Metamask
2. **Error: Insufficient funds**: Ensure your wallet has enough ETH for gas
3. **Error: Contract verification failed**: Check that compiler settings match exactly

For additional help, refer to the [Hardhat documentation](https://hardhat.org/docs). 