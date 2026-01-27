"use client"
import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Copy, FileText, CheckCircle, XCircle, Clock, User } from "lucide-react"; // Assuming you use Lucide or similar icons
import Header from "@/app/components/ui/layout/Header";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "@/app/components/ui/layout/Loader";

// Types based on your JSON
interface VerificationRequest {
    id: string;
    wallet_address: string;
    status: "pending" | "approved" | "rejected";
    requested_at: string;
    document_uris: string[];
}

const VerificationDashboard = () => {
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["verification-requests"],
        queryFn: async (): Promise<VerificationRequest[]> => {
            // simulating your API call
            const res = await axios.get("http://127.0.0.1:3001/api/admin/verify");
            return res.data;
        },
    });
    const { reviewVerification } = useMutations()
    // Helper to format dates
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Helper to truncate wallet
    const shortenAddress = (addr: string) =>
        `${addr.slice(0, 4)}...${addr.slice(-4)}`;

    if (isLoading) return <div className="p-8 text-green-400 font-mono">Loading requests...</div>;

    return (
        <div className="flex-1 min-h-screen text-gray-200 font-mono space-y-4 ">
            {/* Header */}
            <Header title="Requests" refetch={refetch} isFetching={isFetching} />

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.map((req) => (
                    <div
                        key={req.id}
                        className="bg-white/5 rounded-xl p-4 flex flex-col space-y-3 hover:border-gray-700 transition-colors"
                    >
                        {/* Card Header: Status & Time */}
                        <div className="flex justify-between items-center">
                            <span className={`
                px-2 py-1 text-xs rounded-lg  
                ${req.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' : ''}
                ${req.status === 'approved' ? 'bg-green-900/20 text-green-500' : ''}
                                ${req.status === 'rejected' ? ' bg-red-900/20 text-red-500' : ''}

              `}>
                                {req.status.toUpperCase()}
                            </span>
                            <div className="flex items-center text-xs text-gray-500 gap-1">
                                <Clock size={12} />
                                {formatDate(req.requested_at)}
                            </div>
                        </div>

                        {/* <div className='h-0.5 w-full bg-white/10' /> */}

                        <p className="text-sm text-gray-400 font-semibold">Wallet Address</p>
                        <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl ">
                            <User className="size-5" />
                            <span className=" font-semibold tracking-wide">
                                {shortenAddress(req.wallet_address)}
                            </span>
                            <button
                                className="ml-auto text-gray-500 hover:text-green-400 transition-colors"
                                onClick={() => navigator.clipboard.writeText(req.wallet_address)}
                            >
                                <Copy size={14} />
                            </button>
                        </div>


                        {/* Documents Section */}
                        <p className="text-sm text-gray-400 font-semibold">Documents Submitted</p>
                        <div className="flex flex-wrap gap-2">
                            {req.document_uris.map((uri, index) => (
                                <a
                                    key={index}
                                    href={`https://ipfs.io/ipfs/${uri}`} // Assuming IPFS hash
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 font-semibold text-sm bg-white/5 hover:bg-[#333] px-4 py-2 rounded-lg text-green-400 border border-transparent hover:border-green-900 transition-all"
                                >
                                    <FileText size={16} />
                                    <span>View Doc {index + 1}</span>
                                </a>
                            ))}
                        </div>
                        <div className='h-0.5 w-full bg-white/10' />

                        {/* Action Footer */}
                        <div className=" grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center  gap-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 py-2 rounded-lg text-sm transition-colors" onClick={() => reviewVerification.mutate({ id: req.id, payload: { approve: false, review_reason: "" } })} >
                                {(reviewVerification.isPending && !reviewVerification.variables.payload.approve) ? <Loader /> : <XCircle size={16} />}
                                Reject
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-green-900/20 text-green-400 hover:bg-green-900/40 py-2 rounded-lg text-sm transition-colors" onClick={() => reviewVerification.mutate({ id: req.id, payload: { approve: true, review_reason: "" } })}>
                                {(reviewVerification.isPending && reviewVerification.variables.payload.approve) ? <Loader /> : <CheckCircle size={16} />}
                                Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VerificationDashboard;