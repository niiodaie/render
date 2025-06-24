import express from 'express';
import { notesController } from '../controllers/notesController.js';

const router = express.Router();

// GET /api/notes - Get all notes
router.get('/', notesController.getAllNotes);

// GET /api/notes/search - Search notes
router.get('/search', notesController.searchNotes);

// GET /api/notes/tag/:tag - Get notes by tag
router.get('/tag/:tag', notesController.getNotesByTag);

// GET /api/notes/:id - Get a specific note
router.get('/:id', notesController.getNoteById);

// POST /api/notes - Create a new note
router.post('/', notesController.createNote);

// PUT /api/notes/:id - Update a note
router.put('/:id', notesController.updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', notesController.deleteNote);

export default router;

