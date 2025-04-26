import { Message as SharedMessage } from "@shared/schema";

export interface User {
  id?: number;
  username: string;
}

export interface Message extends SharedMessage {
  isSent?: boolean;
  isSending?: boolean;
  error?: string;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}
