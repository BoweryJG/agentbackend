import express from 'express';
import { 
  findUserByUsername, 
  validatePassword, 
  generateToken,
  authenticate,
  authorize,
  ROLES 
} from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login - Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Find user
    const user = await findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Validate password
    const isValidPassword = await validatePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
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

// POST /api/auth/refresh - Refresh token (optional endpoint)
router.post('/refresh', authenticate, (req, res) => {
  try {
    // Generate new token with current user info
    const newToken = generateToken(req.user);
    
    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// GET /api/auth/users - List users (admin only)
router.get('/users', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    // In a real application, this would query a database
    // For now, we'll return a sanitized list of hardcoded users
    const users = [
      { id: 'admin1', username: 'admin', role: ROLES.ADMIN },
      { id: 'client1', username: 'client1', role: ROLES.CLIENT, clientId: 'healthsystem1' }
    ];
    
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

// POST /api/auth/users - Create new user (admin only)
router.post('/users', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const { username, password, role, clientId } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and role are required'
      });
    }
    
    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }
    
    // For client role, clientId is required
    if (role === ROLES.CLIENT && !clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required for client role'
      });
    }
    
    // In a real application, you would:
    // 1. Check if username already exists
    // 2. Hash the password
    // 3. Save to database
    
    res.status(201).json({
      success: true,
      message: 'User creation would be implemented with a database',
      user: {
        username,
        role,
        clientId: role === ROLES.CLIENT ? clientId : undefined
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

export default router;