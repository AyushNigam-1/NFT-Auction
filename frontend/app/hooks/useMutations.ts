import { useMutation } from "@tanstack/react-query";
import { useProgramActions } from "./useProgramActions";
import { PropertyFormData } from "../types";
import { uploadFileToPinata, uploadMetadataToPinata } from "../utils/pinata";
import { PublicKey } from "@solana/web3.js";

export const useMutations = () => {
    const programActions = useProgramActions()

    const createProperty = useMutation({
        mutationFn: async ({
            metadata,
            totalShares = 100,
            mint
        }: {
            metadata: PropertyFormData;
            totalShares?: number
            mint?: string
        }) => {
            try {
                // let mainImageUrl = "";
                // if (metadata.image && metadata.image instanceof File) {
                //     console.log("Uploading main image...");
                //     mainImageUrl = await uploadFileToPinata(metadata.image);
                // } else if (typeof metadata.image === 'string') {
                //     mainImageUrl = metadata.image;
                // }

                // console.log("Uploading documents...");
                // const documentUploadPromises = metadata.documents.map(async (doc) => {
                //     if (doc instanceof File) {
                //         return await uploadFileToPinata(doc);
                //     }
                //     return null; // Handle cases where it might not be a file
                // });

                // const documentUrls = (await Promise.all(documentUploadPromises)).filter(url => url !== null);

                // const onChainMetadata = {
                //     name: metadata.name,
                //     symbol: metadata.symbol,
                //     description: metadata.description,
                //     image: mainImageUrl, // The IPFS URL we just got
                //     attributes: metadata.attributes, // Your trait_type/value array
                //     address: metadata.address,
                //     total_value_inr: metadata.total_value_inr,
                //     expected_yield: metadata.expected_yield,
                //     legal_documents: documentUrls // Store document URLs clearly here
                // };

                // console.log("Uploading metadata JSON...");
                // const metadataUri = await uploadMetadataToPinata(onChainMetadata);

                // console.log("Final Metadata URI:", metadataUri);
                // https://gold-endless-fly-679.mypinata.cloud/ipfs/bafkreic5pezhgydaxpv2wvuhphkfjtrpfsk2n45ozmkucdtrb6gggfzy3m
                const txSig = await programActions.createProperty(
                    totalShares,
                    new PublicKey("qsKv7R4yhPanCgBcgLmH9gBcnWTbw2ANLoMvTZD3JTi"),
                    metadata.name,
                    "https://gold-endless-fly-679.mypinata.cloud/ipfs/bafkreib4zxgg2ecg7nahjocwoja7tpqflsrl7yug4c2zw2lm2nkgvoqroq",
                    metadata.description,
                    metadata.expected_yield,
                    "https://gold-endless-fly-679.mypinata.cloud/ipfs/bafkreic5pezhgydaxpv2wvuhphkfjtrpfsk2n45ozmkucdtrb6gggfzy3m",
                );

                // return { txSig, metadataUri };

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
        mutationKey: ["deleteProperty"],

        // The actual function call
        mutationFn: async (mintPubkey: PublicKey) => {
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
    return { createProperty, deleteProperty }
}