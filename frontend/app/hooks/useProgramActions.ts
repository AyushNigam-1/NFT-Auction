import { PropertyData, PropertyFormData, PropertyItem, RawPropertyAccount } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BN, utils, web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { getMintProgramId } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";

export const useProgramActions = () => {
    const wallet = useWallet()
    const { program, PROGRAM_ID } = useProgram()

    // async function fetchNFTs() {
    //     try {
    //         const umi = createUmi("https://api.devnet.solana.com")
    //             .use(mplTokenMetadata());

    //         const assets = await fetchAllDigitalAssetByOwner(umi, publicKey(wallet.publicKey!.toString()));
    //         const nftDataPromises = assets.map(async (asset: DigitalAsset) => {
    //             try {
    //                 const nftItem: NftData = {
    //                     mint: asset.publicKey.toString(),
    //                     name: asset.metadata.name,
    //                     uri: asset.metadata.uri,
    //                     image: "/placeholder.png" // Fallback image
    //                 };
    //                 console.log("nftitem", asset)
    //                 // if (asset.metadata.uri) {
    //                 //     try {
    //                 //         const response = await axios.get(asset.metadata.uri);
    //                 //         if (response.data && response.data.image) {
    //                 //             nftItem.image = response.data.image;
    //                 //         }
    //                 //     } catch (jsonError) {
    //                 //         console.error(`Failed to fetch JSON for ${asset.metadata.name}`, jsonError);
    //                 //     }
    //                 // }
    //                 return nftItem;
    //             } catch (e) {
    //                 return null;
    //             }
    //         });

    //         const resolvedNfts = await Promise.all(nftDataPromises);

    //         const validNfts = resolvedNfts.filter((n): n is NftData => n !== null);

    //         return validNfts

    //     } catch (error) {
    //         console.error("Error fetching NFTs:", error);
    //         // setStatus("Error fetching NFTs");
    //     } finally {
    //         // setLoading(false);
    //     }
    // }


    async function getAllProperties(): Promise<PropertyItem[]> {
        try {
            console.log("Fetching properties from Solana...");
            const rawProperties = await program!.account.property.all()
            return rawProperties
        } catch (error) {
            console.error("❌ Error in getAllProperties:", error);
            return [];
        }
    }

    async function createProperty(
        totalShares: number,
        mintPubkey: PublicKey,
        name: string,
        thumbnailUri: string,
        address: string,
        price_per_share: number,
        yieldPercentage: number,
        metadata_uri: string
    ) {
        console.log("Creating property:", {
            mintPubkey,
            name,
            totalShares,
            thumbnailUri,

            // decimals,
            // rawAmount,
            address,
            price_per_share,
            yieldPercentage,
            metadata_uri

        });
        if (!wallet.connected || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const connection = program!.provider.connection;
        const tokenProgramId = await getMintProgramId(mintPubkey);

        // ✅ Get mint decimals
        const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);
        const decimals = mintInfo.decimals;

        // ✅ Convert to raw amount
        const rawAmount = totalShares * Math.pow(10, decimals);



        const tx = await program!.methods
            .createProperty(
                new BN(rawAmount), // ✅ Pass raw amount, not human-readable
                new BN(price_per_share),
                name,
                address,
                thumbnailUri,
                yieldPercentage,
                metadata_uri,
            )
            .accounts({
                owner: wallet.publicKey,
                mint: mintPubkey,
                tokenProgram: tokenProgramId,
            })
            .rpc();

        return tx;
    }

    async function deleteProperty(mintPubkey: PublicKey) {
        if (!wallet.connected || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        try {
            const tokenProgramId = await getMintProgramId(mintPubkey);

            // 1. Derive the Property PDA
            // We need this address to calculate the vault's address
            const [propertyPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("property"), wallet.publicKey.toBuffer()],
                program!.programId
            );

            // 2. Derive the Vault Token Account Address
            // This is the ATA owned by the Property PDA
            const vaultTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                propertyPda,
                true, // allowOwnerOffCurve = true (because owner is a PDA)
                tokenProgramId,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            // 3. Derive the Owner's Token Account Address
            // This is where the remaining tokens will be refunded to
            const ownerTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                wallet.publicKey,
                false,
                tokenProgramId,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            console.log("Deleting property...", {
                property: propertyPda.toString(),
                vault: vaultTokenAccount.toString(),
                receiver: ownerTokenAccount.toString()
            });

            const tx = await program!.methods
                .deleteProperty()
                .accounts({
                    owner: wallet.publicKey,
                    mint: mintPubkey,
                    tokenProgram: tokenProgramId,
                })
                .rpc();

            console.log("✅ Property deleted successfully. Signature:", tx);
            return tx;

        } catch (error) {
            console.error("❌ Error deleting property:", error);
            throw error;
        }
    }


    async function buyShares(
        propertyPubkey: PublicKey,
        shares: number | BN,
        paidSol: number | BN,
        mintPubkey: PublicKey,
        owner: PublicKey
    ): Promise<string> {
        if (!wallet.publicKey) throw new Error("Wallet not connected");

        // LOG RAW INPUTS FIRST
        console.log("🔍 RAW INPUTS:", {
            shares,
            paidSol,
            sharesType: typeof shares,
            paidSolType: typeof paidSol,
            propertyPubkey: propertyPubkey.toBase58(),
            owner: owner.toBase58(),
            mint: mintPubkey.toBase58()
        });

        // 1. Convert to proper types
        const sharesAmount = typeof shares === 'number' ? new BN(shares) : shares;
        const solAmount = typeof paidSol === 'number' ? paidSol : paidSol.toNumber();
        const lamportsAmount = new BN(Math.floor(solAmount * LAMPORTS_PER_SOL));

        console.log("💰 CONVERTED VALUES:", {
            sharesAmount: sharesAmount.toString(),
            solAmount: solAmount,
            lamportsAmount: lamportsAmount.toString(),
            expectedDeduction: `${solAmount} SOL (${lamportsAmount.toString()} lamports)`
        });

        // CRITICAL: Verify lamports is reasonable
        if (lamportsAmount.toNumber() < 1000) {
            console.warn("⚠️ WARNING: Lamports amount is very small:", lamportsAmount.toString());
        }

        // 2. Get Token Program
        const tokenProgramId = await getMintProgramId(mintPubkey);

        // 3. Derive ShareHolder PDA
        const [shareHolderPda, shareHolderBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("holder_v2"),
                wallet.publicKey.toBuffer(),
                propertyPubkey.toBuffer()
            ],
            PROGRAM_ID
        );

        console.log("📝 ShareHolder PDA:", shareHolderPda.toBase58(), "bump:", shareHolderBump);

        // 4. Derive Vault ATA
        const vaultTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            propertyPubkey,
            true,
            tokenProgramId
        );

        // 5. Derive Buyer ATA
        const buyerTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey,
            false,
            tokenProgramId
        );

        console.log("🏦 ACCOUNTS:", {
            buyer: wallet.publicKey.toBase58(),
            property: propertyPubkey.toBase58(),
            shareHolder: shareHolderPda.toBase58(),
            vaultTokenAccount: vaultTokenAccount.toBase58(),
            buyerTokenAccount: buyerTokenAccount.toBase58(),
            mint: mintPubkey.toBase58(),
            owner: owner.toBase58(),
            tokenProgram: tokenProgramId.toBase58()
        });

        try {
            const connection = program!.provider.connection;

            // Check balances BEFORE
            const buyerSolBefore = await connection.getBalance(wallet.publicKey);
            const ownerSolBefore = await connection.getBalance(owner);

            console.log("💵 BALANCES BEFORE:", {
                buyer: `${buyerSolBefore / LAMPORTS_PER_SOL} SOL`,
                owner: `${ownerSolBefore / LAMPORTS_PER_SOL} SOL`
            });

            // Check vault token balance
            try {
                const vaultBalance = await connection.getTokenAccountBalance(vaultTokenAccount);
                console.log("🏦 Vault token balance:", vaultBalance.value.uiAmount, "shares");

                if (vaultBalance.value.uiAmount === null || vaultBalance.value.uiAmount < sharesAmount.toNumber()) {
                    throw new Error(`Insufficient shares in vault. Available: ${vaultBalance.value.uiAmount}, Requested: ${sharesAmount.toString()}`);
                }
            } catch (e) {
                console.error("❌ Could not fetch vault balance:", e);
                throw new Error("Vault token account may not exist or is invalid");
            }

            // Check if buyer token account exists
            const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount);

            const preInstructions = [];
            if (!buyerTokenAccountInfo) {
                console.log("📦 Creating buyer token account...");
                preInstructions.push(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,
                        buyerTokenAccount,
                        wallet.publicKey,
                        mintPubkey,
                        tokenProgramId
                    )
                );
            }

            // Build transaction
            console.log("🔨 Building transaction...");
            const tx = await program!.methods
                .buyShares(sharesAmount, lamportsAmount)
                .accounts({
                    buyer: wallet.publicKey,
                    property: propertyPubkey,
                    shareHolder: shareHolderPda,
                    vaultTokenAccount: vaultTokenAccount,
                    buyerTokenAccount: buyerTokenAccount,
                    mint: mintPubkey,
                    owner: owner,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: tokenProgramId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .preInstructions(preInstructions)
                .transaction();

            console.log("📤 Sending transaction...");
            const txSig = await program!.provider.sendAndConfirm(tx);

            console.log("✅ Transaction sent:", txSig);
            console.log(`🔗 View on explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

            // Check balances AFTER
            const buyerSolAfter = await connection.getBalance(wallet.publicKey);
            const ownerSolAfter = await connection.getBalance(owner);

            console.log("💵 BALANCES AFTER:", {
                buyer: `${buyerSolAfter / LAMPORTS_PER_SOL} SOL`,
                owner: `${ownerSolAfter / LAMPORTS_PER_SOL} SOL`,
                buyerChange: `${(buyerSolBefore - buyerSolAfter) / LAMPORTS_PER_SOL} SOL`,
                ownerChange: `${(ownerSolAfter - ownerSolBefore) / LAMPORTS_PER_SOL} SOL`
            });

            // Verify token transfer
            const buyerTokenBalance = await connection.getTokenAccountBalance(buyerTokenAccount);
            console.log("🎫 Buyer now has:", buyerTokenBalance.value.uiAmount, "shares");

            return txSig;
        } catch (error: any) {
            console.error("❌ TRANSACTION FAILED");
            console.error("Error:", error.message);

            if (error.logs) {
                console.error("📋 Program logs:");
                error.logs.forEach((log: string) => console.error(log));
            }

            throw error;
        }
    }
    return { createProperty, deleteProperty, getAllProperties, buyShares }
}
