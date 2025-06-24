# IPFS Production Setup Guide 🚀

## Current State: Simulated IPFS (Demo Mode)

The current implementation uses **simulated IPFS upload** for demonstration purposes. Here's how to replace it with real IPFS services for production.

## Option 1: Web3.Storage (Recommended for ease)

### Step 1: Get Web3.Storage API Token
1. Go to [web3.storage](https://web3.storage)
2. Sign up and get a free API token
3. Add token to your environment variables

### Step 2: Install Web3.Storage Client
```bash
npm install web3.storage
```

### Step 3: Replace Simulated Upload in `ipfsService.ts`

Replace the `uploadPdfToIpfs` function:

```typescript
import { Web3Storage } from 'web3.storage';

// Add to IPFS_CONFIG
const IPFS_CONFIG = {
  web3StorageToken: process.env.VITE_WEB3_STORAGE_TOKEN || '',
  // ... existing config
};

export const uploadPdfToIpfs = async (
  pdfBuffer: Uint8Array,
  metadata: IpfsMetadata
): Promise<IpfsUploadResult> => {
  try {
    if (!IPFS_CONFIG.web3StorageToken) {
      throw new Error('Web3.Storage token not configured');
    }

    const client = new Web3Storage({ token: IPFS_CONFIG.web3StorageToken });

    // Create File object
    const file = new File([pdfBuffer], metadata.fileName, {
      type: 'application/pdf',
    });

    // Upload to IPFS
    const cid = await client.put([file], {
      name: `loan-contract-${metadata.agreementId}`,
      maxRetries: 3,
    });

    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://w3s.link/ipfs/${cid}/${metadata.fileName}`;

    return {
      cid: cid.toString(),
      ipfsUrl,
      gatewayUrl,
      size: pdfBuffer.length,
      success: true,
      message: 'PDF uploaded to IPFS successfully via Web3.Storage'
    };

  } catch (error) {
    console.error('Web3.Storage upload failed:', error);
    return {
      cid: '',
      ipfsUrl: '',
      gatewayUrl: '',
      size: 0,
      success: false,
      message: `IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
```

### Step 4: Add Environment Variable
```bash
# .env
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token_here
```

## Option 2: Pinata (Recommended for advanced features)

### Step 1: Get Pinata API Keys
1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up and get API Key and Secret
3. Add to environment variables

### Step 2: Install Pinata SDK
```bash
npm install @pinata/sdk
```

### Step 3: Replace Simulated Upload

```typescript
import pinataSDK from '@pinata/sdk';

const pinata = pinataSDK(
  process.env.VITE_PINATA_API_KEY || '',
  process.env.VITE_PINATA_SECRET_API_KEY || ''
);

export const uploadPdfToIpfs = async (
  pdfBuffer: Uint8Array,
  metadata: IpfsMetadata
): Promise<IpfsUploadResult> => {
  try {
    // Test authentication
    const authTest = await pinata.testAuthentication();
    if (!authTest.authenticated) {
      throw new Error('Pinata authentication failed');
    }

    // Create readable stream from buffer
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });

    // Upload to IPFS via Pinata
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: metadata.fileName,
        keyvalues: {
          agreementId: metadata.agreementId,
          lenderName: metadata.lenderName,
          borrowerName: metadata.borrowerName,
          amount: metadata.amount.toString(),
          uploadedAt: metadata.uploadedAt,
        },
      },
      pinataOptions: {
        cidVersion: 0,
      },
    });

    const cid = result.IpfsHash;
    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return {
      cid,
      ipfsUrl,
      gatewayUrl,
      size: pdfBuffer.length,
      success: true,
      message: 'PDF uploaded to IPFS successfully via Pinata'
    };

  } catch (error) {
    console.error('Pinata upload failed:', error);
    return {
      cid: '',
      ipfsUrl: '',
      gatewayUrl: '',
      size: 0,
      success: false,
      message: `IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
```

### Step 4: Add Environment Variables
```bash
# .env
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

## Option 3: Infura IPFS (Enterprise Grade)

### Step 1: Get Infura IPFS Credentials
1. Go to [infura.io](https://infura.io)
2. Create IPFS project
3. Get Project ID and Secret

### Step 2: Install Infura IPFS Client
```bash
npm install ipfs-http-client
```

### Step 3: Replace Simulated Upload

```typescript
import { create as ipfsHttpClient } from 'ipfs-http-client';

const auth = `${process.env.VITE_INFURA_PROJECT_ID}:${process.env.VITE_INFURA_PROJECT_SECRET}`;
const ipfs = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
  },
});

export const uploadPdfToIpfs = async (
  pdfBuffer: Uint8Array,
  metadata: IpfsMetadata
): Promise<IpfsUploadResult> => {
  try {
    // Upload to IPFS
    const result = await ipfs.add({
      path: metadata.fileName,
      content: pdfBuffer,
    });

    const cid = result.cid.toString();
    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://ipfs.infura.io/ipfs/${cid}`;

    return {
      cid,
      ipfsUrl,
      gatewayUrl,
      size: pdfBuffer.length,
      success: true,
      message: 'PDF uploaded to IPFS successfully via Infura'
    };

  } catch (error) {
    console.error('Infura IPFS upload failed:', error);
    return {
      cid: '',
      ipfsUrl: '',
      gatewayUrl: '',
      size: 0,
      success: false,
      message: `IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
```

## Database Migration Required

Before using real IPFS in production, run the database migration:

### Step 1: Run SQL Migration
```sql
-- Copy and run IPFS_DATABASE_UPDATE.sql in Supabase SQL Editor
```

### Step 2: Uncomment RPC Call in contractIpfsUtils.ts
```typescript
// In processContractToIpfs function, uncomment the RPC section:
try {
  const { error: rpcError } = await supabase.rpc('update_contract_ipfs_data', {
    p_agreement_id: agreementData.id,
    p_ipfs_cid: ipfsResult.cid,
    p_ipfs_url: ipfsResult.gatewayUrl,
    p_pdf_size: ipfsResult.size
  });

  if (rpcError) {
    throw rpcError;
  }
} catch (rpcError) {
  // ... fallback handling
}
```

## Security Considerations for Production

### 1. Environment Variables
- Store API keys securely in production environment
- Use different keys for development/staging/production
- Rotate keys regularly

### 2. Private IPFS Networks
For sensitive contracts, consider:
- Private IPFS network with access control
- Encryption before upload
- Permissioned gateways

### 3. Content Verification
- Verify CID matches uploaded content
- Implement content hashing for integrity
- Add file size limits

### 4. Cost Management
- Monitor IPFS storage costs
- Implement file lifecycle policies
- Consider hybrid storage (IPFS + traditional backup)

## Testing the Production Setup

### 1. Unit Tests
```typescript
// Add to your test suite
describe('IPFS Production Upload', () => {
  it('should upload PDF to real IPFS service', async () => {
    const mockPdfBuffer = new Uint8Array([/* test data */]);
    const result = await uploadPdfToIpfs(mockPdfBuffer, testMetadata);
    
    expect(result.success).toBe(true);
    expect(result.cid).toMatch(/^Qm[a-zA-Z0-9]{44}$/);
    expect(result.gatewayUrl).toContain('ipfs');
  });
});
```

### 2. Integration Tests
- Test PDF generation → IPFS upload → database storage flow
- Verify CID retrieval and gateway access
- Test error handling with invalid credentials

## Monitoring & Analytics

### 1. IPFS Upload Metrics
- Track upload success/failure rates
- Monitor upload times and file sizes
- Alert on service unavailability

### 2. Gateway Performance
- Monitor gateway response times
- Track gateway availability
- Implement failover between gateways

## Recommended Setup for Different Stages

### Development
- **Use**: Simulated IPFS (current implementation)
- **Benefit**: Fast development without API costs

### Staging  
- **Use**: Web3.Storage (free tier)
- **Benefit**: Real IPFS testing without production costs

### Production
- **Use**: Pinata or Infura IPFS
- **Benefit**: Enterprise features, SLA, support

## Quick Setup Script

```bash
#!/bin/bash
# setup-production-ipfs.sh

echo "Setting up production IPFS..."

# Install dependencies
npm install web3.storage @pinata/sdk ipfs-http-client

# Create environment template
cat > .env.production << EOF
# Choose one IPFS provider:

# Web3.Storage (Recommended for simplicity)
VITE_WEB3_STORAGE_TOKEN=your_token_here

# OR Pinata (Recommended for features)
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_API_KEY=your_secret_key

# OR Infura (Enterprise)
VITE_INFURA_PROJECT_ID=your_project_id
VITE_INFURA_PROJECT_SECRET=your_project_secret
EOF

echo "✅ IPFS production setup template created!"
echo "📝 Edit .env.production with your API credentials"
echo "🗄️ Run IPFS_DATABASE_UPDATE.sql in Supabase"
echo "🔧 Replace simulated upload in ipfsService.ts"
```

This guide provides multiple production-ready IPFS options. **Web3.Storage is recommended** for its simplicity and free tier that's perfect for getting started!
