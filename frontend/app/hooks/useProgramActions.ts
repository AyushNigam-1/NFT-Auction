import { PropertyData, PropertyFormData, PropertyItem, RawPropertyAccount } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { BN, utils, web3 } from "@coral-xyz/anchor";
import { usePrograms } from "./useProgram";
import { getMintProgramId } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, TokenAccountNotFoundError } from "@solana/spl-token";
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

    // Helper constant for SOL decimals
    const LAMPOSTS_PER_SOL = 1_000_000_000;

    const createProperty = async (
        // 1. Property Args
        totalShares: number,
        mintPubkey: PublicKey,
        name: string,
        thumbnailUri: string,
        address: string,
        price_per_share: number, // In SOL (e.g., 0.1)
        yieldPercentage: number,
        metadata_uri: string,

        // 2. Dealer Args (Simplified for SOL)
        basePrice: number,       // Base Price in SOL
        maxShares: number        // Max shares per tx
    ) => {
        console.log("Creating Property + Dealer (Direct SOL)...");

        if (!wallet.connected || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const connection = yieldProgram!.provider.connection;

        // --- STEP A: PREPARE DATA ---

        // 1. Get Property Mint Info & Decimals
        const propertyTokenProgramId = await getMintProgramId(mintPubkey);
        const propertyMintInfo = await getMint(connection, mintPubkey, undefined, propertyTokenProgramId);
        const propDecimals = propertyMintInfo.decimals;

        // 2. Convert to Raw BN
        // Shares: Amount * 10^decimals
        const rawTotalShares = new BN(totalShares * Math.pow(10, propDecimals));
        const rawMaxShares = new BN(maxShares * Math.pow(10, propDecimals));

        // Price (SOL): Amount * 10^9 (Lamports)
        // We use Math.floor/round or a library to avoid floating point errors in JS
        const rawPricePerShare = new BN(Math.round(price_per_share * LAMPOSTS_PER_SOL));
        const rawBasePrice = new BN(Math.round(basePrice * LAMPOSTS_PER_SOL));

        // --- STEP B: PREPARE IDENTITY ---
        const [identityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("identity"), wallet.publicKey.toBuffer()],
            identityProgram!.programId
        );

        // Verify identity locally (optional check)
        try {
            const idAccount = await identityProgram!.account.identity.fetch(identityPda);
            if (!idAccount.verified || idAccount.revoked) throw new Error("Identity issue");
        } catch {
            throw new Error("Identity not verified.");
        }

        // --- STEP C: PREPARE DEALER INSTRUCTION ---

        // 1. Derive Dealer PDAs
        const [dealerStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("dealer"), mintPubkey.toBuffer()],
            yieldProgram!.programId
        );
        const [dealerShareVaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("dealer_share_vault"), mintPubkey.toBuffer()],
            yieldProgram!.programId
        );

        // NOTE: Removed dealerPaymentVaultPda (Not needed for SOL)

        // 2. Build the Instruction Object
        const initDealerIx = await yieldProgram!.methods
            .initializeDealer(
                rawBasePrice, // One base price
                rawMaxShares
            )
            .accounts({
                admin: wallet.publicKey,
                propertyMint: mintPubkey,
                dealerState: dealerStatePda,
                dealerShareVault: dealerShareVaultPda,
                // dealerPaymentVault: REMOVED
                // paymentMint: REMOVED
                systemProgram: SystemProgram.programId,
                tokenProgram: propertyTokenProgramId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();

        // --- STEP D: CHAIN & EXECUTE ---

        const tx = await yieldProgram!.methods
            .createProperty(
                rawTotalShares,
                rawPricePerShare,
                name,
                address,
                thumbnailUri,
                yieldPercentage,
                metadata_uri,
            )
            .accounts({
                owner: wallet.publicKey,
                mint: mintPubkey,
                tokenProgram: propertyTokenProgramId,
                identity: identityPda,
                identityRegistry: identityProgram!.programId
            })
            .postInstructions([initDealerIx]) // Chain it!
            .rpc();

        console.log("Success! Tx Signature:", tx);
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
    // Function 2: Issue Badge to a User (Server-Side or Admin Wallet)
    // -------------------------------------------------------------------------

    async function issueIdentity(
        identityProgram: any,
        registryPda: PublicKey,
        issuerPda: PublicKey,
        userPubkey: PublicKey,
        issuerPubkey: PublicKey
    ) {
        // -----------------------------
        // 1. Derive Identity PDA
        // PDA("identity", user)
        // -----------------------------
        const [identityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("identity"), userPubkey.toBuffer()],
            identityProgram.programId
        );

        // -----------------------------
        // 2. Call issue_identity
        // -----------------------------
        const tx = await identityProgram.methods
            .issueIdentity()
            .accounts({
                registry: registryPda,
                issuerAccount: issuerPda,
                identity: identityPda,
                user: userPubkey,
                issuer: issuerPubkey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return {
            tx,
            identityPda,
        };
    }
    interface TradeParams {
        program: any;            // Anchor Program
        wallet: any;             // Connected Wallet
        propertyMint: PublicKey; // The House Token Mint
        quantity: number;        // Number of shares
    }

    const handleBuy = async ({ propertyMint, quantity }: TradeParams) => {
        if (!wallet.publicKey) throw new Error("Wallet not connected");

        const connection = yieldProgram!.provider.connection;

        try {
            console.log(`Processing Buy for ${quantity} shares...`);

            // 1. Fetch Mint Info (Decimals & Program ID)
            // We check the mint owner to support both Token and Token-2022
            const mintAccountInfo = await connection.getAccountInfo(propertyMint);
            if (!mintAccountInfo) throw new Error("Mint not found");
            const tokenProgramId = mintAccountInfo.owner; // The correct Token Program ID

            const mintInfo = await getMint(connection, propertyMint, undefined, tokenProgramId);
            const decimals = mintInfo.decimals;

            // 2. Convert Human Quantity to Raw BN
            const rawQuantity = new BN(quantity * Math.pow(10, decimals));

            // 3. Derive PDAs
            const [dealerStatePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("dealer"), propertyMint.toBuffer()],
                yieldProgram!.programId
            );

            const [dealerShareVault] = PublicKey.findProgramAddressSync(
                [Buffer.from("dealer_share_vault"), propertyMint.toBuffer()],
                yieldProgram!.programId
            );

            // 4. Derive User's ATA & Check if it exists
            const userShareAta = getAssociatedTokenAddressSync(
                propertyMint,
                wallet.publicKey,
                false,
                tokenProgramId
            );

            // Check if account needs creation
            const preInstructions: TransactionInstruction[] = [];
            try {
                await getAccount(connection, userShareAta, undefined, tokenProgramId);
            } catch (error: any) {
                // If account not found, add creation instruction
                if (error instanceof TokenAccountNotFoundError || error.name === "TokenAccountNotFoundError") {
                    console.log("Creating new Token Account for user...");
                    preInstructions.push(
                        createAssociatedTokenAccountInstruction(
                            wallet.publicKey, // Payer
                            userShareAta,     // Ata to create
                            wallet.publicKey, // Owner
                            propertyMint,     // Mint
                            tokenProgramId    // Program ID
                        )
                    );
                }
            }

            // 5. Send Transaction (with Pre-Instruction if needed)
            const tx = await yieldProgram!.methods
                .buyFromDealer(rawQuantity)
                .accounts({
                    user: wallet.publicKey,
                    dealerState: dealerStatePda,
                    propertyMint: propertyMint,
                    dealerShareVault: dealerShareVault,
                    userShareAccount: userShareAta,
                    tokenProgram: tokenProgramId, // Dynamic
                    systemProgram: SystemProgram.programId,
                })
                .preInstructions(preInstructions) // <--- Auto-creates ATA
                .rpc();

            console.log("✅ Buy Successful! TX:", tx);
            return tx;

        } catch (error) {
            console.error("❌ Buy Failed:", error);
            throw error;
        }
    };

    const handleSell = async ({ propertyMint, quantity }: TradeParams) => {
        if (!wallet.publicKey) throw new Error("Wallet not connected");

        const connection = yieldProgram!.provider.connection;

        try {
            console.log(`Processing Sell for ${quantity} shares...`);

            // 1. Fetch Mint Info for Decimals
            const mintAccountInfo = await connection.getAccountInfo(propertyMint);
            if (!mintAccountInfo) throw new Error("Mint not found");
            const tokenProgramId = mintAccountInfo.owner;

            const mintInfo = await getMint(connection, propertyMint, undefined, tokenProgramId);

            // 2. Convert Human Quantity to Raw BN
            const rawQuantity = new BN(quantity * Math.pow(10, mintInfo.decimals));

            // 3. Derive PDAs
            const [dealerStatePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("dealer"), propertyMint.toBuffer()],
                yieldProgram!.programId
            );

            const [dealerShareVault] = PublicKey.findProgramAddressSync(
                [Buffer.from("dealer_share_vault"), propertyMint.toBuffer()],
                yieldProgram!.programId
            );

            // 4. Get User's ATA
            const userShareAta = getAssociatedTokenAddressSync(
                propertyMint,
                wallet.publicKey,
                false,
                tokenProgramId
            );

            // 5. Send Transaction
            const tx = await yieldProgram!.methods
                .sellToDealer(rawQuantity)
                .accounts({
                    user: wallet.publicKey,
                    dealerState: dealerStatePda,
                    propertyMint: propertyMint,
                    dealerShareVault: dealerShareVault,
                    userShareAccount: userShareAta,
                    tokenProgram: tokenProgramId,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✅ Sell Successful! TX:", tx);
            return tx;

        } catch (error) {
            console.error("❌ Sell Failed:", error);
            throw error;
        }
    };

    return { createProperty, deleteProperty, getAllProperties, buyShares, getAllShares, getMyListings, forceCloseShareholder, depositRent, claimYield, issueIdentity, handleBuy, handleSell, buyFromDealer }
}
