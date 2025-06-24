import { supabase } from '../supabase.js';
import Joi from 'joi';

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const authController = {
  // Sign up a new user
  async signUp(req, res) {
    try {
      const { error: validationError, value } = signUpSchema.validate(req.body);
      
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details[0].message
        });
      }

      const { email, password } = value;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            created_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw error;
      }

      res.status(201).json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Error signing up user:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to create user',
        details: error.message
      });
    }
  },

  // Sign in a user
  async signIn(req, res) {
    try {
      const { error: validationError, value } = signInSchema.validate(req.body);
      
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details[0].message
        });
      }

      const { email, password } = value;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'User signed in successfully'
      });
    } catch (error) {
      console.error('Error signing in user:', error);
      res.status(401).json({
        success: false,
        error: 'Failed to sign in',
        details: error.message
      });
    }
  },

  // Sign out a user
  async signOut(req, res) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'User signed out successfully'
      });
    } catch (error) {
      console.error('Error signing out user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign out',
        details: error.message
      });
    }
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No authorization token provided'
        });
      }

      const token = authHeader.substring(7);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: { user },
        message: 'User retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(401).json({
        success: false,
        error: 'Failed to get user',
        details: error.message
      });
    }
  },

  // Create anonymous session
  async createAnonymousSession(req, res) {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Anonymous session created successfully'
      });
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create anonymous session',
        details: error.message
      });
    }
  },

  // Refresh session
  async refreshSession(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Session refreshed successfully'
      });
    } catch (error) {
      console.error('Error refreshing session:', error);
      res.status(401).json({
        success: false,
        error: 'Failed to refresh session',
        details: error.message
      });
    }
  }
};

