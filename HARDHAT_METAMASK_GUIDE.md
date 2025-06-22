# Hardhat + MetaMask Local Development Guide

This guide will help you set up Hardhat with MetaMask for local blockchain development with the LendIt P2P lending platform.

## Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask browser extension installed

## Step 1: Start the Hardhat Local Network

First, you need to start the Hardhat local network:

```bash
# Navigate to the hardhat directory
cd hardhat

# Install dependencies if you haven't already
npm install

# Start the local Hardhat network
npx hardhat node
```

This will start a local Ethereum network and print out a list of available accounts with their private keys. Keep this terminal window open.

## Step 2: Deploy Smart Contracts to Local Network

Open a new terminal window and deploy the contracts to your local network:

```bash
# Navigate to the hardhat directory
cd hardhat

# Deploy contracts to local network
npx hardhat run --network localhost scripts/deploy.js
```

You should see output showing the deployed contract addresses. Make note of the `LoanAgreementFactory` address as you'll need it later.

## Step 3: Configure MetaMask to Connect to Hardhat Network

1. Open MetaMask in your browser
2. Click on the network dropdown at the top (likely says "Ethereum Mainnet")
3. Select "Add Network" or "Custom RPC"
4. Fill in the following details:
   - Network Name: `Hardhat Local`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
   - Block Explorer URL: (leave blank)
5. Click "Save"

## Step 4: Import Test Accounts to MetaMask

1. In MetaMask, click on your account icon in the top-right corner
2. Select "Import Account"
3. Copy one of the private keys from your Hardhat terminal (without the "0x" prefix)
4. Paste the private key into MetaMask and click "Import"

You should now have access to one of the test accounts with 10,000 ETH for testing.

## Step 5: Update Web3Context to Use Local Network

Edit the `src/contexts/Web3Context.tsx` file to ensure it connects to your local network:

```tsx
// Make sure the provider connects to the local network when in development mode
const provider = window.ethereum
  ? new ethers.providers.Web3Provider(window.ethereum)
  : new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
```

## Step 6: Update Contract Addresses

After deploying your contracts, you need to update the contract addresses in your application.

Create or edit a file called `.env.local` in the project root:

```
VITE_LOAN_FACTORY_ADDRESS=0x...  # Your deployed LoanAgreementFactory address
```

## Step 7: Testing Smart Contract Interaction

1. Start your React application:
   ```bash
   npm run dev
   ```

2. Navigate to the application in your browser

3. Make sure MetaMask is connected to the Hardhat Local network

4. When creating a loan with smart contract enabled, MetaMask should prompt you to sign the transaction

## Troubleshooting

### Reset MetaMask Account

If you encounter issues with transaction nonces or state:

1. Open MetaMask
2. Click on your account icon
3. Go to Settings > Advanced
4. Scroll down and click "Reset Account"

### Network Connection Issues

If you can't connect to the Hardhat network:

1. Make sure the Hardhat node is running
2. Check that the RPC URL is correct (`http://127.0.0.1:8545`)
3. Verify the Chain ID is `31337`

### Contract Deployment Issues

If contracts don't deploy correctly:

1. Make sure you're in the `hardhat` directory
2. Check that the `hardhat.config.js` has the correct network configuration:

```javascript
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // other networks...
  },
  // rest of config...
};
```

## Advanced: Using Hardhat Console for Debugging

You can interact with your deployed contracts directly using the Hardhat console:

```bash
npx hardhat console --network localhost
```

Then you can interact with your contracts:

```javascript
// Get the factory contract
const Factory = await ethers.getContractFactory("LoanAgreementFactory");
const factory = await Factory.attach("YOUR_DEPLOYED_FACTORY_ADDRESS");

// Create a new loan agreement
const tx = await factory.createLoanAgreement(
  "0xYourAddress", // borrower
  "0xAnotherAddress", // lender
  ethers.utils.parseEther("1.0"), // 1 ETH
  500, // 5% interest rate (in basis points)
  12 // 12 months duration
);

// Wait for transaction to be mined
await tx.wait();

// Get the created loan agreement address
const loanAddress = await factory.getLoanAgreement(0);
console.log("Loan Agreement created at:", loanAddress);
```

## Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ethers.js Documentation](https://docs.ethers.io/v5/) 