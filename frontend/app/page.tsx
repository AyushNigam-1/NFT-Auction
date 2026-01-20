"use client";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { ShieldCheck, Building2, TrendingUp, Lock, Wallet } from "lucide-react";

const LoginPage = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  useEffect(() => {
    // if (connected && publicKey) {
    //   router.push("/properties");
    // }
  }, [connected, publicKey, router]);

  const handleAction = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true); // Opens the official selection modal
    }
  };
  return (
    <div className="relative w-full h-screen bg-[#171717] flex items-center justify-center font-mono">
      <div className="absolute inset-0 z-0 opacity-20" />
      <motion.div
        className="relative z-10 w-full max-w-md p-8 space-y-8 rounded-[2.5rem] bg-[#121212] border border-white/5 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center">
          <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
            <Building2 className="w-10 h-10 text-emerald-300" />
          </div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white tracking-tight">YieldHome </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Secure on-chain real estate ownership. <br />
            Connect to manage your shares and yield.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: <ShieldCheck className="w-5" />, text: "Verified Asset Ownership" },
            { icon: <TrendingUp className="w-5" />, text: "Real-time Yield Distribution" },
            { icon: <Lock className="w-5" />, text: "Non-Custodial Security" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5 text-sm text-gray-400">
              <span className="text-emerald-400">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAction}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-2xl 
                 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Wallet className="w-5 h-5" />
              {connected ? (
                <span>{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</span>
              ) : (
                "Connect Your Wallet"
              )}
            </motion.button>
          </motion.div>

          {/* <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
            <ShieldCheck className="w-3 h-3" />
            Powered by Solana Network
          </div> */}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;