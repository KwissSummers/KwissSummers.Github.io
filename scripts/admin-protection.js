// admin-protection.js - SECURE SERVER-SIDE VERSION

class SecureAdminProtection {
    constructor() {
        this.isAdminMode = false;
        this.adminFeatures = {
            spotify: false,
            devlog: false,
            blog: false,
            contact: false,
            general: false
        };
        
        // Initialize protection
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('🔐 Secure admin protection initializing...');
        this.checkAdminAttempt();
        this.setupProtection();
        this.cleanUrl();
    }

    async checkAdminAttempt() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasAdminParam = urlParams.has('admin') || 
                             urlParams.has('owner') || 
                             urlParams.has('secret') ||
                             window.location.hostname === 'localhost';
        
        // First, check if already authenticated via server
        const isAuthenticated = await this.verifyServerAuth();
        
        if (isAuthenticated) {
            console.log('🔑 Valid server session found');
            this.activateAdminModeQuiet();
            return;
        }

        if (hasAdminParam) {
            console.log('🚨 Admin access attempt detected');
            this.promptForPassword();
        }
    }

    // Check authentication status with server
    async verifyServerAuth() {
        try {
            const response = await fetch('/api/admin-verify', {
                method: 'GET',
                credentials: 'include' // Include cookies
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.admin === true;
            }
            
            return false;
        } catch (error) {
            console.log('🔐 Server auth check failed:', error);
            return false;
        }
    }

    promptForPassword() {
        if (!document.body) {
            setTimeout(() => this.promptForPassword(), 100);
            return;
        }

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
                    font-family: 'Bebas Neue', Arial, sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                ">🔒 Admin Access</h3>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                ">Enter admin password:</p>
                
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
                    🔐 <strong>Secure Authentication</strong><br>
                    Password verified server-side for maximum security
                </div>
            </div>
        `;

        this.attachPasswordEventListeners(modal);
        return modal;
    }

    attachPasswordEventListeners(modal) {
        const passwordInput = modal.querySelector('.admin-password-input');
        const submitBtn = modal.querySelector('.admin-submit-btn');
        const cancelBtn = modal.querySelector('.admin-cancel-btn');
        const errorMsg = modal.querySelector('.admin-error-msg');

        const attemptLogin = async () => {
            const password = passwordInput.value;
            
            if (!password) {
                this.showError(errorMsg, 'Password required');
                return;
            }
            
            // Disable button during request
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            try {
                const response = await fetch('/api/admin-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Include cookies
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    // Success!
                    this.authenticateAdmin();
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                } else {
                    // Failed
                    const data = await response.json();
                    this.logFailedAttempt();
                    this.showError(errorMsg, data.error || 'Authentication failed');
                    passwordInput.value = '';
                    passwordInput.style.borderColor = '#ff6b6b';
                    
                    setTimeout(() => {
                        passwordInput.style.borderColor = 'rgba(255, 200, 100, 0.3)';
                        errorMsg.style.display = 'none';
                    }, 2000);
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showError(errorMsg, 'Network error. Please try again.');
            }
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enter';
        };

        if (submitBtn) submitBtn.addEventListener('click', attemptLogin);
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.redirectToHome();
            });
        }

        // Prevent closing by clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal && passwordInput) {
                passwordInput.focus();
            }
        });
    }

    showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    activateAdminModeQuiet() {
        this.isAdminMode = true;
        
        // Enable all admin features
        Object.keys(this.adminFeatures).forEach(feature => {
            this.adminFeatures[feature] = true;
        });

        console.log('🔑 Admin session restored');
    }

    authenticateAdmin() {
        this.isAdminMode = true;
        
        // Enable all admin features
        Object.keys(this.adminFeatures).forEach(feature => {
            this.adminFeatures[feature] = true;
        });

        console.log('🔑 Admin mode activated successfully');
        this.showSuccessMessage();
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    showSuccessMessage() {
        if (!document.body) return;

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
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    logFailedAttempt() {
        // Client-side logging for rate limiting
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

    // Server-side logout
    async logout() {
        try {
            await fetch('/api/admin-logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.isAdminMode = false;
        Object.keys(this.adminFeatures).forEach(feature => {
            this.adminFeatures[feature] = false;
        });
        
        // Clear any local storage
        localStorage.removeItem('spotify_owner_mode');
        
        console.log('🔓 Admin logged out');
        window.location.reload();
    }

    addAdminIndicator() {
        if (!this.isAdminMode || !document.body) return;
        
        // Remove existing indicator
        const existing = document.querySelector('.admin-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'admin-indicator';
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
        indicator.innerHTML = '🔑 ADMIN MODE (SECURE)';
        indicator.title = 'Click to logout';
        
        indicator.addEventListener('click', () => {
            if (confirm('Logout from admin mode?')) {
                this.logout();
            }
        });
        
        document.body.appendChild(indicator);
    }
}

// Initialize secure admin protection
const adminProtection = new SecureAdminProtection();
window.adminProtection = adminProtection;

// Add admin indicator after everything loads
window.addEventListener('load', () => {
    if (adminProtection.isAdmin()) {
        adminProtection.addAdminIndicator();
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureAdminProtection;
}