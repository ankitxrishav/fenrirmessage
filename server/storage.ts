import { 
  users, type User, type InsertUser, 
  chatRooms, type ChatRoom, type InsertChatRoom,
  messages, type Message, type InsertMessage,
  activeUsers, type ActiveUser, type InsertActiveUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, desc, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

// Interface for chat operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat room operations
  getRoomByPassword(password: string): Promise<ChatRoom | undefined>;
  createRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getOrCreateRoomByPassword(password: string): Promise<ChatRoom>;

  // Message operations
  getMessagesByRoomId(roomId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Active users operations
  getActiveUsersByRoomId(roomId: number): Promise<ActiveUser[]>;
  addActiveUser(user: InsertActiveUser): Promise<ActiveUser>;
  removeActiveUser(roomId: number, username: string): Promise<void>;
  updateActiveUserLastSeen(roomId: number, username: string): Promise<void>;
  cleanupInactiveUsers(timeoutMs: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Chat room operations
  async getRoomByPassword(password: string): Promise<ChatRoom | undefined> {
    const result = await db.select().from(chatRooms).where(eq(chatRooms.password, password));
    return result[0];
  }

  async createRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const result = await db.insert(chatRooms).values({
      ...insertRoom,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getOrCreateRoomByPassword(password: string): Promise<ChatRoom> {
    const existingRoom = await this.getRoomByPassword(password);
    if (existingRoom) {
      return existingRoom;
    }
    return this.createRoom({ password });
  }

  // Message operations
  async getMessagesByRoomId(roomId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...insertMessage,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  // Active users operations
  async getActiveUsersByRoomId(roomId: number): Promise<ActiveUser[]> {
    return db.select().from(activeUsers).where(eq(activeUsers.roomId, roomId));
  }

  async addActiveUser(insertActiveUser: InsertActiveUser): Promise<ActiveUser> {
    // Check if user already exists in this room
    const existingUsers = await db.select()
      .from(activeUsers)
      .where(
        and(
          eq(activeUsers.roomId, insertActiveUser.roomId),
          eq(activeUsers.username, insertActiveUser.username)
        )
      );
    
    if (existingUsers.length > 0) {
      // Update last seen
      const existingUser = existingUsers[0];
      await db.update(activeUsers)
        .set({ lastSeen: new Date() })
        .where(eq(activeUsers.id, existingUser.id));
      
      return { ...existingUser, lastSeen: new Date() };
    }
    
    // Add new active user
    const result = await db.insert(activeUsers).values({
      ...insertActiveUser,
      lastSeen: new Date()
    }).returning();
    
    return result[0];
  }

  async removeActiveUser(roomId: number, username: string): Promise<void> {
    await db.delete(activeUsers).where(
      and(
        eq(activeUsers.roomId, roomId),
        eq(activeUsers.username, username)
      )
    );
  }

  async updateActiveUserLastSeen(roomId: number, username: string): Promise<void> {
    await db.update(activeUsers)
      .set({ lastSeen: new Date() })
      .where(
        and(
          eq(activeUsers.roomId, roomId),
          eq(activeUsers.username, username)
        )
      );
  }

  async cleanupInactiveUsers(timeoutMs: number): Promise<void> {
    const cutoff = new Date(Date.now() - timeoutMs);
    await db.delete(activeUsers).where(lt(activeUsers.lastSeen, cutoff));
  }
}

export const storage = new DatabaseStorage();

// Set up a timer to clean up inactive users every minute
setInterval(() => {
  storage.cleanupInactiveUsers(1000 * 60 * 5); // 5 minutes timeout
}, 60000);
