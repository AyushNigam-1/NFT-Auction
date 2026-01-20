// "use client";
// import { DollarSign, PieChart } from "lucide-react";
// import React, { useState, useEffect, useMemo } from "react";

// interface BuySharesCalculatorProps {
//     totalValueInr: string;
//     totalShares: number;
//     percentage: number;
//     setPercentage: (value: number) => void;
//     totalSol: number;
//     setTotalSol: (value: number) => void;
//     // New Prop: Needed to pass the actual number of shares to the parent
//     setSharesAmount: (value: number) => void;
// }

// const BuySharesCalculator: React.FC<BuySharesCalculatorProps> = ({
//     totalValueInr,
//     totalShares,
//     percentage,
//     setPercentage,
//     setTotalSol,
//     setSharesAmount
// }) => {
//     const [solPriceInr, setSolPriceInr] = useState<number | null>(null);

//     // 1. Fetch SOL Price
//     useEffect(() => {
//         const fetchSolPrice = async () => {
//             try {
//                 const res = await fetch(
//                     "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
//                 );
//                 const data = await res.json();
//                 setSolPriceInr(data.solana.usd);
//             } catch (err) {
//                 console.error("Failed to fetch SOL price:", err);
//                 setSolPriceInr(null);
//             }
//         };
//         fetchSolPrice();
//     }, []);

//     // 2. Parser for INR Strings (Crore/Lakh)
//     const parseInrValue = (valueStr: string | undefined): number => {
//         if (!valueStr) return 0;
//         let cleaned = valueStr.toString().toLowerCase().replace(/,/g, "").replace(/₹/g, "").replace(/\s+/g, "").trim();
//         let multiplier = 1;
//         if (cleaned.includes("crore") || cleaned.includes("cr")) {
//             multiplier = 10_000_000;
//             cleaned = cleaned.replace("crore", "").replace("cr", "");
//         } else if (cleaned.includes("lakh") || cleaned.includes("l")) {
//             multiplier = 100_000;
//             cleaned = cleaned.replace("lakh", "").replace("l", "");
//         }
//         const numericValue = parseFloat(cleaned);
//         return isNaN(numericValue) ? 0 : numericValue * multiplier;
//     };

//     // 3. Core Calculations using useMemo for performance
//     const { sharesWanted, costInInr, costInSol } = useMemo(() => {
//         const totalValue = parseInrValue(totalValueInr);
//         const safeTotalShares = totalShares || 1;

//         // Calculate exact shares based on percentage
//         const calculatedShares = Math.floor(safeTotalShares * (percentage / 100));

//         // Calculate cost
//         const pricePerShare = totalValue / safeTotalShares;
//         const totalCostInr = calculatedShares * pricePerShare;
//         const totalCostSol = solPriceInr ? (totalCostInr / solPriceInr) : 0;

//         return {
//             sharesWanted: calculatedShares,
//             costInInr: totalCostInr,
//             costInSol: totalCostSol
//         };
//     }, [totalValueInr, totalShares, percentage, solPriceInr]);

//     // 4. Update Parent State whenever calculations change
//     useEffect(() => {
//         setSharesAmount(sharesWanted);
//         setTotalSol(costInSol);
//     }, [sharesWanted, costInSol, setSharesAmount, setTotalSol]);

//     // Loading State
//     if (!totalValueInr || !totalShares) {
//         return <div className="p-8 bg-gray-900/50 rounded-2xl animate-pulse h-64 border border-gray-800" />;
//     }

//     return (
//         <div className="space-y-6">
//             <div className="flex gap-2 w-full items-center">
//                 <PieChart className="w-4 h-4 text-emerald-400" />
//                 <p className="text-gray-100 text-lg font-semibold">Choose Shares</p>
//             </div>

//             <div className="relative space-y-2">
//                 <div className="flex items-center gap-4">
//                     <div className="relative w-full h-10 flex items-center">
//                         <div className="absolute w-full h-2 bg-white/5 rounded-lg"></div>
//                         <div
//                             className="absolute top-9 -translate-y-1/2 flex items-center justify-center
//                                      bg-emerald-400 text-gray-800 font-bold text-xs rounded-full
//                                      h-8 w-8 p-3 pointer-events-none select-none z-10"
//                             style={{
//                                 left: `${percentage}%`,
//                                 transform: `translate(-50%, -50%)`
//                             }}
//                         >
//                             {percentage}%
//                         </div>
//                         <input
//                             type="range"
//                             min="1"
//                             max="100"
//                             step="1"
//                             value={percentage}
//                             onChange={(e) => setPercentage(parseFloat(e.target.value))}
//                             className="absolute w-full h-full opacity-0 cursor-pointer z-20"
//                         />
//                     </div>
//                 </div>
//                 <div className="flex justify-between text-sm text-gray-300 tracking-tighter">
//                     <span>Buying: {sharesWanted.toLocaleString()} Shares</span>
//                     <span>Total: {totalShares.toLocaleString()} Shares</span>
//                 </div>
//             </div>

//             <div className="flex ">
//                 <div className="flex flex-col gap-2 w-full">
//                     <span className="text-sm text-gray-300  tracking-wider">Cost (USD)</span>
//                     <div className="flex items-center gap-3">
//                         <span className="text-emerald-400 font-bold text-lg">$</span>
//                         <h6 className="font-semibold text-lg text-white">
//                             {costInInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
//                         </h6>
//                     </div>
//                 </div>

//                 <div className="flex flex-col gap-2 w-full">
//                     <span className="text-sm text-gray-300  tracking-wider">Cost (SOL)</span>
//                     <div className="flex items-center gap-3">
//                         <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             viewBox="130 150 250 210"
//                             className="w-5 fill-emerald-400"
//                         >
//                             <g transform="translate(0,512) scale(0.1,-0.1)">
//                                 <path d="M1765 3526 c-16 -8 -121 -106 -232 -218 -200 -201 -203 -205 -203
//                                         -247 0 -34 6 -49 29 -72 l30 -29 985 2 986 3 216 216 c215 215 217 217 217
//                                         260 0 35 -6 48 -32 71 l-31 28 -968 0 c-790 -1 -972 -3 -997 -14z m1695 -281
//                                         l-165 -165 -897 0 c-494 0 -898 3 -898 7 0 4 71 79 157 165 l158 158 905 0
//                                         905 0 -165 -165z"/>
//                                 <path d="M1394 2850 c-55 -22 -79 -93 -50 -148 24 -45 389 -400 429 -417 32
//                                         -13 161 -15 987 -15 1057 0 997 -4 1026 67 26 61 11 82 -214 305 -164 162
//                                         -214 206 -241 212 -50 9 -1913 6 -1937 -4z m2076 -285 l165 -165 -905 0 -905
//                                         1 -168 164 -167 165 907 0 908 0 165 -165z"/>
//                                 <path d="M1755 2141 c-16 -10 -119 -109 -229 -219 -196 -198 -199 -200 -199
//                                         -243 0 -35 6 -48 32 -71 l31 -28 971 0 c689 0 977 3 992 11 42 21 436 422 442
//                                         449 7 33 -7 72 -36 99 l-23 21 -975 0 c-940 0 -977 -1 -1006 -19z m1715 -266
//                                         l-165 -165 -905 0 -905 0 165 165 165 165 905 0 905 0 -165 -165z"/>
//                             </g>
//                         </svg>
//                         <span className="text-lg font-bold text-white">
//                             {solPriceInr ? costInSol.toFixed(4) : <span className="text-xs text-green-500">Fetching...</span>}
//                         </span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default BuySharesCalculator;


"use client";
import { DollarSign, PieChart, Wallet, Layers, Banknote } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

interface BuySharesCalculatorProps {
    totalValueUsd: string;
    totalShares: number;
    totalRentUsd: number;
    percentage: number;
    setPercentage: (value: number) => void;
    setTotalSol: (value: number) => void;
    setSharesAmount: (value: number) => void;
    // New Prop: Setter for the calculated monthly rent in the parent state
    setMonthlyRent: (value: number) => void;
}

const BuySharesCalculator: React.FC<BuySharesCalculatorProps> = ({
    totalValueUsd,
    totalShares,
    totalRentUsd,
    percentage,
    setPercentage,
    setTotalSol,
    setSharesAmount,
    setMonthlyRent
}) => {
    const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);

    // 1. Fetch SOL Price in USD
    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
                );
                const data = await res.json();
                setSolPriceUsd(data.solana.usd);
            } catch (err) {
                console.error("Failed to fetch SOL price:", err);
                setSolPriceUsd(null);
            }
        };
        fetchSolPrice();
    }, []);

    // 2. Parser for USD Strings
    const parseUsdValue = (valueStr: string | undefined): number => {
        if (!valueStr) return 0;
        const cleaned = valueStr.toString().replace(/[$,\s]/g, "");
        const numericValue = parseFloat(cleaned);
        return isNaN(numericValue) ? 0 : numericValue;
    };

    // 3. Core Calculations
    const { sharesWanted, costInUsd, costInSol, expectedRent } = useMemo(() => {
        const totalValue = parseUsdValue(totalValueUsd);
        const safeTotalShares = totalShares || 1;

        const calculatedShares = Math.floor(safeTotalShares * (percentage / 100));
        const pricePerShare = totalValue / safeTotalShares;
        const totalCostUsd = calculatedShares * pricePerShare;
        const totalCostSol = solPriceUsd ? (totalCostUsd / solPriceUsd) : 0;

        // Calculate proportional rent based on percentage
        const projectedRent = totalRentUsd * (percentage / 100);

        return {
            sharesWanted: calculatedShares,
            costInUsd: totalCostUsd,
            costInSol: totalCostSol,
            expectedRent: projectedRent
        };
    }, [totalValueUsd, totalShares, totalRentUsd, percentage, solPriceUsd]);

    // 4. Update Parent State whenever calculations change
    useEffect(() => {
        setSharesAmount(sharesWanted);
        setTotalSol(costInSol);
        setMonthlyRent(expectedRent); // Update the parent's monthly rent state
    }, [sharesWanted, costInSol, expectedRent, setSharesAmount, setTotalSol, setMonthlyRent]);

    if (!totalValueUsd || !totalShares) {
        return <div className="p-8 bg-gray-900/50 rounded-2xl animate-pulse h-64 border border-gray-800" />;
    }

    const metrics = [
        {
            label: "You Receive",
            value: `${sharesWanted.toLocaleString()} Shares`,
            icon: <Layers className="text-emerald-400 w-6 h-6" />,
        },
        {
            label: "Monthly Rent",
            value: `$${expectedRent.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            icon: <Wallet className="text-emerald-400 w-6 h-6" />,
        },
        {
            label: "Cost (USD)",
            value: `$${costInUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            icon: <Banknote className="text-emerald-400 w-6 h-6" />,
        },
        {
            label: "Cost (SOL)",
            value: solPriceUsd ? costInSol.toFixed(4) : "---",
            icon: (
                <svg viewBox="130 150 250 210" className="w-5 fill-emerald-400">
                    <g transform="translate(0,512) scale(0.1,-0.1)">
                        <path d="M1765 3526 c-16 -8 -121 -106 -232 -218 -200 -201 -203 -205 -203 -247 0 -34 6 -49 29 -72 l30 -29 985 2 986 3 216 216 c215 215 217 217 217 260 0 35 -6 48 -32 71 l-31 28 -968 0 c-790 -1 -972 -3 -997 -14z" />
                        <path d="M1394 2850 c-55 -22 -79 -93 -50 -148 24 -45 389 -400 429 -417 32 -13 161 -15 987 -15 1057 0 997 -4 1026 67 26 61 11 82 -214 305 -164 162 -214 206 -241 212 -50 9 -1913 6 -1937 -4z" />
                        <path d="M1755 2141 c-16 -10 -119 -109 -229 -219 -196 -198 -199 -200 -199 -243 0 -35 6 -48 32 -71 l31 -28 971 0 c689 0 977 3 992 11 42 21 436 422 442 449 7 33 -7 72 -36 99 l-23 21 -975 0 c-940 0 -977 -1 -1006 -19z" />
                    </g>
                </svg>
            ),
        }
    ];
    return (
        <div className="space-y-8">
            {/* Slider Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 w-full items-center">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <p className="text-gray-100 text-lg font-semibold">Choose Shares</p>
                    </div>
                    <p className="text-sm text-gray-200 text-nowrap">Total: {totalShares} Share</p>
                </div>

                <div className="relative space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="relative w-full h-10 flex items-center">
                            <div className="absolute w-full h-2 bg-white/5 rounded-lg"></div>
                            <div
                                className="absolute top-9 -translate-y-1/2 flex items-center justify-center
                                          bg-emerald-400 text-gray-800 font-bold text-xs rounded-full
                                          h-8 w-8 p-3 pointer-events-none select-none z-10"
                                style={{ left: `${percentage}%`, transform: `translate(-50%, -50%)` }}
                            >
                                {percentage}%
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={percentage}
                                onChange={(e) => setPercentage(parseFloat(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 gap-y-6">
                {metrics.map((metric, index) => (
                    <div key={index} className="flex flex-col gap-2 w-full">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                            {metric.label}
                        </span>
                        <div className="flex items-center gap-3">
                            {metric.icon}
                            <h6 className="font-semibold text-lg text-white">
                                {metric.value}
                            </h6>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuySharesCalculator;