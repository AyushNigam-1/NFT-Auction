import { useMutation } from "@tanstack/react-query";
import { useProgramActions } from "./useProgramActions";
import { PropertyFormData } from "../types";
import { uploadFileToPinata, uploadMetadataToPinata } from "../utils/pinata";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const useMutations = () => {
    const programActions = useProgramActions()

    const createProperty = useMutation({
        mutationFn: async ({
            metadata,
            mint
        }: {
            metadata: PropertyFormData;
            mint?: string
        }) => {
            try {
                console.log(metadata)
                const imageUploadPromises = metadata.images.map(async (img) => {
                    if (img instanceof File) {
                        return await uploadFileToPinata(img);
                    }
                    return null; // Handle cases where it might not be a file
                });
                console.log("Uploading legal_documents...");
                const documentUploadPromises = metadata.legal_documents.map(async (doc) => {
                    if (doc instanceof File) {
                        const cid = await uploadFileToPinata(doc);
                        return {
                            cid,
                            name: doc.name,
                            type: doc.type
                        };
                    }
                    return null; // Handle cases where it might not be a file
                });

                const imageUrls = (await Promise.all(imageUploadPromises)).filter(url => url !== null);
                const documentUrls = (await Promise.all(documentUploadPromises)).filter(url => url !== null);

                const offChainMetadata = {
                    name: metadata.name,
                    symbol: metadata.symbol,
                    description: metadata.description,
                    images: imageUrls, // The IPFS URL we just got
                    attributes: metadata.attributes, // Your trait_type/value array
                    type: metadata.type,
                    rent: metadata.rent,
                    total_share: metadata.total_share,
                    total_value: metadata.total_value,
                    legal_documents: documentUrls // Store document URLs clearly here
                };

                const metadataUri = await uploadMetadataToPinata(offChainMetadata);
                console.log("Uploading metadata JSON...", metadataUri);

                // https://gold-endless-fly-679.mypinata.cloud/ipfs/bafkreic5pezhgydaxpv2wvuhphkfjtrpfsk2n45ozmkucdtrb6gggfzy3m
                const txSig = await programActions.createProperty(
                    metadata.total_share,
                    new PublicKey("qsKv7R4yhPanCgBcgLmH9gBcnWTbw2ANLoMvTZD3JTi"),
                    metadata.name,
                    imageUrls[0],
                    metadata.address,
                    metadata.total_value / metadata.total_share,
                    metadata.expected_yield,
                    metadataUri
                );

                return { txSig, metadataUri };

            } catch (error) {
                console.error("Upload sequence failed:", error);
                throw error;
            }
        },
        onSuccess: (data) => {
            // console.log("Property metadata uploaded successfully:", data.metadataUri);
            // toast.success("Assets uploaded and Property created!");
        },
        onError: (error: any) => {
            console.error("Failed to create property:", error);
            // toast.error("Failed to upload assets.");
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
            paidSol,
            mintAddress,
            owner,
        }: {
            propertyPubkey: PublicKey;
            shares: number | BN;
            paidSol: number | BN;
            mintAddress: PublicKey,
            owner: PublicKey,
        }) => {
            console.log("shares", shares)
            const txSig = await programActions.buyShares(
                propertyPubkey,
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
    return { createProperty, deleteProperty, buyShares, cancelShares }
}