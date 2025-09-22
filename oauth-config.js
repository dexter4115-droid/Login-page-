// OAuth Configuration for Google and GitHub
const OAUTH_CONFIG = {
    // Google OAuth Configuration
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Google OAuth client ID
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET', // Replace with your Google OAuth client secret
        redirectUri: window.location.origin + '/oauth/google/callback',
        scope: 'openid email profile',
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
        state: 'google_auth_' + Math.random().toString(36).substring(2, 15)
    },

    // GitHub OAuth Configuration
    github: {
        clientId: 'YOUR_GITHUB_CLIENT_ID', // Replace with your GitHub OAuth client ID
        clientSecret: 'YOUR_GITHUB_CLIENT_SECRET', // Replace with your GitHub OAuth client secret
        redirectUri: window.location.origin + '/oauth/github/callback',
        scope: 'user:email read:user',
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        userInfoEndpoint: 'https://api.github.com/user',
        state: 'github_auth_' + Math.random().toString(36).substring(2, 15)
    },

    // Development settings
    development: {
        mockOAuth: true, // Set to false for production
        mockDelay: 1000, // Delay for mock OAuth responses
        mockUsers: {
            google: {
                id: 'google_123',
                email: 'user@gmail.com',
                name: 'Google User',
                picture: 'https://via.placeholder.com/150',
                provider: 'google'
            },
            github: {
                id: 'github_456',
                email: 'user@github.com',
                name: 'GitHub User',
                avatar_url: 'https://via.placeholder.com/150',
                provider: 'github'
            }
        }
    }
};

// OAuth Service Class
class OAuthService {
    constructor() {
        this.config = OAUTH_CONFIG;
        this.currentProvider = null;
        this.authWindow = null;
    }

    // Initiate OAuth login
    async login(provider) {
        this.currentProvider = provider;

        if (this.config.development.mockOAuth) {
            return this.mockOAuthLogin(provider);
        }

        return this.initiateOAuthFlow(provider);
    }

    // Initiate OAuth signup
    async signup(provider) {
        this.currentProvider = provider;

        if (this.config.development.mockOAuth) {
            return this.mockOAuthSignup(provider);
        }

        return this.initiateOAuthFlow(provider, 'signup');
    }

    // Main OAuth flow
    async initiateOAuthFlow(provider, action = 'login') {
        const config = this.config[provider];
        if (!config) {
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        // Generate state parameter for security
        const state = config.state + '_' + action + '_' + Date.now();

        // Store state in sessionStorage for validation
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_action', action);

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scope,
            state: state,
            response_type: 'code'
        });

        const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;

        // Open OAuth window
        this.openOAuthWindow(authUrl, provider);

        return new Promise((resolve, reject) => {
            // Set up message listener for OAuth callback
            window.addEventListener('message', (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'oauth_callback') {
                    this.closeOAuthWindow();
                    if (event.data.success) {
                        resolve(event.data.user);
                    } else {
                        reject(new Error(event.data.error || 'OAuth authentication failed'));
                    }
                }
            });

            // Timeout after 5 minutes
            setTimeout(() => {
                this.closeOAuthWindow();
                reject(new Error('OAuth authentication timeout'));
            }, 300000);
        });
    }

    // Open OAuth popup window
    openOAuthWindow(url, provider) {
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        this.authWindow = window.open(
            url,
            `${provider}_oauth`,
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (!this.authWindow) {
            throw new Error('Popup blocked. Please allow popups for this site.');
        }
    }

    // Close OAuth window
    closeOAuthWindow() {
        if (this.authWindow && !this.authWindow.closed) {
            this.authWindow.close();
            this.authWindow = null;
        }
    }

    // Handle OAuth callback
    async handleCallback(provider, code, state) {
        const config = this.config[provider];

        // Validate state parameter
        const storedState = sessionStorage.getItem('oauth_state');
        const action = sessionStorage.getItem('oauth_action');

        if (state !== storedState) {
            throw new Error('Invalid OAuth state parameter');
        }

        // Exchange code for token
        const tokenResponse = await this.exchangeCodeForToken(provider, code);

        // Get user info
        const userInfo = await this.getUserInfo(provider, tokenResponse.access_token);

        // Create user object
        const user = this.createUserObject(userInfo, provider, action);

        return { user, token: tokenResponse.access_token };
    }

    // Exchange authorization code for access token
    async exchangeCodeForToken(provider, code) {
        const config = this.config[provider];

        const response = await fetch(config.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for token');
        }

        return response.json();
    }

    // Get user information from provider
    async getUserInfo(provider, accessToken) {
        const config = this.config[provider];

        const response = await fetch(config.userInfoEndpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user information');
        }

        return response.json();
    }

    // Create standardized user object
    createUserObject(userInfo, provider, action) {
        const baseUser = {
            id: `${provider}_${userInfo.id}`,
            provider: provider,
            authProvider: provider,
            createdAt: new Date().toISOString()
        };

        if (provider === 'google') {
            return {
                ...baseUser,
                email: userInfo.email,
                username: userInfo.email.split('@')[0] + '_google',
                name: userInfo.name,
                picture: userInfo.picture,
                verified: userInfo.verified_email || false
            };
        } else if (provider === 'github') {
            return {
                ...baseUser,
                email: userInfo.email,
                username: userInfo.login,
                name: userInfo.name,
                avatar: userInfo.avatar_url,
                githubUrl: userInfo.html_url,
                company: userInfo.company,
                location: userInfo.location,
                bio: userInfo.bio
            };
        }

        return baseUser;
    }

    // Mock OAuth for development
    async mockOAuthLogin(provider) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockUser = this.config.development.mockUsers[provider];
                const user = {
                    ...mockUser,
                    id: mockUser.id,
                    authProvider: provider,
                    createdAt: new Date().toISOString()
                };
                resolve(user);
            }, this.config.development.mockDelay);
        });
    }

    async mockOAuthSignup(provider) {
        return this.mockOAuthLogin(provider);
    }

    // Store OAuth token securely
    storeToken(token, provider) {
        const tokenData = {
            access_token: token,
            provider: provider,
            stored_at: new Date().toISOString()
        };

        // In production, use more secure storage
        sessionStorage.setItem(`oauth_token_${provider}`, JSON.stringify(tokenData));
    }

    // Get stored OAuth token
    getStoredToken(provider) {
        const tokenData = sessionStorage.getItem(`oauth_token_${provider}`);
        return tokenData ? JSON.parse(tokenData) : null;
    }

    // Clear stored token
    clearToken(provider) {
        sessionStorage.removeItem(`oauth_token_${provider}`);
    }

    // Check if user is authenticated with OAuth
    isAuthenticated(provider = null) {
        if (provider) {
            return this.getStoredToken(provider) !== null;
        }

        // Check all providers
        for (const providerName of ['google', 'github']) {
            if (this.getStoredToken(providerName)) {
                return true;
            }
        }

        return false;
    }
}

// Create global OAuth service instance
window.oauthService = new OAuthService();

// Utility functions for external use
function initiateOAuthLogin(provider) {
    return window.oauthService.login(provider);
}

function initiateOAuthSignup(provider) {
    return window.oauthService.signup(provider);
}

function handleOAuthCallback(provider, code, state) {
    return window.oauthService.handleCallback(provider, code, state);
}

function isOAuthAuthenticated(provider = null) {
    return window.oauthService.isAuthenticated(provider);
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OAuthService,
        OAUTH_CONFIG,
        initiateOAuthLogin,
        initiateOAuthSignup,
        handleOAuthCallback,
        isOAuthAuthenticated
    };
}
