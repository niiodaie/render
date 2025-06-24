import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup - Sign up a new user
router.post('/signup', authController.signUp);

// POST /api/auth/signin - Sign in a user
router.post('/signin', authController.signIn);

// POST /api/auth/signout - Sign out a user
router.post('/signout', authController.signOut);

// GET /api/auth/user - Get current user
router.get('/user', authController.getCurrentUser);

// POST /api/auth/anonymous - Create anonymous session
router.post('/anonymous', authController.createAnonymousSession);

// POST /api/auth/refresh - Refresh session
router.post('/refresh', authController.refreshSession);

export default router;

