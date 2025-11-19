export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  books?: any[]; // Array de libros recomendados en este mensaje
}

export interface SaveMessageDto {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  books?: any[]; // Array de libros para guardar con el mensaje
}
