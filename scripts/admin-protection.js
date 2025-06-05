// admin-protection.js - SECURE VERSION (No hardcoded passwords!)

class AdminProtection {
    constructor() {
        // NO PASSWORD STORED IN CODE!
        // Password will be set dynamically or use hash verification
        
        this.isAdminMode = false;
        this.adminFeatures = {
            spotify: false,
            devlog: false,
            blog: false,
            contact: false,
            general: false
        };
        
        // Use password hash instead of plaintext (more secure)
        // This is a SHA-256 hash - you'll set this via console or config
        this.passwordHash = this.getPasswordHash();
        
        // Initialize protection immediately
        this.init();
    }

    getPasswordHash() {
        // Try to get from environment variable or localStorage config
        return localStorage.getItem('admin_password_hash') || 
               // Fallback: prompt admin to set password on first use
               null;
    }

    async hashPassword(password) {
        // Use Web Crypto API to create secure hash
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    init() {
        // Check for admin attempts BEFORE anything else loads
        this.checkAdminAttempt();
        
        // Set up protection monitoring
        this.setupProtection();
        
        // Clean URL if admin mode was activated
        this.cleanUrl();
    }

    async checkAdminAttempt() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasAdminParam = urlParams.has('admin') || 
                             urlParams.has('owner') || 
                             urlParams.has('secret') ||
                             window.location.hostname === 'localhost';
        
        // Check if already authenticated
        const storedAuth = localStorage.getItem('admin_authenticated');
        const storedTimestamp = localStorage.getItem('admin_timestamp');
        
        // Session expires after 24 hours
        const sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
        const isSessionValid = storedAuth === 'true' && 
                               storedTimestamp && 
                               (Date.now() - parseInt(storedTimestamp)) < sessionExpiry;

        if (isSessionValid) {
            console.log('🔑 Valid admin session found');
            this.activateAdminMode();
            return;
        }

        if (hasAdminParam) {
            console.log('🚨 Admin access attempt detected');
            
            // If no password hash is set, prompt to set one first
            if (!this.passwordHash) {
                await this.setupInitialPassword();
            } else {
                this.promptForPassword();
            }
        }
    }

    async setupInitialPassword() {
        const modal = this.createSetupModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const passwordInput = modal.querySelector('.setup-password-input');
            if (passwordInput) passwordInput.focus();
        }, 100);
    }

    createSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-setup-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: 'Work Sans', sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2e2e2e 0%, #1e1e1e 100%);
                padding: 2rem;
                border-radius: 12px;
                border: 2px solid rgba(255, 200, 100, 0.6);
                box-shadow: 0 0 30px rgba(255, 200, 100, 0.4);
                text-align: center;
                max-width: 450px;
                width: 90%;
            ">
                <h3 style="
                    color: #ffffff;
                    margin-bottom: 1rem;
                    font-family: 'Bebas Neue', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                ">🔐 First Time Setup</h3>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    line-height: 1.4;
                ">Set your admin password for this website.<br>
                <strong>Choose something secure!</strong></p>
                
                <input type="password" class="setup-password-input" style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid rgba(255, 200, 100, 0.3);
                    border-radius: 6px;
                    background: #1a1a1a;
                    color: #ffffff;
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                    box-sizing: border-box;
                " placeholder="Enter new admin password...">
                
                <input type="password" class="setup-confirm-input" style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid rgba(255, 200, 100, 0.3);
                    border-radius: 6px;
                    background: #1a1a1a;
                    color: #ffffff;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                " placeholder="Confirm password...">
                
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="setup-submit-btn" style="
                        background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
                        color: #ffffff;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    ">Set Password</button>
                    
                    <button class="setup-cancel-btn" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: #ffffff;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Cancel</button>
                </div>
                
                <div class="setup-error-msg" style="
                    color: #ff6b6b;
                    margin-top: 1rem;
                    font-size: 0.85rem;
                    display: none;
                "></div>
                
                <div style="
                    background: rgba(255, 200, 100, 0.1);
                    border: 1px solid rgba(255, 200, 100, 0.3);
                    border-radius: 6px;
                    padding: 0.75rem;
                    margin-top: 1rem;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.3;
                ">
                    💡 <strong>Tips:</strong><br>
                    • Use 8+ characters<br>
                    • Mix letters, numbers & symbols<br>
                    • This is stored securely in your browser
                </div>
            </div>
        `;

        // Add event listeners
        const passwordInput = modal.querySelector('.setup-password-input');
        const confirmInput = modal.querySelector('.setup-confirm-input');
        const submitBtn = modal.querySelector('.setup-submit-btn');
        const cancelBtn = modal.querySelector('.setup-cancel-btn');
        const errorMsg = modal.querySelector('.setup-error-msg');

        const attemptSetup = async () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            if (password.length < 8) {
                this.showError(errorMsg, 'Password must be at least 8 characters long');
                return;
            }
            
            if (password !== confirm) {
                this.showError(errorMsg, 'Passwords do not match');
                return;
            }
            
            // Hash and store the password
            try {
                this.passwordHash = await this.hashPassword(password);
                localStorage.setItem('admin_password_hash', this.passwordHash);
                
                modal.remove();
                this.authenticateAdmin();
                
                console.log('🔐 Admin password set successfully');
            } catch (error) {
                this.showError(errorMsg, 'Failed to set password. Please try again.');
                console.error('Password setup error:', error);
            }
        };

        submitBtn.addEventListener('click', attemptSetup);
        
        [passwordInput, confirmInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptSetup();
            });
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            this.redirectToHome();
        });

        return modal;
    }

    promptForPassword() {
        const modal = this.createPasswordModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const passwordInput = modal.querySelector('.admin-password-input');
            if (passwordInput) passwordInput.focus();
        }, 100);
    }

    createPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-password-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: 'Work Sans', sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2e2e2e 0%, #1e1e1e 100%);
                padding: 2rem;
                border-radius: 12px;
                border: 2px solid rgba(255, 200, 100, 0.6);
                box-shadow: 0 0 30px rgba(255, 200, 100, 0.4);
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="
                    color: #ffffff;
                    margin-bottom: 1rem;
                    font-family: 'Bebas Neue', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                ">🔒 Admin Access</h3>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                ">Enter your admin password:</p>
                
                <input type="password" class="admin-password-input" style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid rgba(255, 200, 100, 0.3);
                    border-radius: 6px;
                    background: #1a1a1a;
                    color: #ffffff;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                " placeholder="Enter password...">
                
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="admin-submit-btn" style="
                        background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
                        color: #ffffff;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    ">Enter</button>
                    
                    <button class="admin-cancel-btn" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: #ffffff;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Cancel</button>
                </div>
                
                <div class="admin-error-msg" style="
                    color: #ff6b6b;
                    margin-top: 1rem;
                    font-size: 0.85rem;
                    display: none;
                "></div>
            </div>
        `;

        // Add event listeners
        const passwordInput = modal.querySelector('.admin-password-input');
        const submitBtn = modal.querySelector('.admin-submit-btn');
        const cancelBtn = modal.querySelector('.admin-cancel-btn');
        const errorMsg = modal.querySelector('.admin-error-msg');

        const attemptLogin = async () => {
            const password = passwordInput.value;
            const isValid = await this.validatePassword(password);
            
            if (isValid) {
                this.authenticateAdmin();
                modal.remove();
            } else {
                this.logFailedAttempt();
                this.showError(errorMsg, 'Incorrect password. Access denied.');
                passwordInput.value = '';
                passwordInput.style.borderColor = '#ff6b6b';
                
                setTimeout(() => {
                    passwordInput.style.borderColor = 'rgba(255, 200, 100, 0.3)';
                    errorMsg.style.display = 'none';
                }, 2000);
            }
        };

        submitBtn.addEventListener('click', attemptLogin);
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            this.redirectToHome();
        });

        // Prevent modal from closing by clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                passwordInput.focus();
            }
        });

        return modal;
    }

    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    async validatePassword(inputPassword) {
        if (!this.passwordHash) return false;
        
        try {
            const inputHash = await this.hashPassword(inputPassword);
            return inputHash === this.passwordHash;
        } catch (error) {
            console.error('Password validation error:', error);
            return false;
        }
    }

    authenticateAdmin() {
        this.isAdminMode = true;
        
        // Store authentication with timestamp
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_timestamp', Date.now().toString());
        
        // Enable all admin features
        Object.keys(this.adminFeatures).forEach(feature => {
            this.adminFeatures[feature] = true;
        });

        console.log('🔑 Admin mode activated successfully');
        
        // Show success message
        this.showSuccessMessage();
        
        // Reload page to apply admin features
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
            color: #ffffff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
            z-index: 100000;
            font-family: 'Work Sans', sans-serif;
            font-weight: 600;
        `;
        successDiv.textContent = '✅ Admin access granted!';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    logFailedAttempt() {
        const attempts = parseInt(localStorage.getItem('admin_failed_attempts') || '0') + 1;
        localStorage.setItem('admin_failed_attempts', attempts.toString());
        localStorage.setItem('admin_last_attempt', Date.now().toString());
        
        console.warn(`🚨 Failed admin login attempt #${attempts}`);
        
        if (attempts >= 5) {
            this.implementRateLimit();
        }
    }

    implementRateLimit() {
        const lastAttempt = parseInt(localStorage.getItem('admin_last_attempt') || '0');
        const lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        if (Date.now() - lastAttempt < lockoutTime) {
            alert('Too many failed attempts. Please try again later.');
            this.redirectToHome();
        }
    }

    redirectToHome() {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.location.href = cleanUrl;
    }

    cleanUrl() {
        if (this.isAdminMode) {
            const url = new URL(window.location);
            url.searchParams.delete('admin');
            url.searchParams.delete('owner');
            url.searchParams.delete('secret');
            window.history.replaceState({}, document.title, url.toString());
        }
    }

    setupProtection() {
        window.addEventListener('popstate', () => {
            this.checkAdminAttempt();
        });
    }

    // Public methods
    isAdmin() {
        return this.isAdminMode;
    }

    hasAdminFeature(feature) {
        return this.isAdminMode && this.adminFeatures[feature];
    }

    // Admin logout
    logout() {
        this.isAdminMode = false;
        Object.keys(this.adminFeatures).forEach(feature => {
            this.adminFeatures[feature] = false;
        });
        
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_timestamp');
        localStorage.removeItem('spotify_owner_mode');
        
        console.log('🔓 Admin logged out');
        window.location.reload();
    }

    // Reset password (for admin only)
    async resetPassword() {
        if (!this.isAdmin()) return;
        
        const newPassword = prompt('Enter new admin password:');
        if (newPassword && newPassword.length >= 8) {
            try {
                this.passwordHash = await this.hashPassword(newPassword);
                localStorage.setItem('admin_password_hash', this.passwordHash);
                alert('Password updated successfully!');
                console.log('🔐 Admin password updated');
            } catch (error) {
                alert('Failed to update password');
                console.error('Password update error:', error);
            }
        } else {
            alert('Password must be at least 8 characters long');
        }
    }

    // Add admin indicator
    addAdminIndicator() {
        if (!this.isAdminMode) return;
        
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(29, 185, 84, 0.9);
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            z-index: 100000;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            user-select: none;
        `;
        indicator.innerHTML = '🔑 ADMIN MODE';
        indicator.title = 'Click to logout or right-click for options';
        
        indicator.addEventListener('click', () => {
            if (confirm('Logout from admin mode?')) {
                this.logout();
            }
        });
        
        indicator.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const action = confirm('Choose action:\nOK = Change Password\nCancel = Logout');
            if (action) {
                this.resetPassword();
            } else {
                this.logout();
            }
        });
        
        document.body.appendChild(indicator);
    }
}

// Initialize admin protection IMMEDIATELY
const adminProtection = new AdminProtection();

// Make it globally available
window.adminProtection = adminProtection;

// Add admin indicator after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    if (adminProtection.isAdmin()) {
        adminProtection.addAdminIndicator();
    }
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminProtection;
}