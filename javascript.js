// Login Screen Manipulation Examples and Utilities

// Example usage of the login system
console.log('Login Screen JavaScript Loaded');

// Demo function to show login modal with instructions
function showLoginDemo() {
    showLoginModal();
}

// Function to test login programmatically
function testLogin(username, password) {
    if (window.loginManager) {
        // Fill form
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;

        // Submit form
        const form = document.getElementById('loginForm');
        form.dispatchEvent(new Event('submit'));
    } else {
        console.error('Login manager not initialized');
    }
}

// Function to add a new user programmatically
function addTestUser(username, password, role = 'user') {
    if (window.loginManager) {
        window.loginManager.addUser(username, password, role);
        console.log(`User ${username} added successfully`);
    } else {
        console.error('Login manager not initialized');
    }
}

// Function to switch between different login themes
function switchLoginTheme(theme) {
    const body = document.body;
    const loginCard = document.querySelector('.login-card');

    // Remove existing theme classes
    body.className = body.className.replace(/theme-\w+/g, '');
    loginCard.className = loginCard.className.replace(/theme-\w+/g, '');

    // Add new theme
    body.classList.add(`theme-${theme}`);
    loginCard.classList.add(`theme-${theme}`);

    console.log(`Switched to ${theme} theme`);
}

// Function to export login data
function exportLoginData() {
    if (window.loginManager) {
        const users = window.loginManager.users;
        const currentUser = window.loginManager.getCurrentUser();

        const data = {
            users: users,
            currentUser: currentUser,
            exportDate: new Date().toISOString()
        };

        console.log('Login Data Export:', data);
        return data;
    }
}

// Function to clear all login data
function clearAllLoginData() {
    if (confirm('Are you sure you want to clear all login data? This cannot be undone.')) {
        localStorage.removeItem('loginUsers');
        localStorage.removeItem('rememberedUsername');
        sessionStorage.removeItem('currentUser');

        if (window.loginManager) {
            window.loginManager.users = [];
            window.loginManager.logout();
        }

        alert('All login data cleared successfully');
        location.reload();
    }
}

// Function to simulate different login scenarios
function simulateLoginScenario(scenario) {
    const scenarios = {
        'success': () => testLogin('admin', 'admin123'),
        'invalid-username': () => testLogin('invaliduser', 'admin123'),
        'invalid-password': () => testLogin('admin', 'wrongpassword'),
        'empty-fields': () => testLogin('', ''),
        'short-username': () => testLogin('ab', 'password123'),
        'short-password': () => testLogin('testuser', '12345')
    };

    if (scenarios[scenario]) {
        console.log(`Simulating ${scenario} scenario`);
        scenarios[scenario]();
    } else {
        console.log('Available scenarios:', Object.keys(scenarios));
    }
}

// Function to create a custom login form
function createCustomLoginForm(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id ${containerId} not found`);
        return;
    }

    const defaultOptions = {
        title: 'Custom Login',
        showRememberMe: true,
        showSocialLogin: true,
        theme: 'default'
    };

    const config = { ...defaultOptions, ...options };

    const formHTML = `
        <div class="custom-login-form theme-${config.theme}">
            <h3>${config.title}</h3>
            <form class="custom-form">
                <input type="text" placeholder="Username" class="custom-input" required>
                <input type="password" placeholder="Password" class="custom-input" required>
                ${config.showRememberMe ? '<label><input type="checkbox"> Remember me</label>' : ''}
                <button type="submit" class="custom-btn">Login</button>
                ${config.showSocialLogin ? '<div class="social-login"><p>Or login with:</p><button type="button">Google</button></div>' : ''}
            </form>
        </div>
    `;

    container.innerHTML = formHTML;

    // Add basic styling
    const style = document.createElement('style');
    style.textContent = `
        .custom-login-form {
            max-width: 300px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
        }
        .custom-input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .custom-btn {
            width: 100%;
            padding: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .social-login {
            margin-top: 15px;
            text-align: center;
        }
        .social-login button {
            background: #db4437;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin: 5px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    console.log(`Custom login form created in ${containerId}`);
}

// Console commands for easy testing
console.log('=== Login Screen Console Commands ===');
console.log('showLoginDemo() - Show demo modal with instructions');
console.log('testLogin("username", "password") - Test login with credentials');
console.log('addTestUser("username", "password", "role") - Add new user');
console.log('switchLoginTheme("theme-name") - Switch login theme');
console.log('exportLoginData() - Export current login data');
console.log('clearAllLoginData() - Clear all stored login data');
console.log('simulateLoginScenario("scenario-name") - Test different login scenarios');
console.log('createCustomLoginForm("container-id", options) - Create custom login form');
console.log('');
console.log('Available test scenarios: success, invalid-username, invalid-password, empty-fields, short-username, short-password');
console.log('');
console.log('Demo credentials:');
console.log('- admin / admin123');
console.log('- user / user123');
console.log('- demo / demo123');

// Auto-show demo modal after 2 seconds
setTimeout(() => {
    if (window.location.pathname.includes('login.html')) {
        console.log('Login page detected - showing demo modal in 2 seconds...');
        setTimeout(showLoginDemo, 2000);
    }
}, 1000);
