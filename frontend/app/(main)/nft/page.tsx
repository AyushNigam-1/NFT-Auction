"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    mplTokenMetadata,
    fetchAllDigitalAssetByOwner,
    DigitalAsset
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import axios from "axios";

// Define the shape of the data we need for the UI
interface NftData {
    mint: string;
    name: string;
    uri: string;
    image?: string; // We will load this from the URI
}

export default function MyNFTsPage() {
    const wallet = useWallet();
    const [nfts, setNfts] = useState<NftData[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (wallet.publicKey) {
            fetchNfts();
        } else {
            setNfts([]); // Clear NFTs if wallet disconnects
        }
    }, [wallet.publicKey]);

    const fetchNfts = async () => {
        if (!wallet.publicKey) return;

        try {
            setLoading(true);
            setStatus("Fetching On-Chain Accounts...");

            // 1. Setup Umi
            const umi = createUmi("https://api.devnet.solana.com")
                .use(mplTokenMetadata());

            const ownerPublicKey = publicKey(wallet.publicKey.toString());

            // 2. Fetch all NFT Metadata Accounts owned by the user
            // This gives us the name and URI, but NOT the image yet.
            const assets = await fetchAllDigitalAssetByOwner(umi, ownerPublicKey);

            console.log(`Found ${assets.length} NFTs`);
            setStatus(`Found ${assets.length} NFTs. Loading Images...`);

            // 3. Fetch the Off-Chain JSON for each NFT to get the Image
            // We map over the assets and create a list of promises
            const nftDataPromises = assets.map(async (asset: DigitalAsset) => {
                try {
                    // Default data from on-chain
                    const nftItem: NftData = {
                        mint: asset.publicKey.toString(),
                        name: asset.metadata.name,
                        uri: asset.metadata.uri,
                        image: "/placeholder.png" // Fallback image
                    };

                    // If URI exists, fetch the JSON
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

            // Wait for all HTTP requests to finish
            const resolvedNfts = await Promise.all(nftDataPromises);

            // Filter out any nulls (failed fetches)
            const validNfts = resolvedNfts.filter((n): n is NftData => n !== null);

            setNfts(validNfts);
            setStatus("Complete");

        } catch (error) {
            console.error("Error fetching NFTs:", error);
            setStatus("Error fetching NFTs");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6">My Devnet Wallet</h1>

            {/* Wallet Status */}
            {!wallet.connected ? (
                <div className="text-center p-10 border border-gray-700 rounded-lg">
                    <p className="text-xl">Please connect your wallet to view NFTs</p>
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-gray-400">
                            Connected: <span className="font-mono text-purple-400">{wallet.publicKey?.toString().slice(0, 6)}...</span>
                        </p>
                        <button
                            onClick={fetchNfts}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? "Refreshing..." : "Refresh List"}
                        </button>
                    </div>

                    {/* Status Message */}
                    {loading && <p className="text-yellow-400 animate-pulse mb-4">{status}</p>}

                    {/* Grid of NFTs */}
                    {nfts.length === 0 && !loading ? (
                        <p className="text-gray-500">No NFTs found on Devnet for this wallet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {nfts.map((nft) => (
                                <div key={nft.mint} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500 transition">
                                    {/* Image Container */}
                                    <div className="h-48 w-full bg-gray-700 relative">
                                        <img
                                            src={nft.image}
                                            alt={nft.name}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                            }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg truncate" title={nft.name}>{nft.name}</h3>
                                        <a
                                            href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-400 hover:underline mt-2 block"
                                        >
                                            View on Explorer
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}