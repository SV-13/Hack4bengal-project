# IPFS Production Integration Guide

## Current Status
The IPFS implementation in `src/utils/ipfsService.ts` is currently **simulated** for demo purposes. This guide shows how to replace it with real IPFS services.

## Option 1: Pinata (Recommended)

### 1. Install Pinata SDK
```bash
npm install @pinata/sdk
```

### 2. Get API Keys
1. Go to [Pinata.cloud](https://pinata.cloud)
2. Create account and get API Key + Secret
3. Add to environment variables:
```env
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_API_KEY=your_secret
```

### 3. Replace uploadPdfToIpfs function
```typescript
import { PinataSDK } from '@pinata/sdk';

const pinata = new PinataSDK({
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY,
  pinataSecretApiKey: import.meta.env.VITE_PINATA_SECRET_API_KEY,
});

export const uploadPdfToIpfs = async (
  pdfBuffer: Uint8Array,
  metadata: IpfsMetadata
): Promise<IpfsUploadResult> => {
  try {
    // Convert buffer to File object
    const file = new File([pdfBuffer], `contract_${metadata.agreementId}.pdf`, {
      type: 'application/pdf'
    });

    // Upload to IPFS via Pinata
    const result = await pinata.upload.file(file, {
      metadata: {
        name: `LendIt Contract - ${metadata.agreementId}`,
        keyvalues: {
          agreementId: metadata.agreementId,
          lenderName: metadata.lenderName,
          borrowerName: metadata.borrowerName,
          amount: metadata.amount.toString(),
          uploadedAt: metadata.uploadedAt
        }
      }
    });

    return {
      cid: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      size: pdfBuffer.length,
      success: true,
      message: 'PDF uploaded to IPFS successfully'
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
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

## Option 2: Web3.Storage

### 1. Install Web3.Storage
```bash
npm install web3.storage
```

### 2. Get API Token
1. Go to [Web3.Storage](https://web3.storage)
2. Create account and get API token
3. Add to environment:
```env
VITE_WEB3_STORAGE_TOKEN=your_token
```

### 3. Replace uploadPdfToIpfs function
```typescript
import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ 
  token: import.meta.env.VITE_WEB3_STORAGE_TOKEN 
});

export const uploadPdfToIpfs = async (
  pdfBuffer: Uint8Array,
  metadata: IpfsMetadata
): Promise<IpfsUploadResult> => {
  try {
    const file = new File([pdfBuffer], `contract_${metadata.agreementId}.pdf`, {
      type: 'application/pdf'
    });

    const cid = await client.put([file], {
      name: `LendIt Contract - ${metadata.agreementId}`,
      maxRetries: 3
    });

    return {
      cid: cid,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `https://${cid}.ipfs.dweb.link`,
      size: pdfBuffer.length,
      success: true,
      message: 'PDF uploaded to IPFS successfully'
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
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

## Database Migration

Before using real IPFS, run the database migration:

```sql
-- Run the IPFS_DATABASE_UPDATE.sql file
-- This adds the necessary columns for IPFS data storage
```

Then uncomment the RPC call in `contractIpfsUtils.ts`:

```typescript
// Uncomment lines 34-42 in processContractToIpfs function
const { error: rpcError } = await supabase.rpc('update_contract_ipfs_data', {
  p_agreement_id: agreementData.id,
  p_ipfs_cid: ipfsResult.cid,
  p_ipfs_url: ipfsResult.gatewayUrl,
  p_pdf_size: ipfsResult.size
});
```

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Server-side upload**: Consider moving IPFS upload to API routes
3. **File validation**: Validate PDF files before upload
4. **Rate limiting**: Implement upload rate limiting
5. **Encryption**: Consider encrypting sensitive contract data

## Cost Estimation

- **Pinata**: Free tier: 1GB storage, paid plans from $20/month
- **Web3.Storage**: Free tier: 5GB storage, paid plans from $5/month

## Testing

1. Test with small PDF files first
2. Verify CID generation and retrieval
3. Test multiple gateway URLs for redundancy
4. Monitor upload success rates and performance
