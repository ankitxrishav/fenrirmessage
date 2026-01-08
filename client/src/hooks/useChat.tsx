import { useState, useEffect, useCallback } from "react";
import { Message, ChatEvent } from "@shared/schema";

export function useChat(roomId: number, username: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ username: string }[]>([]);
  const [userJoined, setUserJoined] = useState<string[]>([]);
  const [userLeft, setUserLeft] = useState<string[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!roomId || !username) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);

      // Join chat room
      ws.send(JSON.stringify({
        type: "join",
        roomId,
        user: { username }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "message":
          setMessages(prev => [...prev, data.message]);
          break;

        case "join":
          if (data.user.username !== username) {
            setUserJoined(prev => [...prev, data.user.username]);
            // Show notification
            const joinEvent = new CustomEvent("chat-notification", {
              detail: {
                message: `${data.user.username} joined the chat`,
                type: "info"
              }
            });
            document.dispatchEvent(joinEvent);
          }
          break;

        case "leave":
          if (data.user.username !== username) {
            setUserLeft(prev => [...prev, data.user.username]);
            // Show notification
            const leaveEvent = new CustomEvent("chat-notification", {
              detail: {
                message: `${data.user.username} left the chat`,
                type: "info"
              }
            });
            document.dispatchEvent(leaveEvent);
          }
          break;

        case "typing":
          if (data.user.username !== username) {
            // Dispatch typing event to be handled by the component
            const typingEvent = new CustomEvent("user-typing", {
              detail: {
                username: data.user.username,
                isTyping: data.isTyping
              }
            });
            document.dispatchEvent(typingEvent);
          }
          break;

        case "activeUsers":
          setActiveUsers(new Array(data.count).fill(0).map((_, i) => ({ username: `User ${i + 1}` })));
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "leave",
          roomId,
          user: { username }
        }));
        ws.close();
      }
    };
  }, [roomId, username]);

  // Send message function
  const sendMessage = useCallback((content: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !roomId || !username || !content) return;

    const message: Message = {
      id: 0, // Will be assigned by server
      roomId,
      userId: 0, // Will be assigned by server if user is registered
      username,
      content,
      type: "text",
      createdAt: new Date()
    };

    socket.send(JSON.stringify({
      type: "message",
      roomId,
      message
    }));
  }, [socket, roomId, username]);

  // Send typing status
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !roomId || !username) return;

    socket.send(JSON.stringify({
      type: "typing",
      roomId,
      user: { username },
      isTyping
    }));
  }, [socket, roomId, username]);

  return {
    messages,
    sendMessage,
    sendTypingStatus,
    userJoined,
    userLeft,
    activeUsers,
    connected
  };
}
