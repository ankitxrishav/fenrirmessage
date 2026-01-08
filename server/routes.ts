import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import {
  ChatEvent,
  insertMessageSchema,
  insertActiveUserSchema,
  roomEntrySchema
} from "../shared/schema.js";
import { z } from "zod";

// WebSocket connections map by room
const connections = new Map<number, Set<WebSocket>>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handler
  wss.on("connection", (ws) => {
    let roomId: number | null = null;
    let username: string | null = null;

    ws.on("message", async (message) => {
      try {
        const event: ChatEvent = JSON.parse(message.toString());

        // Handle different event types
        switch (event.type) {
          case "join":
            roomId = event.roomId;
            username = event.user.username;

            // Add connection to room
            if (!connections.has(roomId)) {
              connections.set(roomId, new Set());
            }
            connections.get(roomId)?.add(ws);

            // Add user to active users
            await storage.addActiveUser({
              roomId,
              userId: event.user.id,
              username: event.user.username
            });

            // Broadcast join event to all clients in the room
            broadcastToRoom(roomId, {
              type: "join",
              roomId,
              user: { username: event.user.username }
            });

            // Send current active users count
            const activeUsers = await storage.getActiveUsersByRoomId(roomId);
            broadcastToRoom(roomId, {
              type: "activeUsers",
              count: activeUsers.length
            });
            break;

          case "leave":
            if (roomId !== null && username !== null) {
              // Remove user from active users
              await storage.removeActiveUser(roomId, username);

              // Broadcast leave event
              broadcastToRoom(roomId, {
                type: "leave",
                roomId,
                user: { username }
              });

              // Remove connection from room
              connections.get(roomId)?.delete(ws);
              if (connections.get(roomId)?.size === 0) {
                connections.delete(roomId);
                // Privacy feature: Delete all messages when the room becomes empty
                // First, delete files from Cloudinary
                const messages = await storage.getMessagesByRoomId(roomId);
                const publicIds = messages
                  .filter(m => m.filePublicId)
                  .map(m => m.filePublicId as string);

                if (publicIds.length > 0) {
                  console.log(`Deleting ${publicIds.length} files from Cloudinary for room ${roomId}`);
                  try {
                    await cloudinary.api.delete_resources(publicIds);
                  } catch (err) {
                    console.error("Failed to delete Cloudinary resources:", err);
                  }
                }

                await storage.deleteMessagesByRoomId(roomId);
                console.log(`Room ${roomId} is empty. Messages purged for privacy.`);
              }

              // Update active users count
              const activeUsers = await storage.getActiveUsersByRoomId(roomId);
              broadcastToRoom(roomId, {
                type: "activeUsers",
                count: activeUsers.length
              });
            }
            break;

          case "message":
            if (roomId !== null) {
              // Store message
              const newMessage = await storage.createMessage({
                roomId,
                userId: event.message.userId,
                username: event.message.username,
                content: event.message.content,
                type: event.message.type, // Include message type
                filePublicId: event.message.filePublicId // Include Cloudinary public_id
              });

              // Update user's last seen
              if (username) {
                await storage.updateActiveUserLastSeen(roomId, username);
              }

              // Broadcast message to all clients in the room
              broadcastToRoom(roomId, {
                type: "message",
                roomId,
                message: newMessage
              });
            }
            break;

          case "typing":
            if (roomId !== null) {
              // Broadcast typing status to other clients
              broadcastToRoom(roomId, event, ws);
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    // Handle disconnection
    ws.on("close", async () => {
      if (roomId !== null && username !== null) {
        // Remove user from active users
        await storage.removeActiveUser(roomId, username);

        // Broadcast leave event
        broadcastToRoom(roomId, {
          type: "leave",
          roomId,
          user: { username }
        });

        // Remove connection from room
        connections.get(roomId)?.delete(ws);
        if (connections.get(roomId)?.size === 0) {
          connections.delete(roomId);
          // Privacy feature: Delete all messages when the room becomes empty
          // First, delete files from Cloudinary
          const messages = await storage.getMessagesByRoomId(roomId);
          const publicIds = messages
            .filter(m => m.filePublicId)
            .map(m => m.filePublicId as string);

          if (publicIds.length > 0) {
            console.log(`Deleting ${publicIds.length} files from Cloudinary for room ${roomId}`);
            try {
              await cloudinary.api.delete_resources(publicIds);
            } catch (err) {
              console.error("Failed to delete Cloudinary resources:", err);
            }
          }

          await storage.deleteMessagesByRoomId(roomId);
          console.log(`Room ${roomId} is empty. Messages purged for privacy.`);
        }

        // Update active users count
        const activeUsers = await storage.getActiveUsersByRoomId(roomId);
        broadcastToRoom(roomId, {
          type: "activeUsers",
          count: activeUsers.length
        });
      }
    });
  });

  // Helper function to broadcast to all clients in a room except the sender
  function broadcastToRoom(roomId: number, data: any, exclude?: WebSocket) {
    const roomConnections = connections.get(roomId);
    if (roomConnections) {
      roomConnections.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  // API Routes

  // Cloudinary signature endpoint
  app.get("/api/upload-signature", (req, res) => {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET || ""
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  });

  // Route to join or create a chat room
  app.post("/api/rooms/join", async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = roomEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid input", errors: validation.error.errors });
      }

      const { password, username } = validation.data;

      // Check if room exists or create it
      const room = await storage.getOrCreateRoomByPassword(password);

      // Return room details
      res.status(200).json({
        roomId: room.id,
        createdAt: room.createdAt
      });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  // Route to get messages by room ID
  app.get("/api/rooms/:roomId/messages", async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.roomId);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const messages = await storage.getMessagesByRoomId(roomId);
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Route to get active users in a room
  app.get("/api/rooms/:roomId/users", async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.roomId);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }

      const users = await storage.getActiveUsersByRoomId(roomId);
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting active users:", error);
      res.status(500).json({ message: "Failed to get active users" });
    }
  });

  return httpServer;
}
