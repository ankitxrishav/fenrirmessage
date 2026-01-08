import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

interface FileUploadProps {
    onUploadComplete: (url: string, type: "image" | "file", publicId: string) => void;
    onUploadStart?: () => void;
    className?: string;
}

export function FileUpload({ onUploadComplete, onUploadStart, className }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Size validation (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "File must be under 10MB",
                variant: "destructive",
            });
            return;
        }

        uploadFile(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        multiple: false
    });

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        onUploadStart?.();

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
            // Auto-detect resource type (image vs raw/video)
            // But we'll force 'auto' to let Cloudinary decide
            // Actually, for raw files we might need specific handling if we want them downloadable as attachments
            // Let's rely on auto for now.

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

            onUploadComplete(data.secure_url, type, data.public_id);

        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload file",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <div {...getRootProps()} className={cn(
                "cursor-pointer transition-all rounded-full p-2 outline-none focus:ring-2 focus:ring-primary/50",
                isDragActive ? "bg-primary/20 scale-110" : "hover:bg-white/5"
            )}>
                <input {...getInputProps()} />
                {isUploading ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                    <Paperclip className={cn("w-5 h-5 text-muted-foreground transition-colors", isDragActive ? "text-primary" : "hover:text-primary")} />
                )}
            </div>

            {/* Drag Overlay (Optional: could assume the dropzone is just the button, 
                or we can wrap the entire chat input. For now, button based dropzone is safest UI wise) 
                User asked for drag and drop in chat box. 
                I will enhance ChatRoom to wrap the whole input area later.
            */}
        </div>
    );
}
