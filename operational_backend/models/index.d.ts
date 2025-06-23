import { Model, Optional } from 'sequelize';
import { 
  UserAttributes, 
  UserInstance, 
  ChatMessageAttributes, 
  ChatMessageInstance, 
  ConversationAttributes, 
  ConversationInstance 
} from '../src/types/models';

declare const User: Model<UserInstance, UserAttributes>;
declare const ChatMessage: Model<ChatMessageInstance, ChatMessageAttributes>;
declare const Conversation: Model<ConversationInstance, ConversationAttributes>;

export { User, ChatMessage, Conversation };
