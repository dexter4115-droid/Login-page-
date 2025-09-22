// Signup Screen Management Script
class SignupManager {
    constructor() {
        this.signupForm = document.getElementById('signupForm');
        this.emailInput = document.getElementById('email');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.termsCheckbox = document.getElementById('terms');
        this.successMessage = document.getElementById('successMessage');

        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addFormAnimations();
        this.addInputEffects();
    }

    setupEventListeners() {
        // Form submission
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));

        // Password toggle
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility('password');
        });

        document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
            this.togglePasswordVisibility('confirmPassword');
        });

        // Real-time validation
        this.emailInput.addEventListener('input', () => this.validateEmail());
        this.usernameInput.addEventListener('input', () => this.validateUsername());
        this.passwordInput.addEventListener('input', () => this.validatePassword());
        this.confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());

        // Social signup buttons
        document.getElementById('googleSignup').addEventListener('click', () => {
            this.handleSocialSignup('google');
        });

        document.getElementById('githubSignup').addEventListener('click', () => {
            this.handleSocialSignup('github');
        });

        // Terms and privacy links
        document.querySelectorAll('.terms-link, .privacy-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTermsModal();
            });
        });
    }

    async handleSignup(e) {
        e.preventDefault();

        // Clear previous errors
        this.clearErrors();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        const formData = {
            email: this.emailInput.value.trim(),
            username: this.usernameInput.value.trim(),
            password: this.passwordInput.value,
            newsletter: document.getElementById('newsletter').checked
        };

        // Show loading state
        this.showLoadingState();

        try {
            const result = await this.registerUser(formData);

            if (result.success) {
                this.handleSuccessfulSignup(result.user);
            } else {
                this.handleFailedSignup(result.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.handleFailedSignup(error.message || 'Signup failed');
        }
    }

    validateForm() {
        let isValid = true;

        if (!this.validateEmail()) isValid = false;
        if (!this.validateUsername()) isValid = false;
        if (!this.validatePassword()) isValid = false;
        if (!this.validateConfirmPassword()) isValid = false;
        if (!this.validateTerms()) isValid = false;

        return isValid;
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const errorElement = document.getElementById('emailError');

        if (!email) {
            this.showError(errorElement, 'Email is required');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError(errorElement, 'Please enter a valid email address');
            return false;
        }

        if (this.isEmailTaken(email)) {
            this.showError(errorElement, 'This email is already registered');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    validateUsername() {
        const username = this.usernameInput.value.trim();
        const errorElement = document.getElementById('usernameError');

        if (!username) {
            this.showError(errorElement, 'Username is required');
            return false;
        }

        if (username.length < 3) {
            this.showError(errorElement, 'Username must be at least 3 characters long');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showError(errorElement, 'Username can only contain letters, numbers, and underscores');
            return false;
        }

        if (this.isUsernameTaken(username)) {
            this.showError(errorElement, 'This username is already taken');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const errorElement = document.getElementById('passwordError');

        if (!password) {
            this.showError(errorElement, 'Password is required');
            return false;
        }

        if (password.length < 8) {
            this.showError(errorElement, 'Password must be at least 8 characters long');
            return false;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            this.showError(errorElement, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    validateConfirmPassword() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (!confirmPassword) {
            this.showError(errorElement, 'Please confirm your password');
            return false;
        }

        if (password !== confirmPassword) {
            this.showError(errorElement, 'Passwords do not match');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    validateTerms() {
        const errorElement = document.getElementById('termsError');

        if (!this.termsCheckbox.checked) {
            this.showError(errorElement || this.createTermsError(), 'You must agree to the Terms of Service');
            return false;
        }

        if (errorElement) {
            this.clearError(errorElement);
        }
        return true;
    }

    createTermsError() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'termsError';
        errorDiv.className = 'error-message';
        this.termsCheckbox.parentElement.appendChild(errorDiv);
        return errorDiv;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isEmailTaken(email) {
        return this.users.some(user => user.email === email);
    }

    isUsernameTaken(username) {
        return this.users.some(user => user.username === username);
    }

    async registerUser(formData) {
        // Use the auth service for user registration
        const result = await window.authService.registerUser(formData);

        if (result.success) {
            return { success: true, user: result.user };
        } else {
            return { success: false, message: result.error };
        }
    }

    handleSuccessfulSignup(user) {
        // Show success message
        this.showSuccessMessage();

        // Store user session
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // Redirect after delay
        setTimeout(() => {
            this.redirectToLogin();
        }, 2000);
    }

    handleFailedSignup(message) {
        this.showSignupError(message);
        this.resetLoadingState();
    }

    showLoadingState() {
        const btn = this.signupForm.querySelector('.signup-btn');
        btn.classList.add('loading');
        btn.textContent = 'Creating Account...';
        btn.disabled = true;
    }

    resetLoadingState() {
        const btn = this.signupForm.querySelector('.signup-btn');
        btn.classList.remove('loading');
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }

    showSuccessMessage() {
        this.successMessage.classList.add('show');
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    showSignupError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'signup-error';
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

        this.signupForm.insertBefore(errorDiv, this.signupForm.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    togglePasswordVisibility(inputType) {
        const input = inputType === 'password' ? this.passwordInput : this.confirmPasswordInput;
        const button = inputType === 'password' ?
            document.getElementById('togglePassword') :
            document.getElementById('toggleConfirmPassword');

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.innerHTML = isPassword ? '<span class="eye-icon">🙈</span>' : '<span class="eye-icon">👁️</span>';
    }

    async handleSocialSignup(provider) {
        this.showLoadingState();

        try {
            // Use the auth service for OAuth signup
            const result = await window.authService.oauthSignup(provider);

            if (result.success) {
                this.handleSuccessfulSignup(result.user);
            } else {
                this.showSignupError(result.error || `${provider} signup failed`);
                this.resetLoadingState();
            }
        } catch (error) {
            console.error('OAuth signup error:', error);
            this.showSignupError(`${provider} signup failed: ${error.message}`);
            this.resetLoadingState();
        }
    }

    showTermsModal() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center;
                justify-content: center; z-index: 1000;
            ">
                <div style="
                    background: white; padding: 30px; border-radius: 15px;
                    max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
                ">
                    <h2 style="margin-bottom: 20px; text-align: center;">Terms of Service</h2>
                    <div style="font-size: 14px; line-height: 1.6; color: #666;">
                        <p><strong>1. Acceptance of Terms</strong><br>
                        By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>

                        <p><strong>2. User Account</strong><br>
                        You are responsible for safeguarding your account credentials and for all activities that occur under your account.</p>

                        <p><strong>3. Privacy Policy</strong><br>
                        Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.</p>

                        <p><strong>4. Limitation of Liability</strong><br>
                        In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()"
                            style="
                                background: #667eea; color: white; border: none;
                                padding: 10px 20px; border-radius: 8px; cursor: pointer;
                                width: 100%; margin-top: 20px;
                            ">
                        I Understand
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    addFormAnimations() {
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
        const inputs = this.signupForm.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');

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
        const errorElements = this.signupForm.querySelectorAll('.error-message');
        errorElements.forEach(element => this.clearError(element));

        const errorDivs = this.signupForm.querySelectorAll('.signup-error');
        errorDivs.forEach(div => div.remove());
    }

    loadUsers() {
        const savedUsers = localStorage.getItem('signupUsers');
        return savedUsers ? JSON.parse(savedUsers) : [];
    }

    saveUsers() {
        localStorage.setItem('signupUsers', JSON.stringify(this.users));
    }

    // Public methods for external manipulation
    getUsers() {
        return this.users;
    }

    removeUser(email) {
        this.users = this.users.filter(user => user.email !== email);
        this.saveUsers();
    }
}

// Utility functions for external use
function createSignupScreen() {
    return new SignupManager();
}

function showSignupModal() {
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
                <h2 style="margin-bottom: 20px; text-align: center;">Quick Signup</h2>
                <p style="text-align: center; margin-bottom: 20px; color: #666;">
                    Create your account to get started with our platform.
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
    window.signupManager = new SignupManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SignupManager, createSignupScreen, showSignupModal };
}
