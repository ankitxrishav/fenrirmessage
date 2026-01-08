import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat room schema
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  password: text("password").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  password: true,
});

export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // "text" | "image" | "file"
  filePublicId: text("file_public_id"), // Cloudinary public_id for deletion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  userId: true,
  username: true,
  content: true,
  type: true,
  filePublicId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Active users in rooms
export const activeUsers = pgTable("active_users", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

export const insertActiveUserSchema = createInsertSchema(activeUsers).pick({
  roomId: true,
  userId: true,
  username: true,
});

export type InsertActiveUser = z.infer<typeof insertActiveUserSchema>;
export type ActiveUser = typeof activeUsers.$inferSelect;

// Message validation schema (for client-side)
export const messageValidationSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  type: z.enum(["text", "image", "file"]).default("text"),
  filePublicId: z.string().optional(),
});

// Room entry validation schema (for client-side)
export const roomEntrySchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(1, "Display name is required"),
});

// WebSocket message types
export type ChatEvent =
  | { type: "join"; roomId: number; user: { id?: number; username: string } }
  | { type: "leave"; roomId: number; user: { id?: number; username: string } }
  | { type: "message"; roomId: number; message: Message }
  | { type: "typing"; roomId: number; user: { id?: number; username: string }; isTyping: boolean };
