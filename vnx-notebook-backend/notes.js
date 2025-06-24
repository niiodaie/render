import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notesRoutes from './your-notes-router-file.js'; // Adjust the path accordingly

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount your routes
app.use('/api/notes', notesRoutes);

// ✅ Bind to Render-detected port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VNX Notebook backend running on port ${PORT}`);
});
