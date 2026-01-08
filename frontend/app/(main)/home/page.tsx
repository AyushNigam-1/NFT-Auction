"use client"

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    generateSigner,
    transactionBuilder,
    percentAmount,
    createGenericFileFromBrowserFile
} from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';

// Define the component
const page = () => {
    const wallet = useWallet();
    const [file, setFile] = useState<File | null>(null);
    const [nftName, setNftName] = useState('');
    const [status, setStatus] = useState('');
    const [mintAddress, setMintAddress] = useState('');

    // 1. Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    // 2. Mint Function
    const mintNft = useCallback(async () => {
        if (!wallet.publicKey || !file || !nftName) {
            setStatus('Please connect wallet, select an image, and enter a name.');
            return;
        }

        try {
            setStatus('Initializing Umi...');

            // Setup Umi
            // NOTE: Using a public RPC for demo. In production, use your Helius/QuickNode RPC.
            const umi = createUmi('https://api.devnet.solana.com')
                .use(mplTokenMetadata())
                .use(irysUploader())
                .use(walletAdapterIdentity(wallet));

            setStatus('Uploading Image to Arweave...');

            // 1. Upload Image
            // createGenericFileFromBrowserFile is a helper to convert browser File object
            const genericFile = await createGenericFileFromBrowserFile(file);
            const [imageUri] = await umi.uploader.upload([genericFile]);

            setStatus('Uploading Metadata...');

            // 2. Upload JSON Metadata
            const metadata = {
                name: nftName,
                symbol: "MYNFT",
                description: "Created via my custom GUI",
                image: imageUri,
                properties: {
                    files: [
                        {
                            type: file.type,
                            uri: imageUri,
                        },
                    ],
                },
            };

            const [metadataUri] = await umi.uploader.uploadJson(metadata);

            setStatus('Minting NFT... (Please approve transaction)');

            // 3. Create NFT Transaction
            const mint = generateSigner(umi);

            const { signature } = await createNft(umi, {
                mint,
                name: nftName,
                uri: metadataUri,
                sellerFeeBasisPoints: percentAmount(0), // 0% Royalties
            }).sendAndConfirm(umi);

            setStatus('Success!');
            setMintAddress(mint.publicKey.toString());
            console.log('NFT Minted:', mint.publicKey.toString());

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        }
    }, [wallet, file, nftName]);

    return (
        <div className="p-4 border rounded-lg max-w-md mx-auto mt-10 space-y-4">
        </div>
    );
};

export default page;