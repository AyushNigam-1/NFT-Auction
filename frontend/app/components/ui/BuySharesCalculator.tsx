"use client";

import { DollarSign, PieChart } from "lucide-react";
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
            <div className="flex gap-2 w-full items-center">
                {/* <span className="p-2 bg-green-300/5 rounded-full text-green-300"> */}
                <PieChart className="w-4 h-4 text-green-300" />
                {/* </span> */}
                <p className="text-gray-100 text-lg font-semibold" > Choose Shares </p>
            </div>
            <div className="">
                <div className="flex items-center gap-4">
                    <div className="relative w-full h-10 flex items-center">
                        <div className="absolute w-full h-2 bg-white/5 rounded-lg"></div>
                        <div
                            className="absolute top-9 -translate-y-1/2 flex items-center justify-center 
                     bg-green-300 text-gray-900 font-bold text-xs rounded-full 
                     h-8 w-8 p-3 pointer-events-none select-none z-10"
                            style={{
                                left: `${percentage}%`,
                                transform: `translate(-50%, -50%)`
                            }}
                        >
                            {percentage}%
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={percentage}
                            onChange={(e) => setPercentage(parseFloat(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                        />

                    </div>
                </div>
            </div>

            <div className="flex">
                {/* <div className="flex gap-4 bg-white/5 p-2 rounded-2xl w-full items-center">
                    <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                        <DollarSign />
                    </span>
                    <div className="space-y-1">
                        <p className="text-gray-300 text-sm" >Cost (INR):</p>
                        <h6 className="font-semibold text-lg">₹ {costInInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h6>
                    </div>
                </div> */}
                <div className="flex flex-col gap-2 w-full">
                    <span className="text-xs text-gray-300 uppercase tracking-wider">Cost (USD)</span>
                    <div className="flex items-center gap-2">
                        <DollarSign className="text-green-300 h-6" />
                        <h6 className="font-semibold text-lg">{costInInr.toLocaleString(undefined, { maximumFractionDigits: 0 })} </h6>
                    </div>
                </div>

                {/* <div className="flex gap-4 bg-white/5 p-2 rounded-2xl w-full items-center"> */}
                <div className="flex flex-col gap-2 w-full">
                    <span className="text-xs text-gray-300 uppercase tracking-wider">Cost (SOL)</span>
                    <div className="flex items-center gap-2">
                        {/* <TrendingUpIcon className="w-6 h-6 text-green-300" /> */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="w-8 fill-green-300"
                        >
                            <g transform="translate(0,512) scale(0.1,-0.1)">
                                <path d="M1765 3526 c-16 -8 -121 -106 -232 -218 -200 -201 -203 -205 -203
                                    -247 0 -34 6 -49 29 -72 l30 -29 985 2 986 3 216 216 c215 215 217 217 217
                                    260 0 35 -6 48 -32 71 l-31 28 -968 0 c-790 -1 -972 -3 -997 -14z m1695 -281
                                    l-165 -165 -897 0 c-494 0 -898 3 -898 7 0 4 71 79 157 165 l158 158 905 0
                                    905 0 -165 -165z"/>
                                <path d="M1394 2850 c-55 -22 -79 -93 -50 -148 24 -45 389 -400 429 -417 32
                                    -13 161 -15 987 -15 1057 0 997 -4 1026 67 26 61 11 82 -214 305 -164 162
                                    -214 206 -241 212 -50 9 -1913 6 -1937 -4z m2076 -285 l165 -165 -905 0 -905
                                    1 -168 164 -167 165 907 0 908 0 165 -165z"/>
                                <path d="M1755 2141 c-16 -10 -119 -109 -229 -219 -196 -198 -199 -200 -199
                                    -243 0 -35 6 -48 32 -71 l31 -28 971 0 c689 0 977 3 992 11 42 21 436 422 442
                                    449 7 33 -7 72 -36 99 l-23 21 -975 0 c-940 0 -977 -1 -1006 -19z m1715 -266
                                    l-165 -165 -905 0 -905 0 165 165 165 165 905 0 905 0 -165 -165z"/>
                            </g>
                        </svg>
                        <span className="text-lg font-bold text-white"> {costInSol() === "Updating..." ? <span className="text-sm text-yellow-500">Fetching Price...</span> : `${costInSol()}`}</span>
                    </div>
                </div>
                {/* <span className="p-1 bg-green-300/5 rounded-full text-green-300">

                </span>
                <div className="space-y-1">
                    <p className="text-gray-300 text-sm" >Cost (SOL):</p>
                    <h6 className="font-semibold text-lg"> </h6>
                </div> */}
            </div>
            {/* </div> */}
        </div>
    );
};

export default BuySharesCalculator;