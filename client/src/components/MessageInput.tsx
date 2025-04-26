import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage("");
      
      // Clear typing status
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing status
    onTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };
  
  return (
    <div className="bg-[#F7FAFD] border-t border-gray-200 p-3">
      <div className="flex items-center space-x-2">
        <div className="flex-grow">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Send a message to the hall..."
            className="w-full px-4 py-2 rounded-full border border-[#D0E1FA] focus:ring-2 focus:ring-[hsl(var(--fenrir-blue))] focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <Button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-[hsl(var(--fenrir-blue))] to-[hsl(var(--primary))] hover:from-[#0D4B94] hover:to-[#1648A5] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
