# JWT Authentication System

This document describes the JWT authentication system implemented in the AgentBackend API.

## Overview

The authentication system uses JSON Web Tokens (JWT) to secure API endpoints. It implements role-based access control (RBAC) with three roles:

- **admin**: Full access to all endpoints
- **client**: Access to their own deployment data
- **public**: Limited access (for future use)

## Default Credentials

⚠️ **IMPORTANT**: Change these credentials before deploying to production!

### Admin User
- Username: `admin`
- Password: `admin123`
- Role: `admin`

### Client User
- Username: `client1`
- Password: `client1123`
- Role: `client`
- Client ID: `healthsystem1`

## Authentication Flow

1. **Login**: Send credentials to `/api/auth/login`
2. **Receive Token**: Get JWT token in response
3. **Use Token**: Include token in Authorization header for protected endpoints

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "admin1",
    "username": "admin",
    "role": "admin"
  }
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

#### POST /api/auth/refresh
Refresh an existing token (requires authentication).

#### GET /api/auth/users
List all users (admin only).

#### POST /api/auth/users
Create new user (admin only).

### Protected Endpoints

#### Agent Management (Admin Only)
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

#### Deployment Management
- `POST /api/deploy/:clientId/:agentId` - Deploy agent (admin or authorized client)
- `GET /api/deploy/:clientId/agents` - Get client's agents (admin or authorized client)
- `DELETE /api/deploy/:clientId/:agentId` - Remove deployment (admin or authorized client)
- `GET /api/deploy` - Get all deployments (admin only)

## Using Authentication

### Include Token in Requests

After logging in, include the JWT token in the Authorization header:

```javascript
fetch('http://localhost:3002/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  },
  body: JSON.stringify({
    id: 'new_agent',
    name: 'New Agent'
  })
});
```

### Client Authorization

Clients can only access their own deployment data. The system checks:
1. If user is authenticated
2. If user role is 'client'
3. If the requested clientId matches the user's clientId

Admins bypass these checks and can access any client's data.

## Configuration

Add these environment variables to your `.env` file:

```env
# JWT Authentication
JWT_SECRET=your-secret-key-please-change-this-in-production
JWT_EXPIRES_IN=24h
```

## Testing

Run the authentication test script:

```bash
node test-auth.js
```

This will test:
1. Admin login
2. Protected route access
3. Admin-only operations
4. Unauthorized access rejection
5. Client login and permissions

## Security Considerations

1. **Change Default Passwords**: The default passwords must be changed before production deployment
2. **Use Strong JWT Secret**: Replace the default JWT_SECRET with a strong, random string
3. **HTTPS Only**: In production, always use HTTPS to prevent token interception
4. **Token Expiration**: Tokens expire after 24 hours by default
5. **Password Storage**: Passwords are hashed using bcrypt with salt rounds of 10

## Future Enhancements

1. **User Database**: Move from hardcoded users to a database
2. **Password Reset**: Implement password reset functionality
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Refresh Tokens**: Implement separate refresh tokens
5. **API Keys**: Add API key authentication for programmatic access