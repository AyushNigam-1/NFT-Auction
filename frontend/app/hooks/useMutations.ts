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
    return { createProperty }
}