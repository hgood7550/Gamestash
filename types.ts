export interface GameItem {
  id: string;
  filename: string;
  displayName: string;
  category: string;
  genres: string[];
  tags: string[];
  description: string; // Added procedural description
}

export interface EncryptionConfig {
  seed: number;
  rotationInterval: number;
}

export enum SecurityLevel {
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  PARANOID = 'PARANOID'
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    games?: GameItem[];
    timestamp: number;
}
