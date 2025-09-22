// Login Screen Manipulation Script
class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.successMessage = document.getElementById('successMessage');

        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRememberedCredentials();
        this.addFormAnimations();
        this.addInputEffects();
    }

    setupEventListeners() {
        // Form submission
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Password toggle
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());

        // Real-time validation
        this.usernameInput.addEventListener('input', () => this.validateUsername());
        this.passwordInput.addEventListener('input', () => this.validatePassword());

        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });

        // Forgot password
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Sign up link
        document.querySelector('.signup-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        // Clear previous errors
        this.clearErrors();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        // Show loading state
        this.showLoadingState();

        try {
            const user = await this.authenticateUser(username, password);

            if (user) {
                this.handleSuccessfulLogin(user);
            } else {
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.handleFailedLogin();
        }
    }

    validateForm() {
        let isValid = true;

        if (!this.validateUsername()) {
            isValid = false;
        }

        if (!this.validatePassword()) {
            isValid = false;
        }

        return isValid;
    }

    validateUsername() {
        const username = this.usernameInput.value.trim();
        const errorElement = document.getElementById('usernameError');

        if (username.length < 3) {
            this.showError(errorElement, 'Username must be at least 3 characters long');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showError(errorElement, 'Username can only contain letters, numbers, and underscores');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const errorElement = document.getElementById('passwordError');

        if (password.length < 6) {
            this.showError(errorElement, 'Password must be at least 6 characters long');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    async authenticateUser(username, password) {
        // Use the auth service for authentication
        const result = await window.authService.authenticateUser(username, password);

        if (result.success) {
            return result.user;
        } else {
            throw new Error(result.error || 'Authentication failed');
        }
    }

    handleSuccessfulLogin(user) {
        // Save credentials if remember me is checked
        if (this.rememberMeCheckbox.checked) {
            this.saveCredentials(user.username);
        }

        // Show success message
        this.showSuccessMessage();

        // Store user session
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // Redirect after delay
        setTimeout(() => {
            this.redirectToDashboard();
        }, 2000);
    }

    handleFailedLogin() {
        this.showLoginError('Invalid username or password');
        this.resetLoadingState();
    }

    showLoadingState() {
        const btn = this.loginForm.querySelector('.login-btn');
        btn.textContent = 'Signing In...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }

    resetLoadingState() {
        const btn = this.loginForm.querySelector('.login-btn');
        btn.textContent = 'Sign In';
        btn.disabled = false;
        btn.style.opacity = '1';
    }

    showSuccessMessage() {
        this.successMessage.classList.add('show');
    }

    redirectToDashboard() {
        // In a real application, redirect to dashboard
        alert('Welcome! You would now be redirected to your dashboard.');
        this.successMessage.classList.remove('show');
    }

    showLoginError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
            border: 1px solid #fcc;
        `;

        this.loginForm.insertBefore(errorDiv, this.loginForm.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.togglePasswordBtn.innerHTML = isPassword ? '<span class="eye-icon">🙈</span>' : '<span class="eye-icon">👁️</span>';
    }

    async handleSocialLogin(e) {
        const button = e.currentTarget;
        const provider = button.classList.contains('google-btn') ? 'google' : 'github';

        this.showLoadingState();

        try {
            // Use the auth service for OAuth login
            const result = await window.authService.oauthLogin(provider);

            if (result.success) {
                this.handleSuccessfulLogin(result.user);
            } else {
                this.showLoginError(result.error || `${provider} login failed`);
                this.resetLoadingState();
            }
        } catch (error) {
            console.error('OAuth login error:', error);
            this.showLoginError(`${provider} login failed: ${error.message}`);
            this.resetLoadingState();
        }
    }

    handleForgotPassword() {
        const email = prompt('Please enter your email address:');
        if (email && this.isValidEmail(email)) {
            alert('Password reset instructions have been sent to your email.');
        } else if (email) {
            alert('Please enter a valid email address.');
        }
    }

    handleSignUp() {
        alert('Sign up functionality would redirect to registration page.');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    saveCredentials(username) {
        localStorage.setItem('rememberedUsername', username);
    }

    loadRememberedCredentials() {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            this.usernameInput.value = rememberedUsername;
            this.rememberMeCheckbox.checked = true;
        }
    }

    loadUsers() {
        // Default users for demo purposes
        const defaultUsers = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'user', password: 'user123', role: 'user' },
            { username: 'demo', password: 'demo123', role: 'user' }
        ];

        // Try to load from localStorage
        const savedUsers = localStorage.getItem('loginUsers');
        if (savedUsers) {
            return JSON.parse(savedUsers);
        }

        // Save default users
        localStorage.setItem('loginUsers', JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    addFormAnimations() {
        // Add shake animation for errors
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .error { animation: shake 0.3s ease-in-out; }
        `;
        document.head.appendChild(style);
    }

    addInputEffects() {
        // Add floating label effect
        const inputs = this.loginForm.querySelectorAll('input[type="text"], input[type="password"]');

        inputs.forEach(input => {
            const label = input.previousElementSibling;

            input.addEventListener('focus', () => {
                label.style.transform = 'translateY(-5px)';
                label.style.fontSize = '12px';
                label.style.color = '#667eea';
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    label.style.transform = 'translateY(0)';
                    label.style.fontSize = '14px';
                    label.style.color = '#333';
                }
            });

            // Check if input has value on load
            if (input.value) {
                label.style.transform = 'translateY(-5px)';
                label.style.fontSize = '12px';
                label.style.color = '#667eea';
            }
        });
    }

    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.parentElement.classList.add('error');
    }

    clearError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
            element.parentElement.classList.remove('error');
        }
    }

    clearErrors() {
        const errorElements = this.loginForm.querySelectorAll('.error-message');
        errorElements.forEach(element => this.clearError(element));

        const errorDivs = this.loginForm.querySelectorAll('.login-error');
        errorDivs.forEach(div => div.remove());
    }

    // Public methods for external manipulation
    addUser(username, password, role = 'user') {
        this.users.push({ username, password, role });
        localStorage.setItem('loginUsers', JSON.stringify(this.users));
    }

    removeUser(username) {
        this.users = this.users.filter(user => user.username !== username);
        localStorage.setItem('loginUsers', JSON.stringify(this.users));
    }

    getCurrentUser() {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.loginForm.reset();
        this.clearErrors();
    }
}

// Utility functions for external use
function createLoginScreen() {
    return new LoginManager();
}

function showLoginModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        ">
            <div style="
                background: white; padding: 30px; border-radius: 15px;
                max-width: 400px; width: 90%;
            ">
                <h2 style="margin-bottom: 20px; text-align: center;">Quick Login</h2>
                <p style="text-align: center; margin-bottom: 20px; color: #666;">
                    Demo credentials:<br>
                    Username: admin | Password: admin123<br>
                    Username: user | Password: user123<br>
                    Username: demo | Password: demo123
                </p>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="
                            background: #667eea; color: white; border: none;
                            padding: 10px 20px; border-radius: 8px; cursor: pointer;
                            width: 100%;
                        ">
                    Got it!
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoginManager, createLoginScreen, showLoginModal };
}
