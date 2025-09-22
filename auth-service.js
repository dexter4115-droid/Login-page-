// Authentication Service for handling OAuth and user management
class AuthService {
    constructor() {
        this.currentUser = null;
        this.oauthService = window.oauthService;
        this.loadCurrentUser();
    }

    // Load current user from storage
    loadCurrentUser() {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error loading current user:', error);
                this.currentUser = null;
            }
        }
    }

    // Save current user to storage
    saveCurrentUser(user) {
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Clear current user
    clearCurrentUser() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
    }

    // Register new user (traditional signup)
    async registerUser(userData) {
        try {
            // Validate user data
            if (!this.validateUserData(userData)) {
                throw new Error('Invalid user data provided');
            }

            // Check if user already exists
            if (this.userExists(userData.email, userData.username)) {
                throw new Error('User with this email or username already exists');
            }

            // Create user object
            const newUser = {
                id: 'local_' + Date.now().toString(),
                email: userData.email,
                username: userData.username,
                password: userData.password, // In production, hash this
                role: 'user',
                authProvider: 'local',
                createdAt: new Date().toISOString(),
                newsletter: userData.newsletter || false,
                verified: false
            };

            // Save to local storage (in production, save to database)
            this.saveUserToStorage(newUser);

            // Set as current user
            this.saveCurrentUser(newUser);

            return { success: true, user: newUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Authenticate user (traditional login)
    async authenticateUser(username, password) {
        try {
            const users = this.getUsersFromStorage();
            const user = users.find(u =>
                (u.username === username || u.email === username) &&
                u.password === password &&
                u.authProvider === 'local'
            );

            if (user) {
                // Remove password from user object before returning
                const { password: _, ...userWithoutPassword } = user;
                this.saveCurrentUser(userWithoutPassword);
                return { success: true, user: userWithoutPassword };
            } else {
                throw new Error('Invalid username or password');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // OAuth login
    async oauthLogin(provider) {
        try {
            const result = await this.oauthService.login(provider);

            if (result) {
                // Check if OAuth user already exists
                let existingUser = this.findOAuthUser(result.id);

                if (!existingUser) {
                    // Create new OAuth user
                    existingUser = this.createOAuthUser(result, provider);
                    this.saveUserToStorage(existingUser);
                }

                // Set as current user
                this.saveCurrentUser(existingUser);

                return { success: true, user: existingUser };
            } else {
                throw new Error(`${provider} login failed`);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // OAuth signup
    async oauthSignup(provider) {
        try {
            const result = await this.oauthService.signup(provider);

            if (result) {
                // Check if OAuth user already exists
                let existingUser = this.findOAuthUser(result.id);

                if (existingUser) {
                    throw new Error('Account already exists with this OAuth provider');
                }

                // Create new OAuth user
                const newUser = this.createOAuthUser(result, provider);
                this.saveUserToStorage(newUser);

                // Set as current user
                this.saveCurrentUser(newUser);

                return { success: true, user: newUser };
            } else {
                throw new Error(`${provider} signup failed`);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Create OAuth user object
    createOAuthUser(oauthData, provider) {
        const baseUser = {
            id: oauthData.id,
            email: oauthData.email,
            username: oauthData.username,
            role: 'user',
            authProvider: provider,
            createdAt: oauthData.createdAt || new Date().toISOString(),
            verified: true // OAuth users are typically pre-verified
        };

        if (provider === 'google') {
            return {
                ...baseUser,
                name: oauthData.name,
                picture: oauthData.picture,
                verified: oauthData.verified || true
            };
        } else if (provider === 'github') {
            return {
                ...baseUser,
                name: oauthData.name,
                avatar: oauthData.avatar,
                githubUrl: oauthData.githubUrl,
                company: oauthData.company,
                location: oauthData.location,
                bio: oauthData.bio
            };
        }

        return baseUser;
    }

    // Find existing OAuth user
    findOAuthUser(oauthId) {
        const users = this.getUsersFromStorage();
        return users.find(user => user.id === oauthId);
    }

    // Validate user data
    validateUserData(userData) {
        const requiredFields = ['email', 'username', 'password'];
        return requiredFields.every(field => userData[field] && userData[field].trim());
    }

    // Check if user exists
    userExists(email, username) {
        const users = this.getUsersFromStorage();
        return users.some(user =>
            user.email === email ||
            user.username === username
        );
    }

    // Get all users from storage
    getUsersFromStorage() {
        const localUsers = JSON.parse(localStorage.getItem('signupUsers') || '[]');
        const loginUsers = JSON.parse(localStorage.getItem('loginUsers') || '[]');

        // Merge and deduplicate users
        const allUsers = [...localUsers, ...loginUsers];
        const uniqueUsers = allUsers.filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
        );

        return uniqueUsers;
    }

    // Save user to storage
    saveUserToStorage(user) {
        const users = this.getUsersFromStorage();
        const existingIndex = users.findIndex(u => u.id === user.id);

        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }

        localStorage.setItem('signupUsers', JSON.stringify(users));
    }

    // Logout user
    logout() {
        this.clearCurrentUser();

        // Clear OAuth tokens
        if (this.oauthService) {
            this.oauthService.clearToken('google');
            this.oauthService.clearToken('github');
        }

        // Clear all auth-related storage
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_action');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null || this.oauthService.isAuthenticated();
    }

    // Get current user
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Try to get from OAuth
        for (const provider of ['google', 'github']) {
            if (this.oauthService.isAuthenticated(provider)) {
                const oauthUser = this.findOAuthUser(`${provider}_123`); // This would need proper implementation
                if (oauthUser) {
                    this.saveCurrentUser(oauthUser);
                    return oauthUser;
                }
            }
        }

        return null;
    }

    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            const users = this.getUsersFromStorage();
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            users[userIndex] = { ...users[userIndex], ...updates };
            this.saveUserToStorage(users[userIndex]);

            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === userId) {
                this.saveCurrentUser(users[userIndex]);
            }

            return { success: true, user: users[userIndex] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Delete user account
    async deleteUserAccount(userId) {
        try {
            const users = this.getUsersFromStorage();
            const filteredUsers = users.filter(u => u.id !== userId);

            localStorage.setItem('signupUsers', JSON.stringify(filteredUsers));

            // Logout if current user
            if (this.currentUser && this.currentUser.id === userId) {
                this.logout();
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send password reset email (mock implementation)
    async sendPasswordResetEmail(email) {
        // In production, this would send a real email
        console.log(`Password reset email sent to: ${email}`);

        return {
            success: true,
            message: 'Password reset instructions sent to your email'
        };
    }

    // Reset password (mock implementation)
    async resetPassword(token, newPassword) {
        // In production, this would verify the token and update the password
        console.log(`Password reset with token: ${token}`);

        return {
            success: true,
            message: 'Password reset successfully'
        };
    }
}

// Create global auth service instance
window.authService = new AuthService();

// Utility functions for external use
function registerUser(userData) {
    return window.authService.registerUser(userData);
}

function authenticateUser(username, password) {
    return window.authService.authenticateUser(username, password);
}

function oauthLogin(provider) {
    return window.authService.oauthLogin(provider);
}

function oauthSignup(provider) {
    return window.authService.oauthSignup(provider);
}

function logoutUser() {
    window.authService.logout();
}

function getCurrentUser() {
    return window.authService.getCurrentUser();
}

function isAuthenticated() {
    return window.authService.isAuthenticated();
}

function updateUserProfile(userId, updates) {
    return window.authService.updateUserProfile(userId, updates);
}

function deleteUserAccount(userId) {
    return window.authService.deleteUserAccount(userId);
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthService,
        registerUser,
        authenticateUser,
        oauthLogin,
        oauthSignup,
        logoutUser,
        getCurrentUser,
        isAuthenticated,
        updateUserProfile,
        deleteUserAccount
    };
}
