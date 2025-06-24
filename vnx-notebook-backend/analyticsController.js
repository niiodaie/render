import { supabase, TABLES } from '../supabase.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

// Validation schema for analytics events
const eventSchema = Joi.object({
  event_type: Joi.string().required().valid(
    'note_created', 'note_updated', 'note_deleted', 'note_viewed',
    'voice_input_used', 'export_note', 'share_note', 'search_performed',
    'language_changed', 'page_view', 'user_signup', 'user_signin'
  ),
  event_data: Joi.object().optional(),
  user_id: Joi.string().optional(),
  session_id: Joi.string().optional(),
  user_agent: Joi.string().optional(),
  ip_address: Joi.string().optional(),
  location: Joi.object({
    country: Joi.string().allow(''),
    city: Joi.string().allow(''),
    timezone: Joi.string().allow('')
  }).optional()
});

export const analyticsController = {
  // Track an analytics event
  async trackEvent(req, res) {
    try {
      const { error: validationError, value } = eventSchema.validate(req.body);
      
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationError.details[0].message
        });
      }

      const eventData = {
        id: uuidv4(),
        event_type: value.event_type,
        event_data: value.event_data || {},
        user_id: value.user_id || 'anonymous',
        session_id: value.session_id || uuidv4(),
        user_agent: value.user_agent || req.get('User-Agent'),
        ip_address: value.ip_address || req.ip || req.connection.remoteAddress,
        location: value.location || { country: '', city: '', timezone: '' },
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.ANALYTICS)
        .insert([eventData])
        .select()
        .single();

      if (error) {
        // Don't throw error for analytics - just log it
        console.error('Analytics tracking error:', error);
        return res.json({
          success: true,
          message: 'Event logged (with warnings)',
          warning: 'Analytics data may not have been stored'
        });
      }

      res.json({
        success: true,
        data,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't fail the request for analytics errors
      res.json({
        success: true,
        message: 'Event processing completed',
        warning: 'Analytics tracking may have failed'
      });
    }
  },

  // Get analytics summary
  async getAnalyticsSummary(req, res) {
    try {
      const { user_id, days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      let query = supabase
        .from(TABLES.ANALYTICS)
        .select('event_type, created_at, event_data')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (user_id && user_id !== 'anonymous') {
        query = query.eq('user_id', user_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Process analytics data
      const summary = {
        total_events: data?.length || 0,
        events_by_type: {},
        daily_activity: {},
        recent_events: data?.slice(0, 10) || []
      };

      // Count events by type
      data?.forEach(event => {
        const eventType = event.event_type;
        const eventDate = new Date(event.created_at).toDateString();
        
        summary.events_by_type[eventType] = (summary.events_by_type[eventType] || 0) + 1;
        summary.daily_activity[eventDate] = (summary.daily_activity[eventDate] || 0) + 1;
      });

      res.json({
        success: true,
        data: summary,
        period: `${days} days`,
        user_id: user_id || 'all_users'
      });
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics summary',
        details: error.message
      });
    }
  },

  // Get popular tags
  async getPopularTags(req, res) {
    try {
      const { user_id, limit = 10 } = req.query;

      let query = supabase
        .from(TABLES.NOTES)
        .select('tags')
        .not('tags', 'is', null)
        .not('tags', 'eq', '');

      if (user_id && user_id !== 'anonymous') {
        query = query.eq('user_id', user_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Process tags
      const tagCounts = {};
      data?.forEach(note => {
        if (note.tags) {
          const tags = note.tags.split(',').map(tag => tag.trim().toLowerCase());
          tags.forEach(tag => {
            if (tag) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      // Sort tags by popularity
      const popularTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, parseInt(limit))
        .map(([tag, count]) => ({ tag, count }));

      res.json({
        success: true,
        data: popularTags,
        total_unique_tags: Object.keys(tagCounts).length
      });
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch popular tags',
        details: error.message
      });
    }
  },

  // Get usage statistics
  async getUsageStats(req, res) {
    try {
      const { user_id } = req.query;

      // Get note statistics
      let notesQuery = supabase
        .from(TABLES.NOTES)
        .select('id, created_at, language, tags');

      if (user_id && user_id !== 'anonymous') {
        notesQuery = notesQuery.eq('user_id', user_id);
      }

      const { data: notes, error: notesError } = await notesQuery;

      if (notesError) {
        throw notesError;
      }

      // Calculate statistics
      const stats = {
        total_notes: notes?.length || 0,
        notes_this_week: 0,
        notes_this_month: 0,
        languages_used: {},
        creation_pattern: {}
      };

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      notes?.forEach(note => {
        const createdAt = new Date(note.created_at);
        
        // Count recent notes
        if (createdAt >= weekAgo) stats.notes_this_week++;
        if (createdAt >= monthAgo) stats.notes_this_month++;
        
        // Count languages
        const language = note.language || 'plain';
        stats.languages_used[language] = (stats.languages_used[language] || 0) + 1;
        
        // Creation pattern by hour
        const hour = createdAt.getHours();
        stats.creation_pattern[hour] = (stats.creation_pattern[hour] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats,
        user_id: user_id || 'all_users'
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch usage statistics',
        details: error.message
      });
    }
  }
};

