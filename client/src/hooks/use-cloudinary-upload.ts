import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
    url: string;
    type: "image" | "file";
    publicId: string;
}

export function useCloudinaryUpload(onUploadComplete?: (data: UploadResult) => void) {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        // Optional: Trigger start callback if needed

        try {
            // 1. Get signature
            const sigRes = await fetch("/api/upload-signature");
            if (!sigRes.ok) throw new Error("Failed to get upload signature");
            const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

            if (!cloudName || !apiKey) {
                throw new Error("Cloudinary configuration missing on server");
            }

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                throw new Error(errorData.message || "Upload failed");
            }

            const data = await uploadRes.json();

            // Success
            // Determine type
            const type = data.resource_type === "image" ? "image" : "file";

            if (onUploadComplete) {
                onUploadComplete({
                    url: data.secure_url,
                    type,
                    publicId: data.public_id
                });
            }

            return {
                url: data.secure_url,
                type,
                publicId: data.public_id
            };

        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading };
}
