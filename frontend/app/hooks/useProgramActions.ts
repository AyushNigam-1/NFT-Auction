import { PropertyData, PropertyFormData, PropertyItem, RawPropertyAccount } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { BN, utils, web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { getMintProgramId } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
import { Console } from "console";

export const useProgramActions = () => {
    const wallet = useWallet()
    const { program, PROGRAM_ID, connection } = useProgram()

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
            const rawProperties = await (program!.account as any).property.all()
            console.log("rawProperties", rawProperties)
            return rawProperties

        } catch (error) {
            console.error("❌ Error in getAllProperties:", error);
            return [];
        }
    }
    async function getAllShares() {
        const shares = await (program!.account as any).shareHolder.all([
            {
                memcmp: {
                    offset: 8, // Skip the 8-byte Anchor discriminator
                    bytes: wallet.publicKey!.toBase58(),
                },
            },
        ]);

        const propertyKeys = shares.map(s => s.account.property);
        // (Optional: use Set to ensure uniqueness if a user holds multiple types of shares)

        const propertyAccounts = await connection.getMultipleAccountsInfo(propertyKeys);

        // 4. Merge the data in your UI
        const portfolio = shares.map((shareholder, index) => {
            // Decode the property data (since getMultipleAccounts returns raw buffers)
            const propertyData = program!.coder.accounts.decode(
                "property",
                propertyAccounts[index]!.data
            );

            return {
                ...shareholder.account,
                property: {
                    name: propertyData.name, // <--- Got it without storing it!
                    image: propertyData.thumbnailUri,
                    address: propertyData.address
                }
            };
        });

        return portfolio
        // console.log("Found accounts:", shareholders);
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

        // ❌ REMOVE THE TRY/CATCH BLOCK here. 
        // Let errors bubble up so useMutation can handle them.

        const tokenProgramId = await getMintProgramId(mintPubkey);

        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), wallet.publicKey.toBuffer()],
            program!.programId
        );
        // ... (Keep your existing vault/owner derivation logic) ...
        const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, propertyPda, true, tokenProgramId);
        const ownerTokenAccount = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey, false, tokenProgramId);

        // -------------------------------------------------------
        // 👇 CRITICAL FIX: Use .transaction() (Builder), NOT .rpc() (Sender)
        // -------------------------------------------------------
        const transaction = await program!.methods
            .deleteProperty()
            .accounts({
                owner: wallet.publicKey,
                mint: mintPubkey,
                tokenProgram: tokenProgramId,
            })
            .transaction(); // <--- MUST BE .transaction()

        // 2. Fetch fresh blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // 3. Send ONCE via Wallet Adapter
        // Note: 'maxRetries: 0' prevents the library from spamming the network
        const signature = await wallet.sendTransaction(transaction, connection, {
            maxRetries: 0 // <--- IMPORTANT: Stop internal retries
        });

        // 4. Wait for confirmation
        console.log("⏳ Confirming transaction...");
        const confirmation = await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature
        }, "confirmed");

        if (confirmation.value.err) {
            throw new Error("Transaction failed on-chain");
        }

        console.log("✅ Property deleted. Sig:", signature);
        return signature; // <--- Now this will definitely be a string
    }

    async function buyShares(
        propertyPubkey: PublicKey,
        shares: number,
        paidSol: number,
        mintPubkey: PublicKey,
        owner: PublicKey
    ): Promise<string> {
        if (!wallet.publicKey || !program) throw new Error("Wallet not connected");

        const connection = program.provider.connection;

        // 1. Get Mint Info & Decimals
        const tokenProgramId = await getMintProgramId(mintPubkey);
        const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);

        // 2. Derive Property PDA (Ensure seeds match your Rust code)
        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), owner.toBuffer()],
            program.programId
        );

        // 3. Derive Vault ATA
        const vaultTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            propertyPda,
            true, // Allow owner off-curve (it's a PDA)
            tokenProgramId
        );

        // --- NEW: FETCH CURRENT VAULT BALANCE ---
        try {
            const vaultBalanceResponse = await connection.getTokenAccountBalance(vaultTokenAccount);
            console.log("📊 CURRENT VAULT STATE:");
            console.log(`   - Raw Amount: ${vaultBalanceResponse.value.amount}`);
            console.log(`   - UI Amount: ${vaultBalanceResponse.value.uiAmount} shares`);
            console.log(`   - Decimals: ${vaultBalanceResponse.value.decimals}`);

            // Safety check: Don't proceed if vault is empty
            if (Number(vaultBalanceResponse.value.uiAmount) < shares) {
                throw new Error(`Insufficient shares in vault. Available: ${vaultBalanceResponse.value.uiAmount}, Requested: ${shares}`);
            }
        } catch (e) {
            console.error("❌ Failed to fetch vault balance. Does the vault exist?", e);
            throw new Error("Vault account not found or uninitialized.");
        }
        // ----------------------------------------

        // 4. Convert Input to Raw Amount (BN)
        const rawShares = new BN(shares).mul(new BN(10).pow(new BN(mintInfo.decimals)));
        const lamportsAmount = new BN(Math.floor(paidSol * LAMPORTS_PER_SOL));

        // 5. Derive Other Accounts
        const [shareHolderPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("holder_v2"), wallet.publicKey.toBuffer(), propertyPda.toBuffer()],
            program.programId
        );

        const buyerTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey,
            false,
            tokenProgramId
        );

        try {
            // 6. Check if Buyer ATA exists, if not add to pre-instructions
            const buyerAtaInfo = await connection.getAccountInfo(buyerTokenAccount);
            const preInstructions = [];
            if (!buyerAtaInfo) {
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

            // 7. Execute Transaction
            const tx = await program.methods
                .buyShares(rawShares, lamportsAmount)
                .accounts({
                    buyer: wallet.publicKey,
                    property: propertyPda,
                    owner: owner,
                    mint: mintPubkey,
                    tokenProgram: tokenProgramId,
                })
                .preInstructions(preInstructions)
                .rpc();

            // 8. Log Final Balance after short delay (for chain propagation)
            setTimeout(async () => {
                const finalBal = await connection.getTokenAccountBalance(vaultTokenAccount);
                console.log(`✅ New Vault Balance: ${finalBal.value.uiAmount} shares`);
            }, 2000);

            return tx;
        } catch (error) {
            console.error("❌ Transaction failed:", error);
            throw error;
        }
    }

    async function forceCloseShareholder(shareHolderAddress: PublicKey) {
        // const shareHolderPubkey = new PublicKey(shareHolderAddress);

        console.log("🔥 Force Closing:", shareHolderAddress.toString());

        const tx = await program!.methods
            .closeShareholderAccount()
            .accounts({
                buyer: wallet.publicKey!,
                shareHolder: shareHolderAddress, // <--- Just pass the key directly
            })
            .rpc();

        console.log("✅ Closed!", tx);
    }

    return { createProperty, deleteProperty, getAllProperties, buyShares, getAllShares, forceCloseShareholder }
}
