import { PropertyData, PropertyFormData, PropertyItem, RawPropertyAccount } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { BN, utils, web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { getMintProgramId } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
import { Console } from "console";
import { publicKey } from "@metaplex-foundation/umi";

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

        const propertyKeys = shares.map((s: any) => s.account.property);
        // (Optional: use Set to ensure uniqueness if a user holds multiple types of shares)

        const propertyAccounts = await connection.getMultipleAccountsInfo(propertyKeys);

        // 4. Merge the data in your UI
        const portfolio = shares.map((shareholder: any, index: number) => {
            // Decode the property data (since getMultipleAccounts returns raw buffers)
            const propertyData = program!.coder.accounts.decode(
                "property",
                propertyAccounts[index]!.data
            );
            console.log("propertyData", propertyData)
            return {
                shares: shareholder,
                property: {
                    publicKey: propertyKeys[index],
                    account: propertyData
                }
            };
        });

        return portfolio
        // console.log("Found accounts:", shareholders);
    }

    async function depositRent(
        propertyOwner: PublicKey, // The wallet address that created the property
        amountSol: number         // Amount in SOL (e.g., 1.5)
    ): Promise<string> {
        if (!wallet.publicKey || !program) throw new Error("Wallet not connected");

        const connection = program.provider.connection;

        // 1. Convert SOL to Lamports
        const lamportsAmount = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

        // 2. Derive the Property PDA
        // Note: Seeds must match your Rust: [PROPERTY_SEED, owner.key()]
        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), propertyOwner.toBuffer()],
            program.programId
        );

        console.log("💰 Depositing Rent...", {
            property: propertyPda.toBase58(),
            amountLamports: lamportsAmount.toString(),
            amountSol: amountSol
        });

        try {
            // 3. Check if sender is the owner (Optional safety check)
            if (!propertyOwner.equals(wallet.publicKey)) {
                throw new Error("Only the property owner can deposit rent.");
            }

            // 4. Execute Transaction
            const tx = await program.methods
                .depositRent(lamportsAmount)
                .accounts({
                    owner: wallet.publicKey,
                    property: propertyPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✅ Rent deposited successfully! Tx:", tx);

            // 5. Update UI balance (Optional)
            const newBalance = await connection.getBalance(propertyPda);
            console.log(`🏦 New Property Vault Balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);

            return tx;
        } catch (error: any) {
            console.error("❌ Failed to deposit rent:", error.message);
            throw error;
        }
    }
    async function claimYield(
        propertyPubkey: PublicKey, // The PDA of the property
        mintPubkey: PublicKey      // The mint of the share tokens
    ): Promise<string> {
        if (!wallet.publicKey || !program) throw new Error("Wallet not connected");

        const connection = program.provider.connection;

        // 1. Get the Token Program ID for the mint
        const tokenProgramId = await getMintProgramId(mintPubkey);

        // 2. Derive the ShareHolder PDA


        // 3. Derive the User's Token Account (ATA)
        const userTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey,
            false,
            tokenProgramId
        );



        try {
            // 4. Optional: Check if the user has shares before sending the transaction
            const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
            if (parseInt(tokenBalance.value.amount) === 0) {
                throw new Error("You do not own any shares in this property.");
            }

            // 5. Execute the claim instruction
            const tx = await program.methods
                .claimYield()
                .accounts({
                    mint: mintPubkey,
                })
                .rpc();

            console.log("✅ Yield claimed successfully! Tx Signature:", tx);
            return tx;
        } catch (error: any) {
            console.error("❌ Claim failed:", error.message);
            throw error;
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
            .rpc(); // <--- MUST BE .transaction()

        // 2. Fetch fresh blockhash
        return transaction; // <--- Now this will definitely be a string
    }

    async function buyShares(
        propertyPubkey: PublicKey, // PDA of the property
        monthlyRent: number,       // The calculated rent for the user's portion
        shares: number,            // The WHOLE number percentage (e.g., 5)
        paidSol: number,           // SOL amount
        mintPubkey: PublicKey,
        owner: PublicKey           // Property creator's address
    ): Promise<string> {
        if (!wallet.publicKey || !program) throw new Error("Wallet not connected");

        const connection = program.provider.connection;

        // 1. Get Mint Info for the Vault Balance Check
        const tokenProgramId = await getMintProgramId(mintPubkey);
        const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);

        // 2. Derive PDAs (Ensure seeds match Rust)
        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), owner.toBuffer()],
            program.programId
        );

        const [shareHolderPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("holder_v2"),
                wallet.publicKey.toBuffer(),
                propertyPda.toBuffer()
            ],
            program.programId
        );

        const vaultTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            propertyPda,
            true,
            tokenProgramId
        );

        const buyerTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey,
            false,
            tokenProgramId
        );

        // 3. Vault Balance Check (Using raw decimals for comparison)
        try {
            const vaultBalanceResponse = await connection.getTokenAccountBalance(vaultTokenAccount);
            const requestedRaw = new BN(shares).mul(new BN(10).pow(new BN(mintInfo.decimals)));

            if (new BN(vaultBalanceResponse.value.amount).lt(requestedRaw)) {
                throw new Error(`Vault only has ${vaultBalanceResponse.value.uiAmount} shares left.`);
            }
        } catch (e: any) {
            throw new Error(e.message || "Vault account missing or empty.");
        }

        // 4. Convert SOL to Lamports
        const lamportsAmount = new BN(Math.floor(paidSol * LAMPORTS_PER_SOL));

        try {
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

            // 5. Execute Transaction
            // Argument 1: shares (whole number)
            // Argument 2: lamports (SOL)
            // Argument 3: monthlyRent (passed as BN)
            const tx = await program.methods
                .buyShares(
                    new BN(shares),
                    lamportsAmount,
                    new BN(monthlyRent)
                )
                .accounts({
                    buyer: wallet.publicKey,
                    property: propertyPda,
                    owner: owner,
                    mint: mintPubkey,
                    tokenProgram: tokenProgramId,
                })
                .preInstructions(preInstructions)
                .rpc();

            return tx;
        } catch (error: any) {
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

    return { createProperty, deleteProperty, getAllProperties, buyShares, getAllShares, forceCloseShareholder, depositRent, claimYield }
}
