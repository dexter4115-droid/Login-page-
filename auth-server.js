// Mock OAuth Server for Development
// This simulates OAuth provider responses for testing

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock user databases
const mockUsers = {
    google: {
        'google-user-123': {
            id: 'google-user-123',
            email: 'user@gmail.com',
            name: 'Google Test User',
            picture: 'https://via.placeholder.com/150',
            verified_email: true,
            provider: 'google'
        },
        'google-admin-456': {
            id: 'google-admin-456',
            email: 'admin@gmail.com',
            name: 'Google Admin',
            picture: 'https://via.placeholder.com/150',
            verified_email: true,
            provider: 'google'
        }
    },
    github: {
        'github-user-789': {
            id: 'github-user-789',
            login: 'githubuser',
            email: 'user@github.com',
            name: 'GitHub Test User',
            avatar_url: 'https://via.placeholder.com/150',
            html_url: 'https://github.com/githubuser',
            company: 'Test Company',
            location: 'San Francisco, CA',
            bio: 'Software developer and open source enthusiast',
            provider: 'github'
        },
        'github-dev-101': {
            id: 'github-dev-101',
            login: 'githubdev',
            email: 'dev@github.com',
            name: 'GitHub Developer',
            avatar_url: 'https://via.placeholder.com/150',
            html_url: 'https://github.com/githubdev',
            company: 'Dev Corp',
            location: 'New York, NY',
            bio: 'Full-stack developer',
            provider: 'github'
        }
    }
};

// Mock tokens database
const mockTokens = {
    'google-token-123': {
        access_token: 'google-token-123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'google-refresh-123',
        scope: 'openid email profile'
    },
    'github-token-456': {
        access_token: 'github-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'github-refresh-456',
        scope: 'user:email read:user'
    }
};

// Google OAuth endpoints
app.get('/oauth/google/authorize', (req, res) => {
    const { client_id, redirect_uri, state, scope } = req.query;

    // Validate client_id (in production, check against registered apps)
    if (client_id !== 'YOUR_GOOGLE_CLIENT_ID') {
        return res.status(400).json({ error: 'Invalid client_id' });
    }

    // In a real OAuth flow, this would redirect to Google's consent screen
    // For mock purposes, we'll simulate the authorization
    console.log('Google OAuth Authorization Request:', { client_id, redirect_uri, state, scope });

    // Simulate user consent and redirect back with authorization code
    setTimeout(() => {
        const authCode = 'google-auth-code-' + Date.now();
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', authCode);
        redirectUrl.searchParams.set('state', state);

        console.log('Redirecting to:', redirectUrl.toString());
        // In a real implementation, this would be an HTTP redirect
        // For demo purposes, we'll just log it
    }, 1000);

    res.json({
        message: 'Authorization initiated',
        authUrl: `https://accounts.google.com/oauth/authorize?${req.query.toString()}`
    });
});

app.post('/oauth/google/token', (req, res) => {
    const { client_id, client_secret, code, grant_type } = req.body;

    console.log('Google Token Exchange Request:', { client_id, code, grant_type });

    // Validate request
    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'invalid_grant' });
    }

    // Mock token response
    const tokenData = mockTokens['google-token-123'];

    res.json(tokenData);
});

app.get('/oauth/google/userinfo', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = Object.keys(mockUsers.google).find(id =>
        mockTokens['google-token-123'] && mockTokens['google-token-123'].access_token === token
    );

    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const userInfo = mockUsers.google[userId];
    res.json(userInfo);
});

// GitHub OAuth endpoints
app.get('/oauth/github/authorize', (req, res) => {
    const { client_id, redirect_uri, state, scope } = req.query;

    console.log('GitHub OAuth Authorization Request:', { client_id, redirect_uri, state, scope });

    // Simulate authorization
    setTimeout(() => {
        const authCode = 'github-auth-code-' + Date.now();
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', authCode);
        redirectUrl.searchParams.set('state', state);

        console.log('GitHub redirecting to:', redirectUrl.toString());
    }, 1000);

    res.json({
        message: 'Authorization initiated',
        authUrl: `https://github.com/login/oauth/authorize?${req.query.toString()}`
    });
});

app.post('/oauth/github/token', (req, res) => {
    const { client_id, client_secret, code, grant_type } = req.body;

    console.log('GitHub Token Exchange Request:', { client_id, code, grant_type });

    // Mock token response
    const tokenData = mockTokens['github-token-456'];

    res.json(tokenData);
});

app.get('/oauth/github/user', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = Object.keys(mockUsers.github).find(id =>
        mockTokens['github-token-456'] && mockTokens['github-token-456'].access_token === token
    );

    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const userInfo = mockUsers.github[userId];
    res.json(userInfo);
});

// OAuth callback handlers
app.get('/oauth/google/callback', (req, res) => {
    const { code, state, error } = req.query;

    console.log('Google OAuth Callback:', { code, state, error });

    if (error) {
        return res.status(400).json({ error: error });
    }

    if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    // In a real implementation, exchange code for token and get user info
    // For mock purposes, return success
    res.json({
        success: true,
        provider: 'google',
        code: code,
        state: state,
        message: 'OAuth callback received successfully'
    });
});

app.get('/oauth/github/callback', (req, res) => {
    const { code, state, error } = req.query;

    console.log('GitHub OAuth Callback:', { code, state, error });

    if (error) {
        return res.status(400).json({ error: error });
    }

    if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    res.json({
        success: true,
        provider: 'github',
        code: code,
        state: state,
        message: 'OAuth callback received successfully'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Mock OAuth Server is running',
        providers: ['google', 'github'],
        timestamp: new Date().toISOString()
    });
});

// Mock user endpoints for testing
app.get('/mock/users/:provider', (req, res) => {
    const { provider } = req.params;

    if (mockUsers[provider]) {
        res.json(Object.values(mockUsers[provider]));
    } else {
        res.status(404).json({ error: 'Provider not found' });
    }
});

app.post('/mock/users/:provider', (req, res) => {
    const { provider } = req.params;
    const userData = req.body;

    if (!mockUsers[provider]) {
        mockUsers[provider] = {};
    }

    const userId = `${provider}-user-${Date.now()}`;
    mockUsers[provider][userId] = {
        id: userId,
        ...userData,
        provider: provider
    };

    res.json(mockUsers[provider][userId]);
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Mock OAuth Server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 Google OAuth: http://localhost:${port}/oauth/google/authorize`);
    console.log(`🔗 GitHub OAuth: http://localhost:${port}/oauth/github/authorize`);
    console.log('');
    console.log('📝 Available endpoints:');
    console.log('  GET  /health - Server health check');
    console.log('  GET  /oauth/:provider/authorize - Initiate OAuth flow');
    console.log('  POST /oauth/:provider/token - Exchange code for token');
    console.log('  GET  /oauth/:provider/userinfo - Get user information');
    console.log('  GET  /oauth/:provider/callback - OAuth callback handler');
    console.log('  GET  /mock/users/:provider - Get mock users');
    console.log('  POST /mock/users/:provider - Create mock user');
    console.log('');
    console.log('⚠️  This is a mock server for development only!');
    console.log('⚠️  For production, use real OAuth providers (Google, GitHub)');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Mock OAuth Server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Mock OAuth Server...');
    process.exit(0);
});
