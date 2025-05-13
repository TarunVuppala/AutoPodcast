/**
 * Authentication and licensing system for Multi-Camera Edit Tool
 */

// Store for authentication state
const authState = {
    apiKey: null,
    isAuthenticated: false,
    lastVerified: null,
    verificationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    error: null,
}

// Load API key from localStorage
function loadApiKey() {
    try {
        const savedAuth = localStorage.getItem("timbreAuth")
        if (savedAuth) {
            const parsedAuth = JSON.parse(savedAuth)
            authState.apiKey = parsedAuth.apiKey
            authState.isAuthenticated = parsedAuth.isAuthenticated
            authState.lastVerified = parsedAuth.lastVerified ? new Date(parsedAuth.lastVerified) : null

            console.log("Auth state loaded from storage")
            return true
        }
        return false
    } catch (error) {
        console.error("Error loading auth state:", error)
        return false
    }
}

// Save API key to localStorage
function saveApiKey() {
    try {
        localStorage.setItem(
            "timbreAuth",
            JSON.stringify({
                apiKey: authState.apiKey,
                isAuthenticated: authState.isAuthenticated,
                lastVerified: authState.lastVerified ? authState.lastVerified.toISOString() : null,
            }),
        )
        console.log("Auth state saved to storage")
    } catch (error) {
        console.error("Error saving auth state:", error)
    }
}

// Clear authentication state
function clearAuthState() {
    authState.apiKey = null
    authState.isAuthenticated = false
    authState.lastVerified = null
    authState.error = null

    try {
        localStorage.removeItem("timbreAuth")
        console.log("Auth state cleared")
    } catch (error) {
        console.error("Error clearing auth state:", error)
    }
}

// Verify API key with server
async function verifyApiKey(apiKey) {
    try {
        // In a real implementation, this would make an actual API call to your server
        // For now, we'll simulate a verification process

        console.log("Verifying API key:", apiKey)

        // Simulate API call with a delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // For demo purposes, consider these as valid keys
        const validKeys = ["DEMO-KEY-123", "PREMIUM-KEY-456", "TIMBRE-PRO-789"]

        if (validKeys.includes(apiKey)) {
            authState.apiKey = apiKey
            authState.isAuthenticated = true
            authState.lastVerified = new Date()
            authState.error = null
            saveApiKey()
            return true
        } else {
            authState.error = "Invalid API key. Please check and try again."
            return false
        }
    } catch (error) {
        console.error("API key verification failed:", error)
        authState.error = "Verification failed. Please check your internet connection and try again."
        return false
    }
}

// Check if verification is needed (on startup or monthly)
function needsVerification() {
    if (!authState.isAuthenticated || !authState.lastVerified) {
        return true
    }

    const now = new Date()
    const timeSinceLastVerification = now.getTime() - authState.lastVerified.getTime()

    return timeSinceLastVerification > authState.verificationInterval
}

// Export functions
window.TimbreAuth = {
    loadApiKey,
    verifyApiKey,
    needsVerification,
    clearAuthState,
    getAuthState: () => ({ ...authState }),
}

// Auth UI functions
window.TimbreAuthUI = {
    // Check authentication status and show modal if needed
    checkAuthStatus: function () {
        const loaded = loadApiKey()

        if (!loaded || !authState.isAuthenticated || needsVerification()) {
            // Show auth modal
            this.showAuthModal()
            return false
        }

        this.showApp()
        return true
    },

    // Show the auth modal
    showAuthModal: () => {
        const authModal = document.getElementById("authModal")
        if (authModal) {
            authModal.style.display = "flex"
        }

        // Hide the app content
        const appContent = document.getElementById("appContent")
        if (appContent) {
            appContent.style.display = "none"
        }
    },

    // Close the auth modal
    closeAuthModal: () => {
        const authModal = document.getElementById("authModal")
        if (authModal) {
            authModal.classList.add("closing")
            setTimeout(() => {
                authModal.style.display = "none"
                authModal.classList.remove("closing")
            }, 300)
        }
    },

    // Show the main app
    showApp: function () {
        const appContent = document.getElementById("appContent")
        if (appContent) {
            appContent.style.display = "block"
        }

        this.closeAuthModal()
    },

    // Show a toast notification for auth events
    showAuthToast: (message, type = "info") => {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById("authToastContainer")
        if (!toastContainer) {
            toastContainer = document.createElement("div")
            toastContainer.id = "authToastContainer"
            toastContainer.className = "auth-toast-container"
            document.body.appendChild(toastContainer)
        }

        // Create toast element
        const toast = document.createElement("div")
        toast.className = `auth-toast ${type}`

        // Add icon based on type
        let iconSvg = ""
        switch (type) {
            case "success":
                iconSvg =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
                break
            case "error":
                iconSvg =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
                break
            case "warning":
                iconSvg =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
                break
            default: // info
                iconSvg =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        }

        // Create toast content
        toast.innerHTML = `
      <div class="auth-toast-icon">${iconSvg}</div>
      <div class="auth-toast-content">
        <div class="auth-toast-message">${message}</div>
      </div>
    `

        // Add to container
        toastContainer.appendChild(toast)

        // Remove after animation completes
        setTimeout(() => {
            toast.classList.add("fade-out")
            setTimeout(() => {
                toast.remove()
            }, 300)
        }, 5000)
    },
}

// Set up event listeners for the auth modal when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Verify key button
    const verifyKeyBtn = document.getElementById("verifyKeyBtn")
    if (verifyKeyBtn) {
        verifyKeyBtn.addEventListener("click", async () => {
            const apiKeyInput = document.getElementById("apiKey")
            const apiKeyError = document.getElementById("apiKeyError")
            const apiKey = apiKeyInput.value.trim()

            if (!apiKey) {
                apiKeyError.textContent = "Please enter a license key"
                apiKeyInput.classList.add("error")
                return
            }

            // Show loading state
            verifyKeyBtn.disabled = true
            verifyKeyBtn.innerHTML = `
        <svg class="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        Verifying...
      `

            // Verify the API key
            const isValid = await verifyApiKey(apiKey)

            // Reset button state
            verifyKeyBtn.disabled = false
            verifyKeyBtn.textContent = "Activate License"

            if (isValid) {
                // Close the modal and show success message
                window.TimbreAuthUI.closeAuthModal()
                window.TimbreAuthUI.showAuthToast("License activated successfully!", "success")

                // Show the app
                window.TimbreAuthUI.showApp()
            } else {
                // Show error message
                apiKeyError.textContent = authState.error || "Invalid license key"
                apiKeyInput.classList.add("error")
            }
        })
    }

    // Input focus/blur events
    const apiKeyInput = document.getElementById("apiKey")
    if (apiKeyInput) {
        apiKeyInput.addEventListener("focus", () => {
            apiKeyInput.classList.remove("error")
            document.getElementById("apiKeyError").textContent = ""
        })
    }

    // License button
    const licenseBtn = document.getElementById("licenseBtn")
    if (licenseBtn) {
        licenseBtn.addEventListener("click", () => {
            window.TimbreAuthUI.showAuthModal()
        })
    }
})
