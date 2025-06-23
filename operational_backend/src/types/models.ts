import { Model, Optional } from 'sequelize';

// User Model
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  // Instance methods can be added here
}

// ChatMessage Model
export interface ChatMessageAttributes {
  id: number;
  room_id: string;
  sender_id: number;
  receiver_id: number;
  conversation_id: number;
  message: string;
  message_type: 'text' | 'image' | 'location' | 'file';
  content: any;
  is_read: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  read_at?: Date | null;
  delivered_at?: Date | null;
  parent_message_id?: number | null;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_for: number[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'status' | 'is_edited' | 'is_deleted' | 'deleted_for' | 'read_at' | 'delivered_at'> {}

export interface ChatMessageInstance extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>, ChatMessageAttributes {
  // Instance methods can be added here
}

// Conversation Model
export interface ConversationAttributes {
  id: number;
  service_type: string;
  participant_ids: number[];
  is_group: boolean;
  created_by: number;
  last_message_id?: number | null;
  metadata?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'created_at' | 'updated_at' | 'metadata' | 'is_group' | 'last_message_id'> {}

export interface ConversationInstance extends Model<ConversationAttributes, ConversationCreationAttributes>, ConversationAttributes {
  // Instance methods can be added here
  getParticipants?: () => Promise<UserInstance[]>;
  getMessages?: () => Promise<ChatMessageInstance[]>;
  getLastMessage?: () => Promise<ChatMessageInstance | null>;
}

// Models index
export interface Models {
  User: typeof Model & {
    new (): UserInstance;
    associate?: (models: Models) => void;
  };
  ChatMessage: typeof Model & {
    new (): ChatMessageInstance;
    associate?: (models: Models) => void;
  };
  Conversation: typeof Model & {
    new (): ConversationInstance;
    associate?: (models: Models) => void;
  };
}
