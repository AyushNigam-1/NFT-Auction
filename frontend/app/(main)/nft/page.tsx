"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/app/components/ui/Header";
import { NftData } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import { useProgramActions } from "@/app/hooks/useProgramActions";



export default function MyNFTsPage() {
    const wallet = useWallet();
    const { fetchNFTs } = useProgramActions()
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const {
        data: nfts,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: [""],
        queryFn: async () => await fetchNFTs(),
        // enabled: !!publicKey && !!planPDA,
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });
    console.log("subscribers", nfts)



    return (

        <div className="p-4 min-h-screen text-white">
            <Header title="Subscriptions" refetch={refetch} isFetching={isFetching} />
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-gray-400">
                        Connected: <span className="font-mono text-purple-400">{wallet.publicKey?.toString().slice(0, 6)}...</span>
                    </p>
                    <button
                        // onClick={fetchNfts}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh List"}
                    </button>
                </div>

                {/* Status Message */}
                {loading && <p className="text-yellow-400 animate-pulse mb-4">{status}</p>}

                {/* Grid of NFTs */}
                {nfts?.length === 0 && !loading ? (
                    <p className="text-gray-500">No NFTs found on Devnet for this wallet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {nfts?.map((nft) => (
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
            {/* )} */}
        </div>
    );
}