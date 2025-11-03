export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  preview?: string; // Primer mensaje o resumen
}

export interface CreateConversationDto {
  userId: string;
  title: string;
  firstMessage?: string;
}

export interface UpdateConversationDto {
  title?: string;
  messageCount?: number;
  preview?: string;
}
