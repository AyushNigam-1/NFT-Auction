import { useWallet, useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { AnchorProvider, setProvider, Program, Idl } from "@coral-xyz/anchor";

// 1. IMPORT BOTH IDLS
import yieldIdl from "../target/idl/yieldhome.json";
import identityIdl from "../target/idl/identity_registry.json";

// Import Types (If you generated types with Anchor)
import { Yieldhome } from "../target/types/yieldhome";
import { IdentityRegistry } from "../target/types/identity_registry"; // Uncomment if you have types

export const usePrograms = () => {
    const { connection } = useConnection();
    const { wallet, publicKey, sendTransaction, disconnect } = useWallet();
    const anchorWallet = useAnchorWallet();

    // 2. DEFINE PROGRAM IDs
    const YIELD_PROGRAM_ID = new PublicKey(yieldIdl.address);
    const IDENTITY_PROGRAM_ID = new PublicKey(identityIdl.address);

    // 3. SETUP PROVIDER (Shared by both programs)
    const provider = useMemo(() => {
        if (!wallet || !publicKey || !anchorWallet) return null;
        return new AnchorProvider(connection, anchorWallet, {
            commitment: "confirmed",
        });
    }, [connection, wallet, publicKey, anchorWallet]);

    // 4. INITIALIZE YIELD HOME PROGRAM
    const yieldProgram = useMemo(() => {
        if (!provider) return null;
        setProvider(provider); // Set global provider
        return new Program<Yieldhome>(yieldIdl as any, provider);
    }, [provider]);

    // 5. INITIALIZE IDENTITY REGISTRY PROGRAM (New!)
    const identityProgram = useMemo(() => {
        if (!provider) return null;
        // Use <Idl> or <IdentityRegistry> if you have the types generated
        return new Program<IdentityRegistry>(identityIdl as any, provider);
    }, [provider]);

    // ---------------------------------------------------------
    // HELPERS: Yield Home
    // ---------------------------------------------------------
    const PDA_SEEDS = [new TextEncoder().encode("escrow")];

    const getEscrowStatePDA = (initializerKey: PublicKey, uniqueSeed: Buffer) => {
        const [escrowStatePDA] = PublicKey.findProgramAddressSync(
            [...PDA_SEEDS, initializerKey.toBuffer(), uniqueSeed],
            YIELD_PROGRAM_ID
        );
        return escrowStatePDA;
    };

    const getVaultPDA = (escrowStatePDA: PublicKey) => {
        const [vaultAccountPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), escrowStatePDA.toBuffer()],
            YIELD_PROGRAM_ID
        );
        return vaultAccountPDA;
    }

    const getGlobalStatsPDA = () => {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("global_stats")],
            YIELD_PROGRAM_ID
        );
        return pda;
    };

    // ---------------------------------------------------------
    // HELPERS: Identity Registry (Soulbound)
    // ---------------------------------------------------------
    const getKycMintPDA = () => {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("kyc_mint")], // Must match seeds in Rust
            IDENTITY_PROGRAM_ID
        );
        return pda;
    };

    return {
        // Base Wallet/Connection
        wallet,
        publicKey: anchorWallet?.publicKey,
        connection,
        anchorWallet,
        provider,
        sendTransaction,
        disconnect,

        // Yield Home Stuff
        yieldProgram,
        YIELD_PROGRAM_ID,
        getVaultPDA,
        getEscrowStatePDA,
        getGlobalStatsPDA,

        // Identity Registry Stuff
        identityProgram,
        IDENTITY_PROGRAM_ID,
        getKycMintPDA, // <--- Use this to check if a user is verified
    };
};