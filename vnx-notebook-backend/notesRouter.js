import express from 'express';
import { notesController } from './notesController.js';

const router = express.Router();

router.get('/', notesController.getAllNotes);
router.get('/search', notesController.searchNotes);
router.get('/tag/:tag', notesController.getNotesByTag);
router.get('/:id', notesController.getNoteById);
router.post('/', notesController.createNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

export default router;
