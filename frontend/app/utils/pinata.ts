
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!, // Use JWT (recommended)
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!, // e.g., "mydomain.mypinata.cloud"
});

export const uploadToPinata = async (file: File): Promise<string> => {
    try {
        const file = new File(["hello"], "Testing.txt", { type: "text/plain" });
        const upload = await pinata.upload.public.file(file);
        return upload.cid;
    } catch (error) {
        console.error("Image upload failed:", error);
        throw new Error("Failed to upload image to Pinata");
    }
};