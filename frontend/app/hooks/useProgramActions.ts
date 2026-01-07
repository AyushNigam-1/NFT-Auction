import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { DigitalAsset, fetchAllDigitalAssetByOwner, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata"
import { NftData } from "../types";
import axios from "axios";
import { publicKey } from "@metaplex-foundation/umi";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BN, web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getMintProgramId } from "../utils";

export const useProgramActions = () => {
    const wallet = useWallet()
    const { program } = useProgram()

    async function fetchNFTs() {
        try {
            const umi = createUmi("https://api.devnet.solana.com")
                .use(mplTokenMetadata());

            const assets = await fetchAllDigitalAssetByOwner(umi, publicKey(wallet.publicKey!.toString()));
            const nftDataPromises = assets.map(async (asset: DigitalAsset) => {
                try {
                    const nftItem: NftData = {
                        mint: asset.publicKey.toString(),
                        name: asset.metadata.name,
                        uri: asset.metadata.uri,
                        image: "/placeholder.png" // Fallback image
                    };

                    if (asset.metadata.uri) {
                        try {
                            const response = await axios.get(asset.metadata.uri);
                            if (response.data && response.data.image) {
                                nftItem.image = response.data.image;
                            }
                        } catch (jsonError) {
                            console.error(`Failed to fetch JSON for ${asset.metadata.name}`, jsonError);
                        }
                    }
                    return nftItem;
                } catch (e) {
                    return null;
                }
            });

            const resolvedNfts = await Promise.all(nftDataPromises);

            const validNfts = resolvedNfts.filter((n): n is NftData => n !== null);

            return validNfts

        } catch (error) {
            console.error("Error fetching NFTs:", error);
            // setStatus("Error fetching NFTs");
        } finally {
            // setLoading(false);
        }
    }

    async function createAuctionInstruction(
        params: {
            nftMint: PublicKey;
            minBid: number | BN;         // in lamports (e.g., 0.1 SOL = 100_000_000)
            reservePrice: number | BN;   // in lamports
            durationSeconds: number;     // e.g., 86400 for 24 hours
        }
    ): Promise<TransactionInstruction> {

        const { nftMint, minBid, reservePrice, durationSeconds } = params;

        const tokenProgram = getMintProgramId(nftMint)
        // Current time + duration
        const endTime = new BN(Math.floor(Date.now() / 1000) + durationSeconds);

        // Derive PDA for auction account
        const [auctionPda, auctionBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("auction"), nftMint.toBuffer()],
            program!.programId
        );

        // Seller's NFT token account (ATA)
        const sellerNftAccount = await getAssociatedTokenAddressSync(
            nftMint,
            wallet.publicKey!
        );

        // Vault NFT token account (owned by auction PDA)
        const vaultNftAccount = await getAssociatedTokenAddressSync(
            nftMint,
            auctionPda
        );

        const instruction = await program!.methods
            .createAuction(
                new BN(minBid),
                new BN(reservePrice),
                endTime
            )
            .accounts({
                seller: wallet.publicKey!,
                nftMint,
                auction: auctionPda,
                sellerNftAccount,
                vaultNftAccount,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: tokenProgram,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .instruction();

        return instruction;
    }
    return { fetchNFTs, createAuctionInstruction }
}
