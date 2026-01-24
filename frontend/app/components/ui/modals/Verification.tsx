"use client";
import { Fragment, useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";;
import {
    getAssociatedTokenAddressSync,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";
import {
    Upload,
    FileText,
    CheckCircle,
    Loader2,
    ShieldAlert,
} from "lucide-react";
import { usePrograms } from "@/app/hooks/useProgram";

export default function VerificationModal({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    // const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "checking" | "uploading" | "minting" | "success">("checking");
    const [file, setFile] = useState<File | null>(null);

    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();
    const { identityProgram, getKycMintPDA } = usePrograms();

    // ---------------------------------------------------------
    // 1. AUTOMATIC CHECK: Does user already have the SBT?
    // ---------------------------------------------------------
    useEffect(() => {
        const checkEligibility = async () => {
            if (!publicKey) return;

            try {
                const mintPda = getKycMintPDA();

                // Derive where the SBT *should* be
                const ata = getAssociatedTokenAddressSync(
                    mintPda,
                    publicKey,
                    false,
                    TOKEN_2022_PROGRAM_ID
                );

                // Check balance
                const balance = await connection.getTokenAccountBalance(ata);

                if (balance.value.uiAmount === 1) {
                    console.log("✅ User already verified. Redirecting...");
                    router.push("/dashboard");
                } else {
                    setStatus("idle");
                    setIsOpen(true); // Open modal if not verified
                }
            } catch (e) {
                // If account doesn't exist, they are not verified
                console.log("User not verified yet.");
                setStatus("idle");
                setIsOpen(true);
            }
        };

        checkEligibility();
    }, [publicKey, connection, router]);

    // ---------------------------------------------------------
    // 2. MOCK UPLOAD & MINT ACTION
    // ---------------------------------------------------------
    const handleUploadAndMint = async () => {
        if (!file || !publicKey || !identityProgram) return;

        try {
            setStatus("uploading");

            // SIMULATION: Upload to server
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStatus("minting");

            // REAL ON-CHAIN ACTION: Issue the badge
            // In a real app, this happens on the backend. 
            // For your DEMO, we call it here so you can test the flow.
            // await issueBadge(identityProgram, publicKey, publicKey); // Self-mint for demo

            setStatus("success");

            // Wait 1s then redirect
            setTimeout(() => {
                setIsOpen(false);
                router.push("/marketplace");
            }, 1000);

        } catch (error) {
            console.error("Verification failed:", error);
            setStatus("idle");
            alert("Verification Failed. See console.");
        }
    };

    // Helper to handle drag-drop
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => { /* Prevent closing if not verified? */ }}
            >
                {/* Backdrop with Blur */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6  align-middle shadow-xl transition-all font-mono space-y-4 ">

                                {/* Header */}
                                <ShieldAlert className="text-emerald-400 mx-auto" size={40} />

                                <DialogTitle as="div" className="text-xl font-bold text-white flex-col items-center gap-">
                                    Identity Verification
                                </DialogTitle>
                                <div className="">
                                    <p className="text-sm text-gray-400">
                                        To buy and sell property shares, we require a government-issued ID for regulatory compliance.
                                    </p>
                                </div>
                                {/* Dynamic Content based on Status */}
                                <div className="space-y-6">

                                    {/* STATE: SUCCESS */}
                                    {status === 'success' ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-emerald-400 space-y-3">
                                            <CheckCircle size={48} />
                                            <h4 className="text-lg font-bold">Verification Complete!</h4>
                                            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
                                        </div>
                                    ) : (
                                        /* STATE: UPLOAD / IDLE */
                                        <>
                                            {/* File Upload Zone */}
                                            <label className={`
                                                flex flex-col items-center justify-center w-full h-44 
                                                border-2 border-dashed rounded-xl cursor-pointer 
                                                transition-colors duration-200
                                                ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/20 hover:border-emerald-400 hover:bg-white/5'}
                                            `}>
                                                <div className="flex flex-col items-center justify-center ">
                                                    {file ? (
                                                        <>
                                                            <FileText className="w-8 h-8 text-emerald-400 mb-2" />
                                                            <p className="text-sm text-gray-300 font-medium">{file.name}</p>
                                                            <p className="text-xs text-emerald-400 mt-1">Ready to submit</p>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-4 flex items-center flex-col">
                                                            <Upload className="w-8 h-8 text-gray-400" />
                                                            <p className="text-sm text-gray-400">
                                                                <span className="font-semibold text-white">Click to upload</span> or drag and drop
                                                            </p>
                                                            <p className="text-xs text-gray-500">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                />
                                            </label>

                                            {/* Action Button */}

                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    disabled={!file || status !== 'idle'}
                                    onClick={handleUploadAndMint}
                                    className="w-full inline-flex justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {status === 'uploading' ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" /> Uploading Document...
                                        </span>
                                    ) : status === 'minting' ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" /> Minting Soulbound ID...
                                        </span>
                                    ) : (
                                        "Submit Verification"
                                    )}
                                </button>
                                <button className="text-sm " onClick={() => router.push("/marketplace")}>I'll do this later</button>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
}