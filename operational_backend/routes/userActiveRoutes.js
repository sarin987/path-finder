import express from 'express';
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'User active routes are working' }));
export default router;
