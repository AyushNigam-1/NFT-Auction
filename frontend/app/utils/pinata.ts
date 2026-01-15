import axios from "axios";
import { PropertyFormData } from "../types";

export const uploadFileToPinata = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post("/api/file", formData, {
        headers: {
            "Content-Type": "multipart/form-data", // Explicitly set this for clarity
        },
    });
    const fullUrl = response.data.url;
    const cid = fullUrl.split("/ipfs/").pop() || "";
    return cid;
};

export const uploadMetadataToPinata = async (metadata: any): Promise<string> => {
    const response = await axios.post("/api/json", metadata);
    const fullUrl = response.data.url;
    const cid = fullUrl.split("/ipfs/").pop() || "";
    return cid;
};

export async function fetchPropertyMetadata(uri: string): Promise<PropertyFormData | undefined> {
    try {
        console.log("triggering")
        const response = await fetch(`https://gold-endless-fly-679.mypinata.cloud/ipfs/${uri}`);
        console.log("fetched URI", response)

        if (!response.ok) throw new Error(`Status ${response.status}`);
        const metadata = await response.json();
        return metadata;
    } catch (error) {
        console.warn(`⚠️ Failed to fetch metadata from ${uri}`, error);
    }
}