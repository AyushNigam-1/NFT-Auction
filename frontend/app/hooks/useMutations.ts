import { PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useProgramActions } from "./useProgramActions";
import { BN } from "@coral-xyz/anchor";
import { PropertyFormData } from "../types";

export const useMutations = () => {
    const programActions = useProgramActions()

    const createProperty = useMutation({
        mutationFn: async ({
            metadata,
            mintPubkey,
        }: {
            metadata: PropertyFormData;
            mintPubkey: PublicKey;
        }) => {
            // const txSig = await programActions.createProperty(
            //     totalShares,
            //     mintPubkey,
            // );

            // return { txSig };
        },
        onSuccess: (data) => {
            // console.log("Property created successfully! Tx:", data.txSig);
            // Optional: Show toast
            // toast.success("Property listed successfully!");
            // Invalidate/refetch relevant queries
            // queryClient.invalidateQueries({ queryKey: ["properties"] });
            // queryClient.invalidateQueries({ queryKey: ["userProperties"] });
        },
        onError: (error: any) => {
            console.error("Failed to create property:", error);
            // toast.error(error.message || "Failed to create property");
        },
    });
    return { createProperty }
}