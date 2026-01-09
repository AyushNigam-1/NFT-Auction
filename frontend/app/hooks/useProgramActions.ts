import { PropertyData } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BN, web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getMintProgramId } from "../utils";

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


    async function getAllProperties(): Promise<PropertyData[]> {

        try {
            const properties = await (program!.account as any).property.all();

            const formattedProperties: PropertyData[] = properties.map((prop: any) => ({
                publicKey: prop.publicKey,
                owner: prop.account.owner,
                mint: prop.account.mint,
                totalShares: prop.account.totalShares.toBigInt(), // u64 → bigint
                bump: prop.account.bump,
            }));

            console.log(`Fetched ${formattedProperties.length} properties`);
            return formattedProperties;
        } catch (error) {
            console.error("Error fetching properties:", error);
            return [];
        }
    }

    async function createProperty(
        totalShares: number | BN,
        mintPubkey: PublicKey,
        metadata_uri: string
    ) {
        if (!wallet.connected || !wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        const tokenProgramId = getMintProgramId(mintPubkey)

        const [propertyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("property"), wallet.publicKey.toBuffer()],
            PROGRAM_ID
        );

        const ownerTokenAccount = getAssociatedTokenAddressSync(
            mintPubkey,
            wallet.publicKey
        );

        const tx = await program!.methods
            .createProperty(new BN(totalShares), metadata_uri)
            .accounts({
                owner: wallet.publicKey,
                property: propertyPda,
                mint: mintPubkey,
                ownerTokenAccount,
                systemProgram: web3.SystemProgram,
                tokenProgram: tokenProgramId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            }).rpc()
        return tx;

    }
    return { createProperty, getAllProperties }
}
