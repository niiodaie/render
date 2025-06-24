import { supabase, TABLES } from './supabase.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

// Validation schemas
const noteSchema = Joi.object({
  title: Joi.string().required().min(1).max(255),
  content: Joi.string().required().min(1).max(50000),
  tags: Joi.string().allow('').max(500),
  language: Joi.string().allow('').max(50),
  color: Joi.string().allow('').max(20),
  location: Joi.object({
    country: Joi.string().allow(''),
    city: Joi.string().allow('')
  }).optional()
});

const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  content: Joi.string().min(1).max(50000),
  tags: Joi.string().allow('').max(500),
  language: Joi.string().allow('').max(50),
  color: Joi.string().allow('').max(20),
  location: Joi.object({
    country: Joi.string().allow(''),
    city: Joi.string().allow('')
  }).optional()
}).min(1);

export const notesController = {
  // Get all notes for a user
  async getAllNotes(req, res) {
    try {
      const { user_id } = req.query;
      
      let query = supabase
        .from(TABLES.NOTES)
        .select('*')
        .order('created_at', { ascending: false });

      // If user_id is provided, filter by user
      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notes',
        details: error.message
      });
    }
  },

  // Get a single note by ID
  async getNoteById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Note not found'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch note',
        details: error.message
      });
    }
  },

  // Create a new note
  async createNote(req, res) {
    try {
      const { error: validationError, value } = noteSchema.validate(req.body);
      
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details[0].message
        });
      }

      const noteData = {
        id: uuidv4(),
        title: value.title,
        content: value.content,
        tags: value.tags || '',
        language: value.language || 'plain',
        color: value.color || '#fbbf24', // Default yellow color
        location: value.location || { country: '', city: '' },
        user_id: req.body.user_id || 'anonymous',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .insert([noteData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Note created successfully'
      });
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create note',
        details: error.message
      });
    }
  },

  // Update a note
  async updateNote(req, res) {
    try {
      const { id } = req.params;
      const { error: validationError, value } = updateNoteSchema.validate(req.body);
      
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details[0].message
        });
      }

      const updateData = {
        ...value,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Note not found'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data,
        message: 'Note updated successfully'
      });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update note',
        details: error.message
      });
    }
  },

  // Delete a note
  async deleteNote(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABLES.NOTES)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Note deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete note',
        details: error.message
      });
    }
  },

  // Search notes
  async searchNotes(req, res) {
    try {
      const { q, tags, user_id } = req.query;

      if (!q && !tags) {
        return res.status(400).json({
          success: false,
          error: 'Search query or tags required'
        });
      }

      let query = supabase
        .from(TABLES.NOTES)
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by user if provided
      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      // Search in title and content
      if (q) {
        query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
      }

      // Filter by tags
      if (tags) {
        query = query.ilike('tags', `%${tags}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
        query: { q, tags, user_id }
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search notes',
        details: error.message
      });
    }
  },

  // Get notes by tag
  async getNotesByTag(req, res) {
    try {
      const { tag } = req.params;
      const { user_id } = req.query;

      let query = supabase
        .from(TABLES.NOTES)
        .select('*')
        .ilike('tags', `%${tag}%`)
        .order('created_at', { ascending: false });

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
        tag
      });
    } catch (error) {
      console.error('Error fetching notes by tag:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notes by tag',
        details: error.message
      });
    }
  }
};

