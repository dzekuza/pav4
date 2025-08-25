import express from 'express';
import { enhancedAuthRoutes } from '../lib/neon-auth-integration';
import { requireNeonAuth } from '../lib/neon-auth';

const router = express.Router();

// Enhanced auth routes with Neon Auth integration
router.post('/signup', enhancedAuthRoutes.signUp);
router.post('/signin', enhancedAuthRoutes.signIn);
router.post('/signout', enhancedAuthRoutes.signOut);

// Admin route to list all users (for debugging)
router.get('/users', requireNeonAuth, enhancedAuthRoutes.listUsers);

export default router;
