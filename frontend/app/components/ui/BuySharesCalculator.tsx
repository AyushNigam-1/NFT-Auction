"use client";

import React, { useState, useEffect } from "react";

interface BuySharesCalculatorProps {
    totalValueInr: string;
    totalShares: number;
    percentage: number;
    setPercentage: (value: number) => void,
    totalSol: number,
    setTotalSol: (value: number) => void
}

const BuySharesCalculator: React.FC<BuySharesCalculatorProps> = ({
    totalValueInr,
    totalShares,
    percentage,
    setPercentage,
    totalSol,
    setTotalSol
    // solPriceInr,
    // setSolPriceInr
}) => {
    // const [percentage, setPercentage] = useState<number>(1);
    const [solPriceInr, setSolPriceInr] = useState<number | null>(null);

    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=inr"
                );
                const data = await res.json();
                setSolPriceInr(data.solana.inr);
            } catch (err) {
                console.error("Failed to fetch SOL price:", err);
                setSolPriceInr(null);
            }
        };
        fetchSolPrice();
    }, []);

    const parseInrValue = (valueStr: string | undefined): number => {
        if (!valueStr) return 0;
        let cleaned = valueStr.toString().toLowerCase().replace(/,/g, "").replace(/₹/g, "").replace(/\s+/g, "").trim();
        let multiplier = 1;
        if (cleaned.includes("crore") || cleaned.includes("cr")) {
            multiplier = 10_000_000;
            cleaned = cleaned.replace("crore", "").replace("cr", "");
        } else if (cleaned.includes("lakh") || cleaned.includes("l")) {
            multiplier = 100_000;
            cleaned = cleaned.replace("lakh", "").replace("l", "");
        }
        const numericValue = parseFloat(cleaned);
        return isNaN(numericValue) ? 0 : numericValue * multiplier;
    };

    const totalValue = parseInrValue(totalValueInr);

    // 🛡️ Prevent Division by Zero
    const safeTotalShares = totalShares || 1;

    // Calculations
    const sharePercentage = percentage / 100;
    const sharesWanted = Math.floor(safeTotalShares * sharePercentage);
    const pricePerShare = totalValue / safeTotalShares;
    const costInInr = sharesWanted * pricePerShare;

    // Only show SOL price if we successfully fetched it
    const costInSol = () => {
        if ((solPriceInr && solPriceInr > 0)) {
            const totalSol = (costInInr / solPriceInr).toFixed(4)
            setTotalSol(Number(totalSol))
            return totalSol
        }
        else {
            return "Updating...";
        }
    }

    // 🛑 Loading State
    if (!totalValueInr || !totalShares) {
        return <div className="p-8 bg-gray-900/50 rounded-2xl animate-pulse h-64 border border-gray-800" />;
    }

    return (
        <div className="space-y-6">
            {/* <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Buy Shares Calculator
            </h2> */}

            <div className="">
                <label className="block text-lg font-medium text-gray-300 mb-3">
                    Percentage of Property to Own
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={percentage}
                        onChange={(e) => setPercentage(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="relative">
                        <input
                            type="number"
                            min="0.1"
                            max="100"
                            step="0.1"
                            value={percentage}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 100) setPercentage(val);
                            }}
                            className="w-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <span className="absolute right-8 top-2 text-transparent pointer-events-none">%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-white/5 p-6 rounded-xl ">
                <div className="flex justify-between text-gray-300">
                    <span>Shares You Will Own:</span>
                    <span className="font-bold text-white">{sharesWanted.toLocaleString()}</span>
                </div>
                <div className='h-0.5 w-full bg-white/5' />

                <div className="flex justify-between text-gray-300">
                    <span>Estimated Cost (INR):</span>
                    <span className="font-bold text-green-400">
                        ₹ {costInInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </div>

                <div className='h-0.5 w-full bg-white/5' />

                <div className="flex justify-between text-gray-300 ">
                    <span>Estimated Cost (SOL):</span>
                    <span className="font-bold text-green-400 text-xl">
                        {costInSol() === "Updating..." ? <span className="text-sm text-yellow-500">Fetching Price...</span> : `${costInSol()} SOL`}
                    </span>
                </div>
            </div>


        </div>
    );
};

export default BuySharesCalculator;