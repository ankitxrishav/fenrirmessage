import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Message, ActiveUser } from "@shared/schema";
import { useChat } from "@/hooks/useChat";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import ChatMessage from "@/components/ChatMessage";
import SystemMessage from "@/components/SystemMessage";
import TypingIndicator from "@/components/TypingIndicator";

export default function ChatRoom() {
  const [match, params] = useRoute("/chat/:roomId");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  
  // Get username and password from session storage
  const username = sessionStorage.getItem("chatUsername");
  const password = sessionStorage.getItem("chatRoomPassword");
  const roomId = params?.roomId ? parseInt(params.roomId) : null;
  
  // Redirect if no username, password or invalid roomId
  useEffect(() => {
    if (!username || !password || !roomId || isNaN(roomId)) {
      toast({
        title: "Authentication error",
        description: "Please enter chat credentials again",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [username, password, roomId, navigate, toast]);
  
  // Fetch existing messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });
  
  // Connect to chat WebSocket
  const { 
    messages: wsMessages, 
    sendMessage,
    sendTypingStatus,
    userJoined,
    userLeft,
    activeUsers,
    connected
  } = useChat(roomId as number, username as string);
  
  // Combine fetched and WebSocket messages
  const allMessages = [...messages, ...wsMessages];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [allMessages, typingUsers]);
  
  // Update typing users
  useEffect(() => {
    const typingTimeouts: Record<string, NodeJS.Timeout> = {};
    
    // Handler for typing events
    const handleTyping = (user: string, isTyping: boolean) => {
      if (user === username) return;
      
      // Clear existing timeout for this user if it exists
      if (typingTimeouts[user]) {
        clearTimeout(typingTimeouts[user]);
      }
      
      if (isTyping) {
        setTypingUsers(prev => prev.includes(user) ? prev : [...prev, user]);
        
        // Auto-clear typing indicator after 3 seconds
        typingTimeouts[user] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== user));
        }, 3000);
      } else {
        setTypingUsers(prev => prev.filter(u => u !== user));
      }
    };
    
    // Subscribe to typing events
    document.addEventListener("user-typing", ((e: CustomEvent) => {
      handleTyping(e.detail.username, e.detail.isTyping);
    }) as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener("user-typing", ((e: CustomEvent) => {
        handleTyping(e.detail.username, e.detail.isTyping);
      }) as EventListener);
      
      // Clear all timeouts
      Object.values(typingTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [username]);
  
  // Update active users count
  useEffect(() => {
    setActiveUsersCount(activeUsers.length);
  }, [activeUsers]);
  
  // Handle leave room
  const handleLeaveRoom = () => {
    if (window.confirm("Are you sure you want to leave this chat room?")) {
      sessionStorage.removeItem("chatUsername");
      sessionStorage.removeItem("chatRoomPassword");
      navigate("/");
    }
  };
  
  if (!username || !roomId) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-screen">
      <ChatHeader 
        roomId={roomId} 
        activeUsersCount={activeUsersCount} 
        onLeave={handleLeaveRoom} 
      />
      
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 messages-container bg-gradient-to-br from-[#F7FAFD] to-[#F0F7FF]"
      >
        {/* Add date indicator */}
        <SystemMessage text={`Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
        
        {/* Show join message for current user */}
        {connected && <SystemMessage text={`You entered the Hall of Fenrir`} />}
        
        {/* Map user join events */}
        {userJoined.map((user, index) => (
          <SystemMessage key={`join-${user}-${index}`} text={`${user} has entered the hall`} />
        ))}
        
        {/* Map user leave events */}
        {userLeft.map((user, index) => (
          <SystemMessage key={`leave-${user}-${index}`} text={`${user} has departed from the hall`} />
        ))}
        
        {/* Map all messages */}
        {allMessages.map((message, index) => (
          <ChatMessage 
            key={message.id || `temp-${index}`}
            message={message}
            isCurrentUser={message.username === username}
          />
        ))}
        
        {/* Typing indicators */}
        {typingUsers.map(user => (
          <TypingIndicator key={`typing-${user}`} username={user} />
        ))}
      </div>
      
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={sendTypingStatus}
      />
    </div>
  );
}
