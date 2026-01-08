import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Message, User, ActiveUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDropzone } from "react-dropzone";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { FileUpload } from "@/components/FileUpload";
import { MessageBubble } from "@/components/MessageBubble";
import { Hash, LogOut, Send, Users, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatRoom() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get user info from session
  const username = sessionStorage.getItem("username");
  const userId = parseInt(sessionStorage.getItem("userId") || "0");

  const { data: activeUsers = [] } = useQuery<ActiveUser[]>({
    queryKey: [`/api/rooms/${roomId}/users`],
    enabled: !!roomId,
    refetchInterval: 10000,
  });

  // Fetch existing messages
  const { data: initialMessages } = useQuery<Message[]>({
    queryKey: [`/api/rooms/${roomId}/messages`],
    enabled: !!roomId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!username || !roomId) {
      setLocation("/");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Join room
      ws.send(JSON.stringify({
        type: "join",
        roomId: parseInt(roomId),
        user: { id: userId, username }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === "activeUsers") {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/users`] });
      }
    };

    ws.onclose = () => {
      toast({
        title: "Disconnected",
        description: "Connection to the hall was lost",
        variant: "destructive",
      });
      setLocation("/");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId, username, userId, setLocation, toast]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.send(JSON.stringify({
      type: "message",
      roomId: parseInt(roomId!),
      message: {
        userId,
        username,
        content: inputMessage,
        type: "text"
      }
    }));

    setInputMessage("");
  };

  const handleUploadComplete = (url: string, type: "image" | "file", publicId: string) => {
    if (!socket) return;

    socket.send(JSON.stringify({
      type: "message",
      roomId: parseInt(roomId!),
      message: {
        userId,
        username,
        content: url,
        type,
        filePublicId: publicId
      }
    }));
  };

  const handleLogout = () => {
    sessionStorage.clear();
    socket?.close();
    setLocation("/");
  };

  // --- Global Drag & Drop & Upload Logic ---
  const { uploadFile, isUploading } = useCloudinaryUpload((data) => {
    handleUploadComplete(data.url, data.type, data.publicId);
  });

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Must be under 10MB", variant: "destructive" });
      return;
    }
    toast({ title: "Uploading...", description: "Sending your file to the hall." });
    await uploadFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Click disables standard file picker on the whole screen (we want buttons to work)
    noKeyboard: true
  });

  return (
    <div {...getRootProps()} className="flex flex-col h-screen bg-background overflow-hidden relative outline-none">
      <input {...getInputProps()} className="hidden" />

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-primary border-dashed m-4 rounded-[2rem]">
          <div className="flex flex-col items-center gap-4 animate-bounce">
            <div className="p-6 bg-primary/20 rounded-full">
              <Send className="w-12 h-12 text-primary rotate-[-45deg] mb-1 mr-1" />
            </div>
            <h2 className="text-3xl font-bold text-primary">Drop to Send</h2>
            <p className="text-muted-foreground">Release to upload your file instantly</p>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="glass h-16 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight tracking-tight">
              Hall {roomId}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              {activeUsers.length} active Vikings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex -space-x-2">
            {activeUsers.slice(0, 3).map((u, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-medium"
                title={u.username}
              >
                {u.username[0].toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 md:p-6 z-0">
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full pb-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 text-muted-foreground/50"
              >
                <Hash className="w-16 h-16 opacity-20" />
                <p>The hall is quiet... waiting for tales.</p>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id || Math.random()}
                  message={msg}
                  isCurrentUser={msg.username === username}
                />
              ))
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 md:p-6 pt-2 z-10">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex items-end gap-3 glass rounded-[2rem] p-2 pr-3 shadow-lg"
          >
            <FileUpload
              onUploadComplete={handleUploadComplete}
              onUploadStart={() => toast({ title: "Uploading attachment...", duration: 2000 })}
              className="shrink-0"
            />

            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 h-auto max-h-32 min-h-[44px]"
            />

            <Button
              type="submit"
              size="icon"
              className={inputMessage.trim() ? "bg-primary hover:bg-primary/90 rounded-full w-10 h-10 shrink-0" : "bg-muted text-muted-foreground rounded-full w-10 h-10 shrink-0 pointer-events-none opacity-50"}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
