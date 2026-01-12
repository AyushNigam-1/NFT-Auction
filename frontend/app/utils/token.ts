// // hooks/useTokenActions.ts
// import { useCallback } from 'react';
// import {
//     Connection,
//     PublicKey,
//     Transaction,
//     SystemProgram,
//     Keypair
// } from "@solana/web3.js";
// import {
//     createInitializeMintInstruction,
//     createAssociatedTokenAccountInstruction,
//     createMintToInstruction,
//     createSetAuthorityInstruction,
//     getAssociatedTokenAddressSync,
//     getMinimumBalanceForRentExemptMint,
//     MINT_SIZE,
//     TOKEN_PROGRAM_ID,
//     ASSOCIATED_TOKEN_PROGRAM_ID,
//     AuthorityType,
// } from "@solana/spl-token";
// import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// import { BN } from "@coral-xyz/anchor";
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
// import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';

import { getAccount } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

// export const useTokenActions = () => {
//     const { connection } = useConnection();
//     const { publicKey, sendTransaction } = useWallet();

//     const createTokenMetadata = useCallback(async (
//         mintAddress: PublicKey,
//         name: string,
//         symbol: string,
//         uri: string // The JSON URL (e.g., from Pinata)
//     ): Promise<string | null> => {
//         if (!publicKey || !wallet) throw new Error("Wallet not connected");

//         try {
//             // 1. Setup UMI (Metaplex Standard Wrapper)
//             const umi = createUmi(connection.rpcEndpoint)
//                 .use(walletAdapterIdentity(wallet.adapter));

//             // 2. Build the Instruction
//             // We use UMI to build it, then convert it to a standard web3.js instruction
//             const builder = createMetadataAccountV3(umi, {
//                 mint: umiPublicKey(mintAddress.toBase58()),
//                 mintAuthority: umi.identity,
//                 payer: umi.identity,
//                 updateAuthority: umi.identity,
//                 data: {
//                     name: name,
//                     symbol: symbol,
//                     uri: uri, // Points to your JSON
//                     sellerFeeBasisPoints: 0,
//                     creators: null,
//                     collection: null,
//                     uses: null,
//                 },
//                 isMutable: true,
//             });

//             // 3. Convert to web3.js Transaction
//             const transaction = new Transaction();
//             const instructions = builder.getInstructions();

//             // Convert UMI instructions to Web3.js instructions
//             instructions.forEach(ix => {
//                 transaction.add(toWeb3JsInstruction(ix));
//             });

//             // 4. Send
//             const signature = await sendTransaction(transaction, connection);
//             console.log(`Metadata created! Tx: ${signature}`);
//             await connection.confirmTransaction(signature, 'confirmed');

//             return signature;
//         } catch (error) {
//             console.error("Failed to create metadata:", error);
//             return null;
//         }
//     }, [connection, publicKey, sendTransaction, wallet]);

//     // ... (Keep your existing createTokenMint, createATA, mintTokens helpers here) ...
//     // Note: I am omitting them here for brevity, but they should be in this file.

//     return {
//         // ... existing exports
//         createTokenMetadata
//     };
// };
// // 1. Create a new Token Mint
// const createTokenMint = useCallback(async (
//     decimals: number = 6,
//     mintAuthority?: PublicKey,
//     freezeAuthority?: PublicKey
// ): Promise<PublicKey | null> => {
//     if (!publicKey) throw new Error("Wallet not connected");

//     try {
//         // Generate a new keypair for the mint
//         const mintKeypair = Keypair.generate();
//         const lamports = await getMinimumBalanceForRentExemptMint(connection);

//         const transaction = new Transaction().add(
//             // Create the Mint Account
//             SystemProgram.createAccount({
//                 fromPubkey: publicKey,
//                 newAccountPubkey: mintKeypair.publicKey,
//                 space: MINT_SIZE,
//                 lamports,
//                 programId: TOKEN_PROGRAM_ID,
//             }),
//             // Initialize the Mint
//             createInitializeMintInstruction(
//                 mintKeypair.publicKey,
//                 decimals,
//                 mintAuthority || publicKey, // Mint Authority
//                 freezeAuthority || null,    // Freeze Authority
//                 TOKEN_PROGRAM_ID
//             )
//         );

//         // Send transaction (Wallet pays fees, Mint Keypair signs for creation)
//         const signature = await sendTransaction(transaction, connection, {
//             signers: [mintKeypair], // The mint itself must sign to be created
//         });

//         console.log(`Mint created! Tx: ${signature}, Mint: ${mintKeypair.publicKey.toBase58()}`);

//         // Wait for confirmation
//         await connection.confirmTransaction(signature, 'confirmed');

//         return mintKeypair.publicKey;
//     } catch (error) {
//         console.error("Failed to create mint:", error);
//         return null;
//     }
// }, [connection, publicKey, sendTransaction]);

// // 2. Create an Associated Token Account (ATA)
// const createATA = useCallback(async (
//     mint: PublicKey,
//     owner?: PublicKey
// ): Promise<PublicKey | null> => {
//     if (!publicKey) throw new Error("Wallet not connected");

//     try {
//         const tokenOwner = owner || publicKey;

//         // Derive the ATA address
//         const ataAddress = getAssociatedTokenAddressSync(
//             mint,
//             tokenOwner,
//             false,
//             TOKEN_PROGRAM_ID,
//             ASSOCIATED_TOKEN_PROGRAM_ID
//         );

//         const transaction = new Transaction().add(
//             createAssociatedTokenAccountInstruction(
//                 publicKey, // Payer
//                 ataAddress, // New ATA
//                 tokenOwner, // Owner of the new ATA
//                 mint,      // Mint
//                 TOKEN_PROGRAM_ID,
//                 ASSOCIATED_TOKEN_PROGRAM_ID
//             )
//         );

//         const signature = await sendTransaction(transaction, connection);
//         console.log(`ATA created! Tx: ${signature}, ATA: ${ataAddress.toBase58()}`);
//         await connection.confirmTransaction(signature, 'confirmed');

//         return ataAddress;
//     } catch (error) {
//         console.error("Failed to create ATA:", error);
//         return null;
//     }
// }, [connection, publicKey, sendTransaction]);

// // 3. Mint Tokens
// const mintTokens = useCallback(async (
//     mint: PublicKey,
//     amount: number | BN,
//     destinationAta: PublicKey,
//     mintAuthority?: PublicKey
// ): Promise<string | null> => {
//     if (!publicKey) throw new Error("Wallet not connected");

//     try {
//         // Convert human readable amount (if number) to token units if necessary
//         // Note: If passing 'number', ensure it's already scaled (e.g. 100 * 10^6)
//         // Or handle scaling logic here.
//         const amountBigInt = typeof amount === 'number' ? BigInt(amount) : BigInt(amount.toString());

//         const transaction = new Transaction().add(
//             createMintToInstruction(
//                 mint,
//                 destinationAta,
//                 mintAuthority || publicKey,
//                 amountBigInt,
//                 [], // Multi-signers
//                 TOKEN_PROGRAM_ID
//             )
//         );

//         const signature = await sendTransaction(transaction, connection);
//         console.log(`Tokens minted! Tx: ${signature}`);
//         await connection.confirmTransaction(signature, 'confirmed');

//         return signature;
//     } catch (error) {
//         console.error("Failed to mint tokens:", error);
//         return null;
//     }
// }, [connection, publicKey, sendTransaction]);

// // 4. Revoke Mint Authority
// const revokeMintAuthority = useCallback(async (
//     mint: PublicKey,
//     currentAuthority?: PublicKey
// ): Promise<string | null> => {
//     if (!publicKey) throw new Error("Wallet not connected");

//     try {
//         const transaction = new Transaction().add(
//             createSetAuthorityInstruction(
//                 mint,
//                 currentAuthority || publicKey,
//                 AuthorityType.MintTokens,
//                 null, // Set authority to null
//                 [],
//                 TOKEN_PROGRAM_ID
//             )
//         );

//         const signature = await sendTransaction(transaction, connection);
//         console.log(`Mint authority revoked! Tx: ${signature}`);
//         await connection.confirmTransaction(signature, 'confirmed');

//         return signature;
//     } catch (error) {
//         console.error("Failed to revoke authority:", error);
//         return null;
//     }
// }, [connection, publicKey, sendTransaction]);

// const createAsset = async ({
//     name,
//     symbol,
//     image,
//     initialSupply,
//     decimals = 6
// }) => {

//     try {
//         const mintPubkey = await createTokenMint(decimals);

//         if (!mintPubkey) throw new Error("Failed to create mint");
//         console.log("Mint created:", mintPubkey.toBase58());

//         const ata = await createATA(mintPubkey);

//         if (!ata) throw new Error("Failed to create ATA");
//         console.log("ATA created:", ata.toBase58());

//         const rawAmount = BigInt(initialSupply) * BigInt(Math.pow(10, decimals));

//         const txSig = await mintTokens(mintPubkey, rawAmount.toString(), ata);

//         if (!txSig) throw new Error("Failed to mint tokens");

//         return {
//             success: true,
//             name,       // Pass back for convenience
//             symbol,     // Pass back for convenience
//             image,      // Pass back for convenience
//             mintAddress: mintPubkey.toBase58(),
//             tokenAccount: ata.toBase58(),
//             amount: rawAmount.toString()
//         };

//     } catch (error: any) {
//         console.error("Asset creation failed:", error);
//         return { success: false, error: error.message };
//     }
// };
// return {
//     createTokenMint,
//     createATA,
//     mintTokens,
//     revokeMintAuthority
// };
// };

export async function getTokenAccountBalance(
    connection: Connection,
    tokenAccountAddress: PublicKey | string
): Promise<{
    // uiAmount: number | null;
    amount: string;
    // decimals: number;
} | null> {
    try {
        // Convert string to PublicKey if needed
        const accountPubkey =
            typeof tokenAccountAddress === "string"
                ? new PublicKey(tokenAccountAddress)
                : tokenAccountAddress;

        // Fetch the token account info
        const accountInfo = await getAccount(connection, accountPubkey);

        return {
            // uiAmount: accountInfo.,         // Human-readable (with decimals applied)
            amount: accountInfo.amount.toString(),  // Raw u64 as string (big numbers safe)
            // decimals: accountInfo.mint,    // Mint decimals (e.g., 6)
        };
    } catch (error) {
        console.error("Failed to fetch token balance:", error);
        return null; // Return null on error (account doesn't exist, etc.)
    }
}
