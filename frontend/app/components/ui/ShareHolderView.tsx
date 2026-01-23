"use client"

import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Banknote, Calendar, Layers, Pointer, Download, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import numeral from 'numeral'
import { useMutations } from '@/app/hooks/useMutations'
import { useProgram } from '@/app/hooks/useProgram'

// Standard RPC connection (Devnet for now, change if on Mainnet)
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const ShareHolderView = ({ shareDetails, propertyPda, mintKey }: { shareDetails: any[], propertyPda: PublicKey, mintKey: PublicKey }) => {
    const { claimYield } = useMutations()
    const { program, publicKey } = useProgram()
    const [claimableAmount, setClaimableAmount] = useState<number>(0);
    const [pdaBalance, setPdaBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchBalanceAndCalculate = async () => {
            const [propertyVault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), propertyPda!.toBuffer()],
                program!.programId
            );
            if (!propertyVault) return;

            try {
                setLoading(true);

                // 1. Fetch Property PDA Balance (The Vault)
                const balanceLamports = await connection.getBalance(propertyVault);
                const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
                setPdaBalance(balanceSol);

                // 2. Extract Share Percentage from props
                // Looking for the item with title "Shares" in your array
                const shareItem = shareDetails.find((item: any) => item.title === "Shares");

                if (shareItem) {
                    // Remove '%' and convert to number (e.g., "5%" -> 5)
                    const percentageString = shareItem.value.toString().replace('%', '');
                    const percentage = parseFloat(percentageString);

                    // 3. Calculate User's Slice
                    // Formula: Vault Balance * (User% / 100)
                    const userShare = balanceSol * (percentage / 100);
                    setClaimableAmount(userShare);
                }

            } catch (error) {
                console.error("Error calculating yield:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalanceAndCalculate();
    }, [propertyPda, shareDetails]);

    // Dummy Data for Table
    // const rentHistory = [
    //     { date: "2025-02-01", amount: 1.5, status: "Pending" },
    //     { date: "2025-01-01", amount: 1.2, status: "Claimed" },
    //     { date: "2024-12-01", amount: 1.2, status: "Claimed" },
    // ];

    return (
        <div>
            <div className="space-y-6">

                {/* Header & Stats */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 w-full items-center">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        <p className="text-gray-100 text-lg font-semibold">Your Holdings</p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Dynamic Balance Card */}
                    {/* <div className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-900/10 border border-emerald-500/20">
                        <span className="text-xs text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-2">
                            <Wallet size={14} /> Claimable Yield
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white">
                                {loading ? "..." : `${numeral(claimableAmount).format('0,0.00')} SOL`}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                            Based on vault balance: {numeral(pdaBalance).format('0,0.00')} SOL
                        </span>
                    </div> */}

                    {/* Existing Share Details from Props */}
                    {shareDetails?.map((detail: any, i: number) => (
                        <div className="flex flex-col gap-3 " key={i}>
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold ">{detail.title}</span>
                            <div className="flex items-center gap-3">
                                {detail.icon}
                                <span className="text-xl font-bold text-white">{detail.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl border border-white/5">
                    {/* 1. Add 'table-fixed' here. This forces the columns to respect the widths you set below. */}
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-white/5 text-gray-400 uppercase text-sm font-bold tracking-wider">
                            <tr>
                                {/* 2. Add 'w-1/3' to EACH header to force them to be exactly 33.3% each */}
                                <th className="px-6 py-4 w-1/3">
                                    <div className="flex items-center gap-2">
                                        Date
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-1/3">
                                    <div className="flex items-center justify-center gap-2">
                                        Yield
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-1/3 ">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* <Pointer className="w-4 h-4" />  */}
                                        Action
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4 font-mono text-white truncate">
                                    2025-02-01
                                </td>
                                <td className="px-6 py-4 font-mono text-emerald-400 font-bold truncate text-center">
                                    {loading ? "..." : `${numeral(claimableAmount).format('0,0.00')} SOL`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button

                                        disabled={claimableAmount <= 0}
                                        className="inline-flex items-center  gap-2 text-emerald-400 disabled:bg-transparent disabled:text-gray-600 disabled:cursor-not-allowed font-bold  tracking-wide transition-all hover:text-emerald-300"
                                        onClick={() => claimYield.mutate({ property: propertyPda, mint: mintKey })}
                                    >
                                        <Download size={16} /> Claim
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}

export default ShareHolderView