"use client";
import React, { Fragment } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";
import { X, MapPin, Database, User, Clock, ShieldCheck, Copy, Home, Layers } from "lucide-react";

interface ShareDetails {
    owner: string;
    property: {
        name: string;
        image: string;
        address: string;
    };
    shares: string;
    lastClaim: string;
    bump: number;
}

interface ShareDetailsModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    data: ShareDetails | null;
}

const ShareDetailsModal: React.FC<ShareDetailsModalProps> = ({ open, setOpen, data }) => {
    if (!data) return null;

    // const rawShares = parseInt(data.shares, 16);
    // const formattedShares = (rawShares / 1_000_000_000).toLocaleString();

    return (
        <Transition show={open} appear={true} as={Fragment}>
            <Dialog as="div" className="relative z-50 font-mono" onClose={() => setOpen(false)}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-[2rem] bg-[#1a1a1a] border border-white/5 text-left align-middle shadow-2xl transition-all">

                                {/* 1. Hero Property Section (Matching your Detail Page) */}
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        src={`https://ipfs.io/ipfs/${data.property.image}`}
                                        alt="Property Hero"
                                        className="w-full h-full object-cover brightness-75"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-black/40" />

                                    <button
                                        onClick={() => setOpen(false)}
                                        className="absolute top-6 right-6 p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="absolute bottom-6 left-8 right-8">
                                        <h2 className="text-2xl font-bold text-white mb-2">{data.property.name}</h2>
                                        <div className="flex items-center gap-2 text-gray-300 text-xs">
                                            <MapPin className="w-4 h-4 text-green-400" />
                                            <span className="opacity-80">{data.property.address}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Ownership Stats Grid (Matching your Form Layout) */}
                                <div className="p-8 space-y-8">

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 border-b border-white/5 pb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                                                <Layers className="w-3 h-3 text-green-400" /> Ownership
                                            </label>
                                            <div className="text-xl font-bold text-white flex items-baseline gap-2">
                                                {/* {formattedShares} <span className="text-xs text-gray-500 font-normal">SHARES</span> */}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-right">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center justify-end gap-2">
                                                Yield Status <Clock className="w-3 h-3 text-green-400" />
                                            </label>
                                            <div className="text-xl font-bold text-white">
                                                {/* {data.lastClaim === "00" ? "5%" : "Active"} */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Identity Section (Clean Monospace Look) */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                                                <User className="w-3 h-3 text-green-400" /> Verified Shareholder
                                            </span>
                                            <ShieldCheck className="w-4 h-4 text-green-400 opacity-50" />
                                        </div>
                                        <div className="group relative">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-green-300 font-mono break-all leading-relaxed pr-12">
                                                {/* {data.owner} */}
                                                {/* </div> */}
                                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-green-400 transition-colors">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 4. Action Button (Matching your "Buy Now" Style) */}
                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                className="w-full py-4 bg-green-500 hover:bg-green-400 text-gray-900 font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)] active:scale-[0.98] flex items-center justify-center gap-2"
                                                onClick={() => setOpen(false)}
                                            >
                                                <ShieldCheck className="w-5 h-5" />
                                                Confirm Verification
                                            </button>
                                            <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-widest">
                                                Security Bump: {data.bump} • Logged on Solana Mainnet
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ShareDetailsModal;