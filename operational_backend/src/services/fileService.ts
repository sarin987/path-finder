import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import FileModel, { FileCreationAttributes } from '../models/File.js';
import { getFileType, generateFileUrl } from '../utils/fileUpload.js';

export interface IFileData {
  original_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  created_by: number;
}

class FileService {
  /**
   * Save file information to database
   */
  static async saveFile(fileData: Omit<IFileData, 'type'>): Promise<InstanceType<typeof FileModel>> {
    const fileType = getFileType(fileData.mime_type);
    return await FileModel.create({
      ...fileData,
      type: fileType,
    } as FileCreationAttributes);
  }

  /**
   * Get file by ID with access control
   */
  static async getFile(fileId: number, userId: number): Promise<InstanceType<typeof FileModel> | null> {
    return await FileModel.findOne({
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
    if (file) {
      const filePath = path.join(__dirname, '../../uploads', file.getDataValue('storage_path'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete database record
    if (file) {
      await file.destroy();
      return true;
    }
    return false;
  }

  /**
   * Process uploaded file
   */
  static processUploadedFile(
    req: Request,
    file: Express.Multer.File,
    userId: number
  ) {
    const fileData: Omit<IFileData, 'type'> = {
      original_name: file.originalname,
      storage_path: file.filename,
      mime_type: file.mimetype,
      size: file.size,
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


}

export default FileService;
