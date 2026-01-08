import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "./ui/button";

interface MessageBubbleProps {
    message: {
        username: string;
        content: string;
        type?: string;
        createdAt: string | Date;
    };
    isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div
            className={cn(
                "flex w-full animate-message mb-4",
                isCurrentUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "flex flex-col max-w-[70%] md:max-w-[60%]",
                    isCurrentUser ? "items-end" : "items-start"
                )}
            >
                <span className="text-xs text-muted-foreground mb-1 px-2">
                    {message.username} • {format(new Date(message.createdAt), "h:mm a")}
                </span>

                {message.type === "image" ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <div
                                className={cn(
                                    "overflow-hidden rounded-2xl cursor-pointer transition-transform hover:scale-[1.02]",
                                    isCurrentUser ? "bg-primary/20" : "bg-secondary",
                                    "border border-white/5"
                                )}
                            >
                                {!imageLoaded && (
                                    <div className="w-64 h-48 bg-muted animate-pulse rounded-2xl" />
                                )}
                                <img
                                    src={message.content}
                                    alt="Shared image"
                                    className={cn(
                                        "max-w-full md:max-w-sm max-h-[400px] object-cover rounded-2xl",
                                        !imageLoaded && "hidden"
                                    )}
                                    onLoad={() => setImageLoaded(true)}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="rounded-full w-8 h-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(message.content, "_blank");
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full p-0 bg-black/90 border-white/10 backdrop-blur-xl overflow-hidden">
                            <img
                                src={message.content}
                                alt="Shared image full"
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        </DialogContent>
                    </Dialog>
                ) : message.type === "file" ? (
                    <div
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white/10 cursor-pointer",
                            isCurrentUser
                                ? "bg-primary/20 border border-primary/20 text-primary-foreground"
                                : "bg-secondary/80 border border-white/5 text-secondary-foreground"
                        )}
                        onClick={() => window.open(message.content, "_blank")}
                    >
                        <div className="p-2 rounded-full bg-background/20">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium underline decoration-dotted underline-offset-4">
                                Attachment
                            </span>
                            <span className="text-xs opacity-70">Click to download</span>
                        </div>
                        <Download className="w-4 h-4 opacity-50" />
                    </div>
                ) : (
                    <div
                        className={cn(
                            "px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm text-sm md:text-base break-words",
                            isCurrentUser
                                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-tr-sm"
                                : "bg-secondary/80 text-secondary-foreground rounded-tl-sm border border-white/5"
                        )}
                    >
                        {message.content}
                    </div>
                )}
            </div>
        </div>
    );
}
