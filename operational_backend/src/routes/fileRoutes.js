const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const { 
  uploadSingle, 
  uploadMultiple, 
  requireFiles,
  handleMulterError 
} = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and download operations
 */

/**
 * @swagger
 * /api/v1/files:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       400:
 *         description: Invalid file or file type not allowed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticateToken,
  ...uploadSingle('file'),
  requireFiles,
  fileController.uploadFile,
  handleMulterError
);

/**
 * @swagger
 * /api/v1/files/chat/{conversationId}:
 *   post:
 *     summary: Upload a file for a chat conversation
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       201:
 *         description: File uploaded and message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MessageWithFile'
 *       400:
 *         description: Invalid file or file type not allowed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/chat/:conversationId',
  authenticateToken,
  ...uploadSingle('file'),
  requireFiles,
  fileController.uploadChatFile,
  handleMulterError
);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   get:
 *     summary: Get file information
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the file to get info for
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have access to this file
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:fileId',
  authenticateToken,
  fileController.getFileInfo
);

/**
 * @swagger
 * /api/v1/files/{fileId}/download:
 *   get:
 *     summary: Download a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the file to download
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have access to this file
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:fileId/download',
  authenticateToken,
  fileController.downloadFile
);

/**
 * @swagger
 * /api/v1/files/{fileId}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission to delete this file
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:fileId',
  authenticateToken,
  fileController.deleteFile
);

/**
 * @swagger
 * /api/v1/files/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to upload (max 5)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       400:
 *         description: Invalid files or file types not allowed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/upload/multiple',
  authenticateToken,
  ...uploadMultiple('files', 5),
  requireFiles,
  fileController.uploadMultipleFiles,
  handleMulterError
);

module.exports = router;
