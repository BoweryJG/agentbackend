import express from 'express';
import { 
  authenticate,
  authorize,
  setUserRole,
  getUserByEmail,
  ROLES,
  supabase
} from '../middleware/supabaseAuth.js';

const router = express.Router();

// Check if Supabase is configured
if (!supabase) {
  // Return a simple message if Supabase isn't configured
  router.use((req, res) => {
    res.status(503).json({
      success: false,
      error: 'Supabase authentication not configured. Please use legacy auth endpoints at /api/auth/legacy/*'
    });
  });
  
  export default router;
}

// POST /api/auth/callback - Handle Supabase auth callback
router.post('/callback', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Access token required'
      });
    }
    
    // Verify the token
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    // Check if user needs role assignment
    if (!user.user_metadata?.role) {
      // Default role for new users
      await setUserRole(user.id, ROLES.PUBLIC);
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || ROLES.PUBLIC,
        metadata: user.user_metadata
      },
      access_token,
      refresh_token
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
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
    
    if (error || !data.session) {
      return res.status(401).json({
        success: false,
        error: 'Failed to refresh session'
      });
    }
    
    res.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Supabase handles token revocation client-side
    // Here we just acknowledge the logout
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// GET /api/auth/users - List users (admin only)
router.get('/users', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || ROLES.PUBLIC,
      clientId: user.user_metadata?.clientId,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at
    }));
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// PUT /api/auth/users/:userId/role - Update user role (admin only)
router.put('/users/:userId/role', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, clientId } = req.body;
    
    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role required'
      });
    }
    
    // For client role, clientId is required
    if (role === ROLES.CLIENT && !clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required for client role'
      });
    }
    
    const result = await setUserRole(userId, role, clientId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// POST /api/auth/invite - Invite user (admin only)
router.post('/invite', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const { email, role, clientId } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Create metadata for the invited user
    const metadata = { role };
    if (clientId) {
      metadata.clientId = clientId;
    }
    
    // Send invitation
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: metadata
    });
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user: data.user
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite user'
    });
  }
});

export default router;