import { format } from "date-fns";
import { Message } from "@shared/schema";
import { CheckCheck } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
}

export default function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  // Format timestamp
  const timestamp = message.createdAt 
    ? format(new Date(message.createdAt), "h:mm a")
    : format(new Date(), "h:mm a");
  
  return (
    <div className={`flex items-end mb-4 animate-fade-in ${isCurrentUser ? 'justify-end' : ''}`}>
      <div className={`flex flex-col max-w-[80%] space-y-1 ${isCurrentUser ? 'items-end' : ''}`}>
        {!isCurrentUser && (
          <div className="text-xs text-gray-500 ml-2">{message.username}</div>
        )}
        
        <div className={`message ${
          isCurrentUser 
            ? 'bg-gradient-to-r from-[#E6F0FF] to-[#EBF3FF] rounded-tr-none border-t border-r border-[#D0E1FA]' 
            : 'bg-gradient-to-r from-[#F5F7FA] to-[#F9FAFB] rounded-tl-none border-t border-l border-[#E2E8F0]'
          } py-2 px-4 rounded-2xl shadow-sm`}
        >
          <p>{message.content}</p>
        </div>
        
        <div className={`text-xs text-gray-400 ${isCurrentUser ? 'mr-2 flex items-center space-x-1' : 'ml-2'}`}>
          <span>{timestamp}</span>
          {isCurrentUser && <CheckCheck className="h-3 w-3 text-[hsl(var(--primary))]" />}
        </div>
      </div>
    </div>
  );
}
