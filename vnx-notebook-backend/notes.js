import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notesRoutes from './notesRouter.js'; // ✅ FIXED

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/notes', notesRoutes); // ✅ Hook in router

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
