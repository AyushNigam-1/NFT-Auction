import { PropertyData, PropertyFormData, PropertyItem, RawPropertyAccount } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { BN, utils, web3 } from "@coral-xyz/anchor";
import { usePrograms } from "./useProgram";
import { getMintProgramId } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Console } from "console";
import { publicKey } from "@metaplex-foundation/umi";

export const useProgramActions = () => {
    const wallet = useWallet()
    const { yieldProgram, identityProgram, connection } = usePrograms()

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
            const rawProperties = await (yieldProgram!.account as any).property.all()
            console.log("rawProperties", rawProperties)
            return rawProperties

        } catch (error) {
            console.error("❌ Error in getAllProperties:", error);
            return [];
        }
    }

    // Define the shape of your returned item
    interface PropertyItem {
        publicKey: PublicKey;
        account: any;
        stats: {
            totalShares: number;
            sharesSold: number;
            sharesUnsold: number;
            percentSold: number;
        }
    }

    async function getMyListings(): Promise<PropertyItem[]> {
        try {
            console.log("Fetching properties from Solana...");

            // 1. Fetch all property accounts for this creator
            const rawProperties = await (yieldProgram!.account as any).property.all([
                {
                    memcmp: {
                        offset: 8, // Skip discriminator
                        bytes: wallet.publicKey!.toBase58(), // Filter by Creator
                    },
                },
            ]);
            console.log("raw", rawProperties)
            // 2. Process all properties in parallel to fetch Vault Balances
            const propertiesWithStats = await Promise.all(
                rawProperties.map(async (item: any) => {
                    const propertyData = item.account;
                    const propertyPda = item.publicKey;
                    const mintPubkey = propertyData.mint; // Assuming 'mint' is in your struct
                    const totalShares = propertyData.totalShares.toNumber(); // Assuming it's a BN

                    // A. Derive the Vault Token Account (ATA)
                    // Note: Ensure you use the correct Program ID (TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID)
                    // matching what you used to create the mint.
                    const vaultTokenAccount = getAssociatedTokenAddressSync(
                        mintPubkey,
                        propertyPda,
                        true, // allowOwnerOffCurve = true (Because owner is a PDA)
                        TOKEN_2022_PROGRAM_ID // or TOKEN_PROGRAM_ID depending on your setup
                    );

                    let unsoldShares = 0;

                    try {
                        // B. Fetch the balance of the Vault (Unsold tokens)
                        const balanceResponse = await connection.getTokenAccountBalance(vaultTokenAccount);

                        // connection returns value as string, parse it
                        // 'uiAmount' is user-friendly, 'amount' is raw integer string
                        if (balanceResponse.value.amount) {
                            unsoldShares = Number(balanceResponse.value.amount);
                        }
                    } catch (e) {
                        // If account doesn't exist yet, it usually means 0 tokens or not initialized
                        console.log(`Could not fetch balance for ${vaultTokenAccount.toBase58()}`, e);
                        unsoldShares = 0;
                        // OR: if the vault isn't created, maybe ALL shares are unsold? 
                        // Adjust this logic based on your initialization flow.
                    }

                    // C. Calculate Metrics
                    // If Vault holds unsold tokens: Sold = Total - Unsold
                    const sharesSold = totalShares - unsoldShares;
                    const percentSold = totalShares > 0
                        ? ((sharesSold / totalShares) * 100).toFixed(1)
                        : 0;

                    return {
                        publicKey: propertyPda,
                        account: propertyData,
                        stats: {
                            totalShares,
                            sharesSold,
                            sharesUnsold: unsoldShares,
                            percentSold: Number(percentSold)
                        }
                    };
                })
            );

            console.log("Processed Properties:", propertiesWithStats);
            return propertiesWithStats;

        } catch (error) {
            console.error("❌ Error in getMyListings:", error);
            return [];
        }
    }

    async function getAllShares() {
        const shares = await (yieldProgram!.account as any).shareHolder.all([
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
            const propertyData = yieldProgram!.coder.accounts.decode(
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
        amountSol: number         // Amount in SOL (e.g., 1.5)
    ): Promise<string> {
        if (!wallet.publicKey || !yieldProgram) throw new Error("Wallet not connected");

        const connection = yieldProgram.provider.connection;

        // 1. Convert SOL to Lamports
        const lamportsAmount = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

        // 2. Derive the Property PDA
        // Note: Seeds must match your Rust: [PROPERTY_SEED, owner.key()]
        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), wallet.publicKey.toBuffer()],
            yieldProgram.programId
        );

        console.log("💰 Depositing Rent...", {
            property: propertyPda.toBase58(),
            amountLamports: lamportsAmount.toString(),
            amountSol: amountSol
        });

        try {
            // 3. Check if sender is the owner (Optional safety check)
            if (!wallet.publicKey.equals(wallet.publicKey)) {
                throw new Error("Only the property owner can deposit rent.");
            }

            // 4. Execute Transaction
            const tx = await yieldProgram.methods
                .depositRent(lamportsAmount)
                .accounts({
                    owner: wallet.publicKey,
                    property: propertyPda,
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
        mintPubkey: PublicKey,       // The mint of the share tokens
        propertyPda: PublicKey,      // <--- ADDED: The specific property we are claiming from
    ): Promise<string> {

        if (!wallet.publicKey || !yieldProgram) throw new Error("Wallet not connected");
        // 1. Get Token Program ID (usually standard, but good to check)
        // const tokenProgramId = await getMintProgramId(mintPubkey); // Assuming you have this helper
        const tokenProgramId = await getMintProgramId(mintPubkey); // Or TOKEN_2022... depending on your setup

        // 2. Derive the ShareHolder PDA
        // seeds = [SHAREHOLDER_SEED, owner.key(), property.key()]
        const [shareHolderPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("holder_v2"), // Ensure this matches your Rust "SHAREHOLDER_SEED"
                wallet.publicKey.toBuffer(),
                propertyPda.toBuffer()
            ],
            yieldProgram.programId
        );

        // 3. Derive User ATA
        const userTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey,
            false,
            tokenProgramId
        );
        console.log(propertyPda.toBase58())
        try {
            // 4. Execute Instruction with EXPLICIT Accounts
            const tx = await yieldProgram.methods
                .claimYield()
                .accounts({
                    property: propertyPda,        // <--- EXPLICITLY PASSED
                    userTokenAccount: userTokenAccount,
                    mint: mintPubkey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: tokenProgramId
                })
                .rpc();

            console.log("✅ Yield claimed successfully! Tx:", tx);
            return tx;

        } catch (error: any) {
            console.error("❌ Claim failed:", error);
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
            address,
            price_per_share,
            yieldPercentage,
            metadata_uri

        });
        if (!wallet.connected || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const connection = yieldProgram!.provider.connection;
        const tokenProgramId = await getMintProgramId(mintPubkey);

        // ✅ Get mint decimals
        const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);
        const decimals = mintInfo.decimals;

        // ✅ Convert to raw amount
        const rawAmount = totalShares * Math.pow(10, decimals);
        const [identityPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("identity"),
                wallet.publicKey.toBuffer(),
            ],
            identityProgram!.programId
        );
        let identityAccount;

        try {
            identityAccount = await identityProgram!.account.identity.fetch(identityPda);
        } catch {
            throw new Error("Identity not found. Please verify your identity first.");
        }

        if (!identityAccount.verified || identityAccount.revoked) {
            throw new Error("Identity is not verified or has been revoked.");
        }

        const tx = await yieldProgram!.methods
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
            yieldProgram!.programId
        );
        // ... (Keep your existing vault/owner derivation logic) ...
        const vaultTokenAccount = await getAssociatedTokenAddress(mintPubkey, propertyPda, true, tokenProgramId);
        const ownerTokenAccount = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey, false, tokenProgramId);

        // -------------------------------------------------------
        // 👇 CRITICAL FIX: Use .transaction() (Builder), NOT .rpc() (Sender)
        // -------------------------------------------------------
        const transaction = await yieldProgram!.methods
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
        if (!wallet.publicKey || !yieldProgram) throw new Error("Wallet not connected");

        const connection = yieldProgram.provider.connection;

        // 1. Get Mint Info for the Vault Balance Check
        const tokenProgramId = await getMintProgramId(mintPubkey);
        const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);

        // 2. Derive PDAs (Ensure seeds match Rust)
        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), owner.toBuffer()],
            yieldProgram.programId
        );

        const [shareHolderPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("holder_v2"),
                wallet.publicKey.toBuffer(),
                propertyPda.toBuffer()
            ],
            yieldProgram.programId
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

            const tx = await yieldProgram.methods
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
        console.log("🔥 Force Closing:", shareHolderAddress);

        const tx = await yieldProgram!.methods
            .closeShareholderAccount()
            .accounts({
                buyer: wallet.publicKey!,
                shareHolder: shareHolderAddress, // <--- Just pass the key directly
            })
            .rpc();

        console.log("✅ Closed!", tx);
    }

    const KYC_MINT_SEED = "kyc_mint";

    // -------------------------------------------------------------------------
    // Function 1: Initialize the Soulbound Mint (Admin Only)
    // -------------------------------------------------------------------------
    const createKycMint = async (
        name: string,
        symbol: string,
        uri: string
    ) => {
        try {
            // 1. Derive the Mint PDA
            // seeds = [b"kyc_mint"]
            const [mintPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(KYC_MINT_SEED)],
                identityProgram!.programId
            );

            console.log("Derived Mint PDA:", mintPda.toBase58());

            // 2. Execute Transaction
            const tx = await identityProgram!.methods
                .createKycMint(uri, name, symbol)
                .accounts({
                    payer: wallet.publicKey!,
                    // mint: mintPda,
                    // systemProgram: SystemProgram.programId,
                    // tokenProgram: TOKEN_2022_PROGRAM_ID, // <--- CRITICAL: Must be Token-2022
                })
                .rpc();

            console.log("✅ Mint Initialized! Tx:", tx);
            return mintPda; // Return the PDA so you can save it to your database/constants

        } catch (error) {
            console.error("❌ Failed to create mint:", error);
            throw error;
        }
    };

    // -------------------------------------------------------------------------
    // Function 2: Issue Badge to a User (Server-Side or Admin Wallet)
    // -------------------------------------------------------------------------
    const issueBadge = async (
        adminPublicKey: PublicKey, // The wallet paying for the mint (Admin)
        recipientPublicKey: PublicKey // The user receiving the badge
    ) => {
        try {
            // 1. Derive the Mint PDA again
            const [mintPda] = PublicKey.findProgramAddressSync(
                [Buffer.from(KYC_MINT_SEED)],
                identityProgram!.programId
            );

            // 2. Derive the Recipient's ATA (Associated Token Account)
            // MUST use Token-2022 Program ID for derivation
            const recipientTokenAccount = getAssociatedTokenAddressSync(
                mintPda,
                recipientPublicKey,
                false, // allowOwnerOffCurve (usually false)
                TOKEN_2022_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            console.log(" issuing badge to ATA:", recipientTokenAccount.toBase58());

            // 3. Execute Transaction
            const tx = await identityProgram!.methods
                .issueBadge()
                .accounts({
                    authority: adminPublicKey, // Admin signs
                    mint: mintPda,
                    recipient: recipientPublicKey,
                    recipientTokenAccount: recipientTokenAccount, // The ATA we derived
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("✅ Badge Issued! Tx:", tx);
            return tx;

        } catch (error) {
            console.error("❌ Failed to issue badge:", error);
            throw error;
        }
    };

    return { createProperty, deleteProperty, getAllProperties, buyShares, getAllShares, getMyListings, forceCloseShareholder, depositRent, claimYield, createKycMint, issueBadge }
}



// {
//     "name": "Verified User",
//         "symbol": "VERIFIED",
//             "description": "Identity verification for Premium Real Estate Platform. Non-transferable.",
//                 "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNGQzOTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8cGF0aCBkPSJNMy44NSA4LjYyYTQgNCAwIDAgMSA0Ljc4LTQuNzcgNCA0IDAgMCAxIDYuNzQgMCA0IDQgMCAwIDEgNC43OCA0Ljc4IDQgNCAwIDAgMSAwIDYuNzQgNCA0IDAgMCAxLTQuNzcgNC43OCA0IDQgMCAwIDEtNi43NSAwIDQgNCAwIDAgMS00Ljc4LTQuNzcgNCA0IDAgMCAxIDAtNi43NloiLz4KICA8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+Cjwvc3ZnPg==",
// }