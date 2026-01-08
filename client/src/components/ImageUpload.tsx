import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
    onUploadComplete: (url: string) => void;
    onUploadStart?: () => void;
    className?: string;
}

export function ImageUpload({ onUploadComplete, onUploadStart, className }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file",
                variant: "destructive",
            });
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image must be under 5MB",
                variant: "destructive",
            });
            return;
        }

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Auto upload
        uploadImage(file);
    };

    const uploadImage = async (file: File) => {
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

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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
            onUploadComplete(data.secure_url);
            setPreview(null); // Clear preview after successful upload (or keep it until sent?) 
            // Actually, better to keep plain logic: upload done -> parent handles URL
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload image",
                variant: "destructive",
            });
            setPreview(null);
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const cancelUpload = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            {preview ? (
                <div className="relative group">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-70"
                        />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={cancelUpload}
                        disabled={isUploading}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-10 h-10 hover:bg-white/5 active:scale-95 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Image className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
            )}
        </div>
    );
}
