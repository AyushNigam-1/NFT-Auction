import { useMutation } from "@tanstack/react-query";
import { useProgramActions } from "./useProgramActions";
import { PropertyFormData } from "../types";
import { uploadFileToPinata, uploadMetadataToPinata } from "../utils/pinata";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import axios from "axios";

export const useMutations = () => {
    const programActions = useProgramActions();

    // Define the shape of your Dealer Config
    interface DealerConfig {
        paymentMint: PublicKey;  // e.g. USDC Mint
        buyPrice: number;        // e.g. 1.0
        sellPrice: number;       // e.g. 1.1
        maxShares: number;       // e.g. 100
    }

    const createProperty = useMutation({
        mutationFn: async ({
            metadata,
            mint
        }: {
            metadata: PropertyFormData;
            mint: string;
        }) => {
            try {
                console.log("Starting Upload Sequence...", metadata);

                // --- 1. IPFS Uploads ---
                const imageUploadPromises = metadata.images.map(async (img) => {
                    return img instanceof File ? await uploadFileToPinata(img) : null;
                });

                const documentUploadPromises = metadata.legal_documents.map(async (doc) => {
                    if (doc instanceof File) {
                        const cid = await uploadFileToPinata(doc);
                        return { cid, name: doc.name, type: doc.type };
                    }
                    return null;
                });

                const imageUrls = (await Promise.all(imageUploadPromises)).filter(url => url !== null);
                const documentUrls = (await Promise.all(documentUploadPromises)).filter(url => url !== null);

                // --- 2. Create Metadata JSON ---
                const offChainMetadata = {
                    name: metadata.name,
                    symbol: metadata.symbol,
                    description: metadata.description,
                    images: imageUrls,
                    attributes: metadata.attributes,
                    type: metadata.type,
                    rent: metadata.rent,
                    total_share: metadata.total_share,
                    total_value: metadata.total_value,
                    legal_documents: documentUrls
                };

                const metadataUri = await uploadMetadataToPinata(offChainMetadata);
                console.log("Metadata uploaded:", metadataUri);

                // --- 3. CALCULATE DERIVED FIELDS ---
                // Calculate Price in SOL (assuming inputs are in SOL)
                const basePrice = metadata.total_value / metadata.total_share;
                const calculatedMaxShares = Math.floor(metadata.total_share * 0.10);
                // --- 4. Call Smart Contract ---
                const txSig = await programActions.createProperty(
                    // Property Args
                    metadata.total_share,
                    new PublicKey(mint),
                    metadata.name,
                    imageUrls[0],
                    metadata.address,
                    basePrice, // Price per share
                    metadata.expected_yield,
                    metadataUri,

                    // Dealer Args (Direct SOL)
                    basePrice,         // Base Price
                    20 // Max Shares
                );

                return { txSig, metadataUri };

            } catch (error) {
                console.error("Create Property Sequence Failed:", error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log("Success! Tx:", data.txSig);
        },
        onError: (error: any) => {
            console.error("Failed:", error);
        },
    });

    type VerifyUserInput = {
        walletAddress: string;
        files: File[];
    };
    type CreateVerificationPayload = {
        walletAddress: string;
        documentUris: string[];
    };

    const createVerificationRequest = useMutation({
        mutationFn: async ({ walletAddress, files }: VerifyUserInput) => {
            if (!files.length) {
                throw new Error("No documents provided");
            }

            // 1️⃣ Upload all files to Pinata (parallel)
            const documentUris = await Promise.all(
                files.map((file) => uploadFileToPinata(file))
            );

            // 2️⃣ Convert to ipfs:// URIs
            // 3️⃣ Call backend
            console.log(documentUris, walletAddress)
            const { data } = await axios.post("http://127.0.0.1:3001/api/verify", {
                wallet_address: walletAddress,
                document_uris: documentUris,
            });
            return data
        },
    });


    interface ReviewVerificationPayload {
        approve: boolean;
        review_reason: string | null;
    }

    const reviewVerification = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: ReviewVerificationPayload }) => {
            // 2. PATCH request matching your Axum route: "/admin/verify/{id}"
            console.log(id, payload)

            const res = await axios.patch(
                `http://127.0.0.1:3001/api/admin/verify/${id}`,
                payload
            );
            console.log(res)
            return res.data;
        },
        // 3. On success, refresh the list automatically
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
        },
        onError: (error) => {
            console.error("Verification review failed:", error);
        },
    });


    const deleteProperty = useMutation({
        // mutationKey: ["deleteProperty"],
        retry: 0,
        // The actual function call
        mutationFn: async (mintPubkey: PublicKey) => {
            console.log("🔥 MUTATION FIRED at:", new Date().toISOString()); // <--- Add this
            const tx = await programActions.deleteProperty(mintPubkey);
            return tx;
        },

        // ✅ What to do when successful
        onSuccess: (signature) => {
            console.log("Deletion confirmed:", signature);
            // toast.success("Property deleted successfully!");

            // 🔄 Refresh the list of properties automatically
            // queryClient.invalidateQueries({ queryKey: ["properties"] });
        },

        // ❌ What to do on error
        onError: (error: any) => {
            console.error("Deletion failed:", error);

            // Extract a readable error message if possible
            const message = error.message?.includes("0x1771") // specific constraint error code?
                ? "You are not the owner of this property."
                : "Failed to delete property. Check console.";

            // toast.error(message);
        },
    });

    const depositRent = useMutation({
        mutationFn: async (sol: number) => await programActions.depositRent(sol),
        onSuccess: () => {
            // toast.success("Shares cancelled successfully");
            // queryClient.invalidateQueries({ queryKey: ["my-shares"] });
        },
        onError: (err) => {
            console.error(err);
            // toast.error("Failed to cancel shares");
        }
    });

    const claimYield = useMutation({
        mutationFn: async ({ mint, property }: { mint: PublicKey, property: PublicKey }) => await programActions.claimYield(mint,       // The mint of the share tokens
            property),
        onSuccess: () => {
            // toast.success("Shares cancelled successfully");
            // queryClient.invalidateQueries({ queryKey: ["my-shares"] });
        },
        onError: (err) => {
            console.error(err);
            // toast.error("Failed to cancel shares");
        }
    });
    const cancelShares = useMutation({
        mutationFn: async (shareHolderPubkey: PublicKey) => await programActions.forceCloseShareholder(shareHolderPubkey),
        onSuccess: () => {
            // toast.success("Shares cancelled successfully");
            // queryClient.invalidateQueries({ queryKey: ["my-shares"] });
        },
        onError: (err) => {
            console.error(err);
            // toast.error("Failed to cancel shares");
        }
    });
    const buyShares = useMutation({
        mutationFn: async ({
            propertyPubkey,
            shares,
            monthlyRent,
            paidSol,
            mintAddress,
            owner,
        }: {
            propertyPubkey: PublicKey;
            shares: number | BN;
            monthlyRent: number;
            paidSol: number | BN;
            mintAddress: PublicKey,
            owner: PublicKey,
        }) => {
            console.log("shares", shares)

            const txSig = await programActions.buyShares(
                propertyPubkey,
                new BN(monthlyRent),
                new BN(shares),
                new BN(paidSol),
                mintAddress,
                owner,
            );

            return { txSig };
        },

        onSuccess: (data, variables) => {
            // toast.dismiss();
            // toast.success(`Shares bought! Tx: ${data.txSig.slice(0, 8)}...`);

            // // Invalidate/refetch related queries
            // queryClient.invalidateQueries({ queryKey: ["property", variables.propertyPubkey.toBase58()] });
            // queryClient.invalidateQueries({ queryKey: ["userBalance"] });
            // queryClient.invalidateQueries({ queryKey: ["properties"] });
        },

        onError: (error: any) => {
            // toast.dismiss();
            // const msg = error.message || "Failed to buy shares";
            // toast.error(msg.includes("insufficient funds") ? "Insufficient SOL balance" : msg);
            // console.error("Buy shares error:", error);
        },
    });
    return { createProperty, deleteProperty, buyShares, cancelShares, depositRent, claimYield, createVerificationRequest, reviewVerification }
}