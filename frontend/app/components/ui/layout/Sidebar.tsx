"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react"; // Import Solana Wallet Hook
import {
    Building,
    Layers,
    Store,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Import your custom hook (adjust path as needed)
// import { useVerificationStatus } from "@/hooks/useVerificationStatus";

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const router = useRouter();
    const currentPage = usePathname();

    // Get Wallet & Verification Status
    const { disconnect, publicKey } = useWallet();
    // const { data: isVerified, isLoading: isVerifying } = useVerificationStatus(publicKey?.toString());
    const {
        data: isVerified,
        isLoading: isVerifying,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: ["verification-status", publicKey],
        queryFn: async () => {
            const res = await axios.get(
                `http://127.0.0.1:3001/api/verify/status/${publicKey}`
            );
            console.log(res.data.verified, "lol")
            return res.data.verified as boolean;
        },
        enabled: !!publicKey, // Only run if wallet is connected
        staleTime: 60 * 1000, // Cache result for 1 minute
    });
    const handleNavigate = useCallback(
        (route: string) => {
            router.push(route);
            if (isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        },
        [isSidebarOpen, router]
    );

    const handleLogout = useCallback(async () => {
        await disconnect();
        router.push("/"); // Redirect to home/login after logout
    }, [disconnect, router]);

    const navOptions = [
        {
            icon: <Building size={20} />,
            text: "Marketplace",
            route: "/marketplace",
        },
        {
            icon: <Layers size={20} />,
            text: "Portfolio",
            route: "/portfolio",
        },
        {
            icon: <Store size={20} />,
            text: "My Listings",
            route: "/my-listings",
            divider: true,
        },
    ];

    return (
        <aside
            id="default-sidebar"
            className={`z-40 w-64 h-screen transition-transform transform font-mono bg-white/5 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } sm:translate-x-0`}
            aria-label="Sidebar"
        >
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Brand Header */}
                <div className="flex items-center gap-3 p-5 border-b border-white/5">
                    <LayoutDashboard size={24} className="text-emerald-400" />
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                        YieldHome
                    </span>
                </div>

                {/* Navigation Items */}
                <ul className="space-y-2 p-4">
                    {navOptions.map((option, index) => (
                        <li key={index}>
                            {option.divider && (
                                <div className="my-2 border-t border-white/5" />
                            )}
                            <button
                                className={`
                                        cursor-pointer font-medium flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
                                        ${currentPage === option.route
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }
                                    `}
                                onClick={() => handleNavigate(option.route)}
                            >
                                {option.icon}
                                <span className="whitespace-nowrap">{option.text}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- BOTTOM SIDEBAR FOOTER --- */}
            <div className="p-4 space-y-4">

                {/* Verification Status Card */}
                {publicKey && (
                    <div className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${isVerified
                        ? "bg-emerald-900/10 border-emerald-500/20 text-emerald-400"
                        : "bg-yellow-900/10 border-yellow-500/20 text-yellow-500"
                        }`}>
                        {isVerifying ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : isVerified ? (
                            <ShieldCheck size={18} />
                        ) : (
                            <AlertCircle size={18} />
                        )}

                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                                {isVerifying ? "Checking..." : isVerified ? "Verified" : "Unverified"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 border-red-500/20 text-red-400 bg-red-900/10 rounded-xl transition-all text-sm font-bold border cursor-pointer hover:border-red-500/20"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;