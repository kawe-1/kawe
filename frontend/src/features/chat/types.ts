export interface ChatMessage {
  id?: string | number;
  role: 'user' | 'ai';
  text: string;
  cite?: string;
  audioUrl?: string;
}
