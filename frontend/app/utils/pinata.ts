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

    return response.data.url;
};

export const uploadMetadataToPinata = async (metadata: any): Promise<string> => {
    const response = await axios.post("/api/json", metadata);

    return response.data.url;
};

export async function fetchPropertyMetadata(uri: string): Promise<PropertyFormData | undefined> {
    try {
        console.log("triggering")
        const response = await fetch(uri);
        console.log("fetched URI", response)

        if (!response.ok) throw new Error(`Status ${response.status}`);
        const metadata = await response.json();
        return metadata;
    } catch (error) {
        console.warn(`⚠️ Failed to fetch metadata from ${uri}`, error);
    }
}