import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { File } from '../models/File';
import { getFileType, generateFileUrl } from '../utils/fileUpload';

export interface IFileData {
  original_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  chat_message_id: number;
  created_by: number;
}

class FileService {
  /**
   * Save file information to database
   */
  static async saveFile(fileData: Omit<IFileData, 'type'>): Promise<File> {
    const fileType = getFileType(fileData.mime_type);
    return await File.create({
      ...fileData,
      type: fileType,
    });
  }

  /**
   * Get file by ID with access control
   */
  static async getFile(fileId: number, userId: number): Promise<File | null> {
    return await File.findOne({
      where: { id: fileId, created_by: userId },
    });
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileId: number, userId: number): Promise<boolean> {
    const file = await this.getFile(fileId, userId);
    if (!file) return false;

    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads', file.storage_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await file.destroy();
    return true;
  }

  /**
   * Process uploaded file
   */
  static processUploadedFile(
    req: Request,
    file: Express.Multer.File,
    chatMessageId: number,
    userId: number
  ) {
    const fileData: Omit<IFileData, 'type'> = {
      original_name: file.originalname,
      storage_path: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      chat_message_id: chatMessageId,
      created_by: userId,
    };

    const fileType = getFileType(file.mimetype);
    const fileUrl = generateFileUrl(req, file.filename);

    return {
      ...fileData,
      type: fileType,
      url: fileUrl,
    };
  }

  /**
   * Get files by message ID
   */
  static async getFilesByMessageId(messageId: number): Promise<File[]> {
    return await File.findAll({
      where: { chat_message_id: messageId },
    });
  }
}

export default FileService;
