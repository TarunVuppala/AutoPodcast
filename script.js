/**
 * Multi-Camera Edit Tool with Integrated Error Handling
 * JavaScript functionality for the Timbre Panel interface
 */

// Error severity levels
const ErrorSeverity = {
  LOW: "low", // Warnings - things that might cause issues
  MEDIUM: "medium", // Errors - things that will cause problems
  HIGH: "high", // Critical errors - major functionality broken
  CRITICAL: "critical", // System errors - complete failure
}

// Error categories with specific codes
const ErrorCodes = {
  // Authentication errors (1000-1099)
  AUTH_INVALID_KEY: 1001,
  AUTH_NETWORK_ERROR: 1002,
  AUTH_EXPIRED_TRIAL: 1003,
  AUTH_DEVICE_LIMIT: 1004,
  AUTH_INVALID_EMAIL: 1005,
  AUTH_SERVER_ERROR: 1006,

  // Premiere Pro integration errors (1100-1199)
  PPRO_NOT_CONNECTED: 1101,
  PPRO_NO_SEQUENCE: 1102,
  PPRO_TRACK_ACCESS_ERROR: 1103,
  PPRO_SCRIPT_ERROR: 1104,
  PPRO_VERSION_INCOMPATIBLE: 1105,
  PPRO_NO_PROJECT: 1106,

  // Track validation warnings/errors (1200-1299)
  TRACK_NO_CLIPS: 1201, // Warning - only if assigned
  TRACK_MULTIPLE_CLIPS: 1202, // Warning - only if assigned
  TRACK_DUPLICATE_ASSIGNMENT: 1203, // Error
  TRACK_COUNT_MISMATCH: 1204, // Warning
  TRACK_INVALID_FORMAT: 1205, // Warning
  TRACK_ACCESS_DENIED: 1206, // Error

  // Form validation errors (1300-1399)
  FORM_MISSING_SPEAKER_NAMES: 1301, // Error
  FORM_INVALID_CAMERA_ASSIGNMENT: 1302, // Error
  FORM_INVALID_AUDIO_THRESHOLD: 1303, // Warning
  FORM_INVALID_CUT_DURATION: 1304, // Warning
  FORM_INVALID_FREQUENCY: 1305, // Warning

  // Audio analysis errors (1400-1499)
  AUDIO_ANALYSIS_FAILED: 1401, // Error
  AUDIO_FILE_NOT_FOUND: 1402, // Error
  AUDIO_INVALID_FORMAT: 1403, // Warning
  AUDIO_PROCESSING_TIMEOUT: 1404, // Error
  AUDIO_TOOL_MISSING: 1405, // Critical
  AUDIO_PERMISSION_DENIED: 1406, // Error

  // Storage errors (1500-1599)
  STORAGE_QUOTA_EXCEEDED: 1501, // Warning
  STORAGE_ACCESS_DENIED: 1502, // Warning
  STORAGE_CORRUPTED_DATA: 1503, // Warning
  STORAGE_BROWSER_UNSUPPORTED: 1504, // Warning

  // System errors (1600-1699)
  SYSTEM_OUT_OF_MEMORY: 1601, // Error
  SYSTEM_PERMISSION_DENIED: 1602, // Error
  SYSTEM_UNKNOWN_ERROR: 1603, // Error
  SYSTEM_BROWSER_INCOMPATIBLE: 1604, // Warning
}

// Error definitions with appropriate severity levels
const ErrorDefinitions = {
  [ErrorCodes.AUTH_INVALID_KEY]: {
    severity: ErrorSeverity.HIGH,
    title: "Invalid License Key",
    message: "Your license key is invalid. Please check and try again.",
    recoverySteps: [
      "Double-check your license key for typos",
      "Verify the email address matches your purchase",
      "Contact support if the key should be valid",
    ],
  },

  [ErrorCodes.AUTH_NETWORK_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    title: "Network Error",
    message: "Cannot connect to license server. Check your internet connection.",
    recoverySteps: [
      "Check your internet connection",
      "Try again in a few moments",
      "Use 'Start Free Trial' if you need immediate access",
    ],
    autoRecovery: true,
    retryDelay: 5000,
    maxRetries: 3,
  },

  [ErrorCodes.AUTH_DEVICE_LIMIT]: {
    severity: ErrorSeverity.HIGH,
    title: "Device Limit Reached",
    message: "Your license is already active on the maximum number of devices.",
    recoverySteps: [
      "Log into your account to manage device activations",
      "Deactivate unused devices",
      "Contact support for device transfer",
    ],
  },

  [ErrorCodes.AUTH_EXPIRED_TRIAL]: {
    severity: ErrorSeverity.HIGH,
    title: "Trial Period Expired",
    message: "Your 14-day trial period has ended.",
    recoverySteps: [
      "Visit our website to purchase a full license",
      "Check your email for any license keys from previous purchases",
    ],
  },

  [ErrorCodes.PPRO_NOT_CONNECTED]: {
    severity: ErrorSeverity.CRITICAL,
    title: "Premiere Pro Connection Lost",
    message: "Cannot communicate with Premiere Pro.",
    recoverySteps: ["Close and reopen the Timbre panel", "Restart Premiere Pro if needed"],
    autoRecovery: true,
    retryDelay: 3000,
    maxRetries: 2,
  },

  [ErrorCodes.PPRO_NO_SEQUENCE]: {
    severity: ErrorSeverity.HIGH,
    title: "No Active Sequence",
    message: "Please open or create a sequence in Premiere Pro.",
    recoverySteps: [
      "Create a new sequence: File > New > Sequence",
      "Open an existing sequence from your project panel",
    ],
  },

  [ErrorCodes.TRACK_NO_CLIPS]: {
    severity: ErrorSeverity.LOW, // Warning - only matters if assigned
    title: "Empty Track Warning",
    message: "Assigned track has no clips. Each assigned track needs exactly one clip.",
    recoverySteps: ["Add a clip to this track", "Assign camera to a different track that has clips"],
  },

  [ErrorCodes.TRACK_MULTIPLE_CLIPS]: {
    severity: ErrorSeverity.LOW, // Warning - only matters if assigned
    title: "Multiple Clips Warning",
    message: "Assigned track has multiple clips. Each track should have exactly one clip.",
    recoverySteps: [
      "Merge clips using Clip > Merge Clips",
      "Move extra clips to unused tracks",
      "Use a different track with only one clip",
    ],
  },

  [ErrorCodes.TRACK_DUPLICATE_ASSIGNMENT]: {
    severity: ErrorSeverity.MEDIUM, // Error - will cause problems
    title: "Duplicate Track Assignment",
    message: "Multiple cameras assigned to the same track.",
    recoverySteps: ["Assign each camera to a different track", "Add more tracks if needed: Sequence > Add Tracks"],
  },

  [ErrorCodes.TRACK_COUNT_MISMATCH]: {
    severity: ErrorSeverity.LOW, // Warning - might cause issues
    title: "Track Count Mismatch",
    message: "Different numbers of video and audio tracks detected.",
    recoverySteps: [
      "Add tracks to match: Sequence > Add Tracks",
      "You can still proceed but be careful with assignments",
    ],
  },

  [ErrorCodes.FORM_MISSING_SPEAKER_NAMES]: {
    severity: ErrorSeverity.MEDIUM, // Error - required for functionality
    title: "Missing Speaker Names",
    message: "Please enter names for your speakers.",
    recoverySteps: ["Fill in speaker names in the Speaker Names section", "At least one speaker must have a name"],
  },

  [ErrorCodes.FORM_INVALID_CAMERA_ASSIGNMENT]: {
    severity: ErrorSeverity.MEDIUM, // Error - required for functionality
    title: "Invalid Camera Assignment",
    message: "Please assign all cameras to speakers.",
    recoverySteps: ["Go to Camera Assignment section", "Assign each camera to a speaker"],
  },

  [ErrorCodes.FORM_INVALID_AUDIO_THRESHOLD]: {
    severity: ErrorSeverity.LOW, // Warning - has default
    title: "Invalid Audio Threshold",
    message: "Audio threshold format is incorrect.",
    recoverySteps: ["Use format: -30dB (negative number + 'dB')", "Try -30dB as a good starting point"],
  },

  [ErrorCodes.FORM_INVALID_CUT_DURATION]: {
    severity: ErrorSeverity.LOW, // Warning - has limits
    title: "Invalid Cut Duration",
    message: "Cut duration must be between 0.5 and 10 seconds.",
    recoverySteps: ["Enter a value between 0.5 and 10 seconds", "Try 1.5 seconds as a good starting point"],
  },

  [ErrorCodes.AUDIO_ANALYSIS_FAILED]: {
    severity: ErrorSeverity.HIGH, // Error - blocks main functionality
    title: "Audio Analysis Failed",
    message: "Audio analysis encountered an error.",
    recoverySteps: [
      "Check that audio files are accessible",
      "Try restarting Premiere Pro",
      "Close other applications to free up resources",
    ],
    autoRecovery: true,
    retryDelay: 3000,
    maxRetries: 2,
  },

  [ErrorCodes.AUDIO_FILE_NOT_FOUND]: {
    severity: ErrorSeverity.HIGH, // Error - blocks functionality
    title: "Audio File Not Found",
    message: "Cannot access audio files from your tracks.",
    recoverySteps: ["Check if clips show as 'Media Offline'", "Relink missing media: Project > Link Media"],
  },

  [ErrorCodes.STORAGE_QUOTA_EXCEEDED]: {
    severity: ErrorSeverity.LOW, // Warning - can work around
    title: "Storage Limit Reached",
    message: "Cannot save settings due to storage limitations.",
    recoverySteps: ["Delete unused presets", "Clear browser cache"],
  },

  [ErrorCodes.STORAGE_CORRUPTED_DATA]: {
    severity: ErrorSeverity.LOW, // Warning - auto-recoverable
    title: "Corrupted Settings",
    message: "Settings data was corrupted and has been reset.",
    recoverySteps: ["Your settings have been reset to defaults", "Recreate any important presets"],
    autoRecovery: true,
  },

  [ErrorCodes.SYSTEM_UNKNOWN_ERROR]: {
    severity: ErrorSeverity.HIGH,
    title: "Unknown Error",
    message: "An unexpected error occurred.",
    recoverySteps: [
      "Try refreshing the panel",
      "Restart Premiere Pro if the issue persists",
      "Contact support if the problem continues",
    ],
  },
}

/**
 * Enhanced Error Handler Class
 */
class TimbreErrorHandler {
  constructor() {
    this.errorLog = []
    this.maxLogEntries = 50
    this.activeErrors = new Set()
    this.retryAttempts = new Map()
    this.errorContainer = null
    this.currentToast = null
    this.init()
  }

  init() {
    this.errorContainer = document.getElementById("globalErrorContainer") || this.createErrorContainer()
    this.logInfo("Error handler initialized")
  }

  createErrorContainer() {
    const container = document.createElement("div")
    container.id = "globalErrorContainer"
    container.className = "global-error-container"
    container.style.display = "none"
    document.body.appendChild(container)
    return container
  }

  /**
   * Main error handling method - prevents duplicate displays
   */
  handleError(errorCode, context = {}, originalError = null) {
    const errorDef = ErrorDefinitions[errorCode]

    if (!errorDef) {
      return this.handleUnknownError(errorCode, context, originalError)
    }

    // For track errors, only show if the track is actually assigned
    if (this.isTrackError(errorCode) && !this.isTrackAssigned(context)) {
      return // Don't show error for unassigned tracks
    }

    // Prevent duplicate error displays
    const errorKey = `${errorCode}_${JSON.stringify(context)}`
    if (this.activeErrors.has(errorKey)) {
      return
    }

    const errorEntry = {
      code: errorCode,
      timestamp: new Date().toISOString(),
      severity: errorDef.severity,
      title: errorDef.title,
      message: errorDef.message,
      context: context,
      originalError: originalError?.message || null,
    }

    this.logError(errorEntry)

    // Only show visual error for medium/high severity errors
    if (
      errorDef.severity === ErrorSeverity.MEDIUM ||
      errorDef.severity === ErrorSeverity.HIGH ||
      errorDef.severity === ErrorSeverity.CRITICAL
    ) {
      this.displayError(errorDef, errorEntry)
      this.activeErrors.add(errorKey)
    }

    // Auto-dismiss warnings after 8 seconds
    if (errorDef.severity === ErrorSeverity.LOW) {
      setTimeout(() => this.dismissError(errorCode), 8000)
    }

    // Attempt auto-recovery if enabled
    if (errorDef.autoRecovery) {
      this.attemptAutoRecovery(errorCode, errorDef, context)
    }

    return errorEntry
  }

  isTrackError(errorCode) {
    return errorCode === ErrorCodes.TRACK_NO_CLIPS || errorCode === ErrorCodes.TRACK_MULTIPLE_CLIPS
  }

  isTrackAssigned(context) {
    if (!context.trackNumber) return false

    // Check if this track is assigned to any camera
    const trackNum = context.trackNumber
    const trackType = context.trackType

    if (typeof appState !== "undefined" && appState.formData) {
      const assignments = trackType === "video" ? appState.formData.trackNumbers : appState.formData.audioTrackNumbers

      return assignments && assignments.includes(trackNum)
    }

    return false
  }

  /**
   * Display error notification (compact list with hover details)
   */
  displayError(errorDef, errorEntry) {
    if (!this.errorContainer) return

    const severityClass = errorDef.severity === ErrorSeverity.LOW ? "warning" : "error"

    const errorHtml = `
    <div class="error-item ${severityClass}" data-error-code="${errorEntry.code}">
      <div class="error-summary">
        <div class="error-icon">
          ${this.getErrorIcon(errorDef.severity)}
        </div>
        <span class="error-title">${errorDef.title}</span>
        <button class="error-dismiss" onclick="timbreErrorHandler.dismissError(${errorEntry.code})" title="Dismiss">×</button>
      </div>
      
      <div class="error-details">
        <div class="error-message">${errorDef.message}</div>
        ${errorDef.recoverySteps
        ? `
          <div class="error-recovery">
            <strong>How to fix:</strong>
            <ul>
              ${errorDef.recoverySteps.map((step) => `<li>${step}</li>`).join("")}
            </ul>
          </div>
        `
        : ""
      }
        <div class="error-actions">
          <button class="error-retry" onclick="timbreErrorHandler.retryAction(${errorEntry.code})">Try Again</button>
          <button class="error-help" onclick="timbreErrorHandler.showHelp(${errorEntry.code})">Help</button>
        </div>
      </div>
    </div>
  `

    this.errorContainer.insertAdjacentHTML("beforeend", errorHtml)
    this.errorContainer.style.display = "block"
  }

  getErrorIcon(severity) {
    const icons = {
      [ErrorSeverity.LOW]: "⚠",
      [ErrorSeverity.MEDIUM]: "⚠",
      [ErrorSeverity.HIGH]: "✕",
      [ErrorSeverity.CRITICAL]: "✕",
    }
    return icons[severity] || "⚠"
  }

  /**
   * Dismiss error notification
   */
  dismissError(errorCode) {
    const errorElement = document.querySelector(`[data-error-code="${errorCode}"]`)
    if (errorElement) {
      errorElement.remove()
    }

    // Remove from active errors
    for (const key of this.activeErrors) {
      if (key.startsWith(`${errorCode}_`)) {
        this.activeErrors.delete(key)
      }
    }

    if (this.errorContainer && this.errorContainer.children.length === 0) {
      this.errorContainer.style.display = "none"
    }
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    this.activeErrors.clear()
    if (this.errorContainer) {
      this.errorContainer.innerHTML = ""
      this.errorContainer.style.display = "none"
    }
    if (this.currentToast) {
      this.currentToast.remove()
      this.currentToast = null
    }
  }

  /**
   * Show single toast (replaces any existing toast)
   */
  showToast(message, type = "info") {
    // Remove existing toast
    if (this.currentToast) {
      this.currentToast.remove()
    }

    let toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toastContainer"
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }

    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    this.currentToast = toast

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
      default:
        iconSvg =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `

    toastContainer.appendChild(toast)
    this.logInfo(`Toast: ${message} (${type})`)

    setTimeout(() => {
      if (toast === this.currentToast) {
        toast.classList.add("fade-out")
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove()
          }
          if (toast === this.currentToast) {
            this.currentToast = null
          }
        }, 300)
      }
    }, 5000)
  }

  /**
   * Retry action for specific error
   */
  retryAction(errorCode) {
    this.dismissError(errorCode)

    switch (errorCode) {
      case ErrorCodes.PPRO_NOT_CONNECTED:
        if (typeof requestTrackInfo === "function") {
          requestTrackInfo()
        }
        break
      case ErrorCodes.AUTH_NETWORK_ERROR:
        // Retry authentication if we have stored credentials
        break
      case ErrorCodes.AUDIO_ANALYSIS_FAILED:
        this.showToast("Please try the analysis again", "info")
        break
      default:
        this.showToast("Please address the issue and try again", "info")
    }
  }

  /**
   * Show help for specific error
   */
  showHelp(errorCode) {
    const errorDef = ErrorDefinitions[errorCode]
    if (errorDef && errorDef.recoverySteps) {
      const steps = errorDef.recoverySteps.join("\n• ")
      alert(`How to fix this:\n\n• ${steps}`)
    }
  }

  /**
   * Attempt automatic recovery
   */
  async attemptAutoRecovery(errorCode, errorDef, context) {
    const retryKey = `${errorCode}_${JSON.stringify(context)}`
    const attempts = this.retryAttempts.get(retryKey) || 0
    const maxRetries = errorDef.maxRetries || 3

    if (attempts >= maxRetries) {
      this.logWarning(`Max retry attempts reached for error ${errorCode}`)
      return false
    }

    this.retryAttempts.set(retryKey, attempts + 1)

    if (errorDef.retryDelay) {
      await new Promise((resolve) => setTimeout(resolve, errorDef.retryDelay))
    }

    try {
      switch (errorCode) {
        case ErrorCodes.PPRO_NOT_CONNECTED:
          return await this.recoverPremierConnection()
        case ErrorCodes.STORAGE_CORRUPTED_DATA:
          return this.recoverCorruptedStorage()
        default:
          return false
      }
    } catch (error) {
      this.logError({
        code: ErrorCodes.SYSTEM_UNKNOWN_ERROR,
        message: `Recovery failed for error ${errorCode}`,
        originalError: error.message,
        timestamp: new Date().toISOString(),
      })
      return false
    }
  }

  async recoverPremierConnection() {
    try {
      if (typeof CSInterface === "undefined") return false

      const csInterface = new CSInterface()
      const result = await new Promise((resolve) => {
        csInterface.evalScript("$._PPP_.confirmPProHostVersion()", resolve)
      })

      if (result && result !== "undefined") {
        this.logInfo("Premiere Pro connection recovered")
        this.dismissError(ErrorCodes.PPRO_NOT_CONNECTED)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  recoverCorruptedStorage() {
    try {
      localStorage.removeItem("timbrePresets")
      localStorage.removeItem("timbreLicense")
      localStorage.removeItem("timbreTheme")

      if (typeof appState !== "undefined") {
        appState.presets = []
        if (typeof updatePresetDropdown === "function") {
          updatePresetDropdown()
        }
      }

      this.logInfo("Corrupted storage recovered")
      this.dismissError(ErrorCodes.STORAGE_CORRUPTED_DATA)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Logging methods - use logToPanel instead of console
   */
  logError(errorEntry) {
    this.addToLog("ERROR", errorEntry)
    if (typeof logToPanel === "function") {
      logToPanel(`ERROR ${errorEntry.code}: ${errorEntry.message}`, "error")
    }
  }

  logWarning(message, context = {}) {
    this.addToLog("WARNING", { message, context, timestamp: new Date().toISOString() })
    if (typeof logToPanel === "function") {
      logToPanel(`WARNING: ${message}`, "warning")
    }
  }

  logInfo(message, context = {}) {
    this.addToLog("INFO", { message, context, timestamp: new Date().toISOString() })
    if (typeof logToPanel === "function") {
      logToPanel(`INFO: ${message}`, "info")
    }
  }

  addToLog(level, entry) {
    this.errorLog.push({ level, ...entry })
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.maxLogEntries)
    }
  }

  handleUnknownError(errorCode, context, originalError) {
    const errorEntry = {
      code: errorCode || ErrorCodes.SYSTEM_UNKNOWN_ERROR,
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.HIGH,
      title: "Unknown Error",
      message: originalError?.message || "An unexpected error occurred",
      context: context,
      originalError: originalError?.message || null,
    }

    this.logError(errorEntry)
    return errorEntry
  }
}

// Global error handler instance
const timbreErrorHandler = new TimbreErrorHandler()

// Global error handlers for unhandled errors
window.addEventListener("error", (event) => {
  timbreErrorHandler.handleError(
    ErrorCodes.SYSTEM_UNKNOWN_ERROR,
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: "javascript_error",
    },
    event.error,
  )
})

window.addEventListener("unhandledrejection", (event) => {
  timbreErrorHandler.handleError(
    ErrorCodes.SYSTEM_UNKNOWN_ERROR,
    {
      type: "unhandled_promise_rejection",
    },
    event.reason,
  )
})

// Rest of your existing script.js code continues here...
function onLoaded() {
  try {
    if (typeof CSInterface === "undefined") {
      timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "onLoaded" })
      return
    }

    const csInterface = new CSInterface()
    timbreErrorHandler.logInfo("Timbre Panel loading...")

    loadJSX()

    csInterface.addEventListener("com.adobe.csxs.events.PProPanelRenderEvent", (event) => {
      logToPanel(event.data, "info")
    })

    csInterface.addEventListener("com.adobe.csxs.events.WorkspaceChanged", (event) => {
      logToPanel(`New workspace selected:  ${event.data}`, "info")
    })

    csInterface.addEventListener("com.adobe.ccx.start.handleLicenseBanner", (event) => {
      logToPanel('User chose to go "Home", wherever that is...', "info")
    })

    csInterface.addEventListener("ApplicationBeforeQuit", (event) => {
      csInterface.evalScript("$._PPP_.closeLog()")
    })

    csInterface.evalScript("$._PPP_.keepPanelLoaded()")
    csInterface.evalScript("$._PPP_.disableImportWorkspaceWithProjects()")
    csInterface.evalScript("$._PPP_.registerProjectPanelSelectionChangedFxn()")
    csInterface.evalScript("$._PPP_.registerItemAddedFxn()")
    csInterface.evalScript("$._PPP_.registerProjectChangedFxn()")
    csInterface.evalScript("$._PPP_.registerSequenceSelectionChangedFxn()")
    csInterface.evalScript("$._PPP_.registerSequenceActivatedFxn()")
    csInterface.evalScript("$._PPP_.registerActiveSequenceStructureChangedFxn()")
    csInterface.evalScript("$._PPP_.registerItemsAddedToProjectFxn()")
    csInterface.evalScript("$._PPP_.registerSequenceMessaging()")
    csInterface.evalScript("$._PPP_.registerActiveSequenceChangedFxn()")
    csInterface.evalScript("$._PPP_.confirmPProHostVersion()")
    csInterface.evalScript("$._PPP_.forceLogfilesOn()")

    var prefix = "$._PPP_.setLocale('"
    var locale = csInterface.hostEnvironment.appUILocale
    var postfix = "');"
    var entireCallWithParams = prefix + locale + postfix
    csInterface.evalScript(entireCallWithParams)

    timbreErrorHandler.logInfo("Timbre Panel loaded successfully")
  } catch (error) {
    timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "onLoaded" }, error)
  }
}

function loadJSX() {
  try {
    if (typeof CSInterface === "undefined") {
      timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "loadJSX" })
      return
    }

    var csInterface = new CSInterface()
    var appName = csInterface.hostEnvironment.appName
    var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION)

    var extensionRootGeneral = extensionPath + "/jsx/"
    csInterface.evalScript('$._ext.evalFiles("' + extensionRootGeneral + '")')

    var extensionRootApp = extensionPath + "/jsx/" + appName + "/"
    csInterface.evalScript('$._ext.evalFiles("' + extensionRootApp + '")')

    timbreErrorHandler.logInfo("JSX files loaded successfully")
  } catch (error) {
    timbreErrorHandler.handleError(ErrorCodes.PPRO_SCRIPT_ERROR, { operation: "loadJSX" }, error)
  }
}

function logToPanel(message, type = "info") {
  if (typeof CSInterface === "undefined") return

  var csInterface = new CSInterface()
  try {
    if (typeof message === "object") {
      try {
        message = JSON.stringify(message)
      } catch (e) {
        message = "[Object cannot be stringified]"
      }
    }

    const escapedMessage = message.toString().replace(/'/g, "\\'")

    let formattedMessage
    switch (type) {
      case "error":
        formattedMessage = `ERROR: ${escapedMessage}`
        break
      case "warning":
        formattedMessage = `WARNING: ${escapedMessage}`
        break
      default:
        formattedMessage = escapedMessage
    }

    csInterface.evalScript(`$._PPP_.updateEventPanel('${formattedMessage}')`)
  } catch (error) {
    try {
      const errorContainer = document.getElementById("globalErrorContainer")
      if (errorContainer) {
        errorContainer.textContent = `Logging error: ${error.message}`
        errorContainer.style.display = "block"
      }
    } catch (e) {
      // At this point, we can't do anything more
    }
  }
}

// Initialize app state with default values
const appState = {
  formData: {
    cuttingMethod: "disabled",
    frequency: "medium",
    transitions: true,
    numSpeakers: 2,
    numCameras: 2,
    speakerNames: ["", "", "", "", ""],
    trackMapping: [],
    trackNumbers: [],
    audioTrackNumbers: [],
    minCutDuration: 1.5,
    audioThreshold: "-30dB",
    transitionType: "cut",
  },

  ui: {
    isProcessing: false,
    advancedSettingsExpanded: false,
    errors: {},
    isDirty: false,
    theme: "dark",
    globalError: null,
    isNewPreset: false,
    tracksLoaded: false,
  },

  trackInfo: {
    audioTracks: [],
    videoTracks: [],
    audioTracksCount: 0,
    videoTracksCount: 0,
    hasErrors: false,
    errorMessages: [],
    audioTrackStatus: [],
    videoTrackStatus: [],
    tracksMatch: true,
  },

  trackValidation: {
    valid: true,
    message: "",
    details: [],
    audioTracks: 0,
    videoTracks: 0,
  },

  presets: [],
  currentPresetIndex: null,
  authState: {
    apiKey: null,
    email: null,
    isAuthenticated: false,
    lastVerified: null,
    verificationInterval: 30 * 24 * 60 * 60 * 1000,
    trialMode: false,
    trialExpiry: null,
    error: null,
    deviceId: null,
    userId: null,
  },
}

// Element references container
const elements = {
  cuttingMethod: null,
  frequency: null,
  transitions: null,
  numSpeakers: null,
  numCameras: null,
  speakerNames: null,
  trackMapping: null,
  minCutDuration: null,
  audioThreshold: null,
  transitionType: null,
  createEditBtn: null,
  resetFormBtn: null,
  presetSelect: null,
  presetNewBtn: null,
  presetUpdateBtn: null,
  presetDeleteBtn: null,
  themeToggleBtn: null,
  advancedSection: null,
  collapseBtn: null,
  globalErrorContainer: null,
  trackValidationContainer: null,
  trackInfoBanner: null,
  presetModal: null,
  presetName: null,
  savePresetBtn: null,
  cancelPresetBtn: null,
  modalCloseBtn: null,
}

function initializeElements() {
  elements.cuttingMethod = document.getElementById("cuttingMethod")
  elements.frequency = document.getElementById("frequency")
  elements.transitions = document.getElementById("transitions")
  elements.numSpeakers = document.getElementById("numSpeakers")
  elements.numCameras = document.getElementById("numCameras")
  elements.speakerNames = document.getElementById("speakerNames")
  elements.trackMapping = document.getElementById("trackMapping")
  elements.minCutDuration = document.getElementById("minCutDuration")
  elements.audioThreshold = document.getElementById("audioThreshold")
  elements.transitionType = document.getElementById("transitionType")
  elements.createEditBtn = document.getElementById("createEditBtn")
  elements.resetFormBtn = document.getElementById("resetFormBtn")
  elements.presetSelect = document.getElementById("presetSelect")
  elements.presetNewBtn = document.getElementById("presetNewBtn")
  elements.presetUpdateBtn = document.getElementById("presetUpdateBtn")
  elements.presetDeleteBtn = document.getElementById("presetDeleteBtn")
  elements.themeToggleBtn = document.getElementById("themeToggleBtn")
  elements.advancedSection = document.querySelector(".collapsible")
  elements.collapseBtn = document.querySelector(".collapse-btn")
  elements.globalErrorContainer = document.getElementById("globalErrorContainer")
  elements.trackValidationContainer = document.getElementById("trackValidationContainer")
  elements.trackInfoBanner = document.querySelector(".track-info-banner")
  elements.presetModal = document.getElementById("presetModal")
  elements.presetName = document.getElementById("presetName")
  elements.savePresetBtn = document.getElementById("savePresetBtn")
  elements.cancelPresetBtn = document.getElementById("cancelPresetBtn")
  elements.modalCloseBtn = document.getElementById("modalCloseBtn")
}

function getDeviceId() {
  try {
    const KEY = "device-id"
    let id = localStorage.getItem(KEY)

    if (!id) {
      // Fix: Use a simpler UUID generation method that works in CEP
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
      localStorage.setItem(KEY, id)
    }
    return id
  } catch (error) {
    timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "getDeviceId" }, error)
    return "fallback-device-id-" + Date.now()
  }
}

// Global showToast function that uses the error handler
function showToast(message, type = "info") {
  timbreErrorHandler.showToast(message, type)
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeElements()

    if (typeof CSInterface === "undefined") {
      timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "DOMContentLoaded" })
      return
    }

    const csInterface = new CSInterface()
    const authState = appState.authState
    authState.deviceId = getDeviceId()

    function loadApiKey() {
      try {
        const saved = localStorage.getItem("timbreLicense")
        if (saved) {
          const p = JSON.parse(saved)
          authState.apiKey = p.apiKey
          authState.email = p.email
          authState.isAuthenticated = p.isAuthenticated
          authState.lastVerified = p.lastVerified ? new Date(p.lastVerified) : null
          authState.trialMode = p.trialMode || false
          authState.trialExpiry = p.trialExpiry ? new Date(p.trialExpiry) : null
          authState.userId = p.userId || null
          timbreErrorHandler.logInfo("Auth state loaded from storage")
          return true
        }
        return false
      } catch (err) {
        timbreErrorHandler.handleError(ErrorCodes.STORAGE_CORRUPTED_DATA, { operation: "loadApiKey" }, err)
        return false
      }
    }

    function saveApiKey() {
      try {
        localStorage.setItem(
          "timbreLicense",
          JSON.stringify({
            apiKey: authState.apiKey,
            email: authState.email,
            isAuthenticated: authState.isAuthenticated,
            lastVerified: authState.lastVerified ? authState.lastVerified.toISOString() : null,
            trialMode: authState.trialMode,
            trialExpiry: authState.trialExpiry ? authState.trialExpiry.toISOString() : null,
            userId: authState.userId,
          }),
        )
        timbreErrorHandler.logInfo("Auth state saved to storage")
      } catch (err) {
        timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "saveApiKey" }, err)
      }
    }

    function clearAuthState() {
      authState.apiKey =
        authState.email =
        authState.userId =
        authState.isAuthenticated =
        authState.lastVerified =
        authState.trialMode =
        authState.trialExpiry =
        authState.error =
        null
      try {
        localStorage.removeItem("timbreLicense")
        timbreErrorHandler.logInfo("Auth state cleared")
      } catch (err) {
        timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "clearAuthState" }, err)
      }
    }

    async function verifyApiKey(email, key) {
      try {
        timbreErrorHandler.logInfo(`Verifying license for ${email}`)

        if (!email || !email.includes("@")) {
          timbreErrorHandler.handleError(ErrorCodes.AUTH_INVALID_EMAIL, { email })
          return false
        }

        // Fix: Add error handling for network requests
        try {
          const resp = await fetch("https://api.timbrehq.com/api/v1/pro/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, key, deviceId: authState.deviceId }),
          })

          const json = await resp.json()

          if (resp.ok && json.userVerified) {
            authState.apiKey = key
            authState.userId = json.userId
            authState.isAuthenticated = true
            authState.lastVerified = new Date()
            authState.error = null
            authState.email = email
            saveApiKey()
            timbreErrorHandler.logInfo("License verified successfully")
            return true
          } else {
            let errorCode = ErrorCodes.AUTH_INVALID_KEY
            if (resp.status === 429) {
              errorCode = ErrorCodes.AUTH_DEVICE_LIMIT
            } else if (resp.status >= 500) {
              errorCode = ErrorCodes.AUTH_SERVER_ERROR
            }

            timbreErrorHandler.handleError(errorCode, {
              email,
              statusCode: resp.status,
              response: json,
            })
            return false
          }
        } catch (networkErr) {
          // Handle network errors specifically
          timbreErrorHandler.handleError(
            ErrorCodes.AUTH_NETWORK_ERROR,
            {
              email,
              apiKey: key,
              message: networkErr.message,
            },
            networkErr,
          )
          return false
        }
      } catch (err) {
        timbreErrorHandler.handleError(
          ErrorCodes.AUTH_NETWORK_ERROR,
          {
            email,
            apiKey: key,
          },
          err,
        )
        return false
      }
    }

    function needsVerification() {
      if (!authState.isAuthenticated || !authState.lastVerified) return true
      return Date.now() - authState.lastVerified.getTime() > authState.verificationInterval
    }

    function startTrial() {
      authState.trialMode = true
      authState.trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      authState.isAuthenticated = true
      authState.lastVerified = new Date()
      saveApiKey()
      timbreErrorHandler.logInfo("Trial started: 14 days remaining")
    }

    function isTrialValid() {
      return authState.trialMode && authState.trialExpiry && Date.now() < authState.trialExpiry.getTime()
    }

    function getTrialDaysRemaining() {
      if (!isTrialValid()) return 0
      const ms = authState.trialExpiry.getTime() - Date.now()
      return Math.ceil(ms / (24 * 60 * 60 * 1000))
    }

    function showTrialBanner() {
      if (!isTrialValid()) return
      const days = getTrialDaysRemaining()
      let banner = document.getElementById("trialBanner")
      if (!banner) {
        const container = document.getElementById("trialBannerContainer")
        if (!container) return

        banner = document.createElement("div")
        banner.id = "trialBanner"
        banner.className = "trial-banner"
        banner.innerHTML = `
              <div class="trial-banner-content">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Trial: ${days} days remaining</span>
              </div>
              <a href="https://timbrehq.com/" target="_blank" class="trial-banner-btn">
                  Purchase License
              </a>
          `
        container.appendChild(banner)
      } else {
        const span = banner.querySelector("span")
        if (span) span.textContent = `Trial: ${days} days remaining`
      }
    }

    function showAuthModal() {
      const authModal = document.getElementById("authModal")
      const appContent = document.getElementById("appContent")
      if (authModal) authModal.style.display = "flex"
      if (appContent) appContent.style.display = "none"
    }

    function closeAuthModal() {
      const mod = document.getElementById("authModal")
      if (mod) {
        mod.classList.add("closing")
        setTimeout(() => {
          mod.style.display = "none"
          mod.classList.remove("closing")
        }, 300)
      }
    }

    function showApp() {
      const appContent = document.getElementById("appContent")
      if (appContent) {
        appContent.style.display = "block"
        appInit()
        closeAuthModal()
      }
    }

    function checkAuthStatus() {
      const loaded = loadApiKey()
      if (!loaded || !authState.isAuthenticated || needsVerification()) {
        if (authState.trialMode && isTrialValid()) {
          showTrialBanner()
          return true
        }
        if (authState.trialMode && !isTrialValid()) {
          timbreErrorHandler.handleError(ErrorCodes.AUTH_EXPIRED_TRIAL)
          return false
        }
        return false
      }
      if (authState.trialMode && isTrialValid()) showTrialBanner()
      return true
    }

    function setupAuthModalEvents() {
      document.querySelectorAll(".auth-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".auth-tab-btn").forEach((b) => b.classList.remove("active"))
          document.querySelectorAll(".auth-tab-content").forEach((c) => c.classList.remove("active"))
          btn.classList.add("active")
          const tabId = btn.dataset.tab + "-tab"
          const tabElement = document.getElementById(tabId)
          if (tabElement) tabElement.classList.add("active")
        })
      })

      const verifyBtn = document.getElementById("verifyKeyBtn")
      if (verifyBtn) {
        verifyBtn.addEventListener("click", async () => {
          const apiInput = document.getElementById("apiKey")
          const emailInput = document.getElementById("emailId")
          const authError = document.getElementById("authError")

          if (!apiInput || !emailInput || !authError) return

          const key = apiInput.value.trim()
          const email = emailInput.value.trim()

          if (!key) {
            authError.textContent = "Please enter a license key"
            apiInput.classList.add("error")
            return
          }

          if (!email) {
            authError.textContent = "Please enter an email address."
            emailInput.classList.add("error")
            return
          }

          verifyBtn.disabled = true
          verifyBtn.innerHTML = `
                <span class="btn-icon">
                    <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                                 M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                                 M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                </span>
                Verifying...
            `
          const ok = await verifyApiKey(email, key)
          verifyBtn.disabled = false
          verifyBtn.textContent = "Activate License"

          if (ok) {
            showToast("License activated!", "success")
            showApp()
            return
          } else {
            authError.textContent = authState.error || "Invalid license key"
            return
          }
        })
      }

      const startTrialBtn = document.getElementById("startTrialBtn")
      if (startTrialBtn) {
        startTrialBtn.addEventListener("click", () => {
          startTrial()
          showApp()
          showTrialBanner()
          showToast("Trial started (14 days)", "success")
          return
        })
      }
    }

    function authSetup() {
      setupAuthModalEvents()
      if (checkAuthStatus()) {
        showApp()
        return
      }
      showAuthModal()
        ;["apiKey", "emailId"].forEach((id) => {
          const el = document.getElementById(id)
          if (!el) return
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const verifyBtn = document.getElementById("verifyKeyBtn")
              if (verifyBtn) verifyBtn.click()
            }
          })
          el.addEventListener("focus", (e) => {
            e.target.classList.remove("error")
            const authError = document.getElementById("authError")
            if (authError) authError.textContent = ""
          })
        })
    }

    function loadPresetsFromStorage() {
      try {
        const savedPresets = localStorage.getItem("timbrePresets")
        if (savedPresets) {
          const parsed = JSON.parse(savedPresets)

          // Validate preset structure
          if (!Array.isArray(parsed)) {
            throw new Error("Invalid preset data structure")
          }

          appState.presets = parsed
          updatePresetDropdown()
          timbreErrorHandler.logInfo("Presets loaded from storage")
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          timbreErrorHandler.handleError(ErrorCodes.STORAGE_CORRUPTED_DATA, { operation: "loadPresets" }, error)
          localStorage.removeItem("timbrePresets")
          appState.presets = []
        } else {
          timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "loadPresets" }, error)
        }
      }
    }

    function savePresetsToStorage() {
      try {
        const data = JSON.stringify(appState.presets)

        if (data.length > 5000000) {
          // ~5MB limit
          timbreErrorHandler.handleError(ErrorCodes.STORAGE_QUOTA_EXCEEDED, {
            dataSize: data.length,
            presetsCount: appState.presets.length,
          })
          return false
        }

        localStorage.setItem("timbrePresets", data)
        timbreErrorHandler.logInfo("Presets saved to storage successfully")
        return true
      } catch (error) {
        if (error.name === "QuotaExceededError") {
          timbreErrorHandler.handleError(
            ErrorCodes.STORAGE_QUOTA_EXCEEDED,
            {
              presetsCount: appState.presets.length,
            },
            error,
          )
        } else {
          timbreErrorHandler.handleError(
            ErrorCodes.STORAGE_ACCESS_DENIED,
            {
              operation: "save_presets",
            },
            error,
          )
        }
        return false
      }
    }

    function loadThemePreference() {
      try {
        const savedTheme = localStorage.getItem("timbreTheme")
        if (savedTheme) {
          appState.ui.theme = savedTheme
          document.documentElement.setAttribute("data-theme", savedTheme)
          timbreErrorHandler.logInfo(`Theme loaded: ${savedTheme}`)
        }
      } catch (error) {
        timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "loadTheme" }, error)
      }
    }

    function saveThemePreference(theme) {
      try {
        localStorage.setItem("timbreTheme", theme)
        timbreErrorHandler.logInfo(`Theme saved: ${theme}`)
      } catch (error) {
        timbreErrorHandler.handleError(ErrorCodes.STORAGE_ACCESS_DENIED, { operation: "saveTheme" }, error)
      }
    }

    function appSetup() {
      timbreErrorHandler.logInfo("Initializing Multi-Camera Edit Tool")
      loadThemePreference()
      updateThemeUI()
      loadPresetsFromStorage()
      updateSpeakersUI()
      setupEventListeners()
      const panel = document.querySelector(".timbre-panel")
      if (panel) panel.classList.add("fade-in")
      updateMinCutDurationBasedOnFrequency()
      setupAdvancedSettings()
    }

    let appStarted = false

    function appInit() {
      if (appStarted) return
      appSetup()
      appStarted = true
      requestTrackInfo()
    }

    function requestTrackInfo() {
      timbreErrorHandler.logInfo("Requesting track information from Premiere Pro...")

      if (elements.createEditBtn) {
        elements.createEditBtn.disabled = true
        elements.createEditBtn.innerHTML = `
          <span class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </span>
          Loading Tracks...
        `
      }

      if (elements.trackMapping) {
        elements.trackMapping.innerHTML = `
          <div class="loading-indicator">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loading-spinner">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Loading track information from Premiere Pro...</span>
          </div>
        `
      }

      checkTrackInfo((trackInfo) => {
        if (elements.createEditBtn) {
          elements.createEditBtn.disabled = false
          elements.createEditBtn.innerHTML = `
            <span class="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
            </span>
            Create Multi-Cam Edit
          `
        }

        appState.ui.tracksLoaded = true
        updateTrackMappingUI()

        if (trackInfo.hasErrors) {
          const errorContainer = elements.trackValidationContainer
          if (errorContainer) {
            errorContainer.innerHTML = `
              <strong>Track validation warnings:</strong>
              <ul>
                ${trackInfo.errorMessages.map((msg) => `<li>${msg}</li>`).join("")}
              </ul>
              <p>Found ${trackInfo.videoTracksCount} video tracks and ${trackInfo.audioTracksCount} audio tracks in sequence.</p>
              <p class="validation-note">Note: Each track must have exactly one clip.</p>
            `
            errorContainer.style.display = "block"
          }
        }

        if (trackInfo.videoTracksCount !== trackInfo.audioTracksCount) {
          appState.trackInfo.tracksMatch = false
          timbreErrorHandler.handleError(ErrorCodes.TRACK_COUNT_MISMATCH, {
            videoTracks: trackInfo.videoTracksCount,
            audioTracks: trackInfo.audioTracksCount,
          })
        } else {
          appState.trackInfo.tracksMatch = true
          timbreErrorHandler.logInfo(`Track counts match: ${trackInfo.videoTracksCount} video and audio tracks`)
        }

        updateTrackInfoBanner()
      })
    }

    function updateTrackInfoBanner() {
      if (elements.trackInfoBanner) {
        const { videoTracksCount, audioTracksCount, tracksMatch } = appState.trackInfo

        let bannerClass = "track-info-banner"
        if (!tracksMatch) {
          bannerClass += " track-info-warning"
        }

        elements.trackInfoBanner.className = bannerClass
        elements.trackInfoBanner.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            Found ${videoTracksCount} video tracks and ${audioTracksCount} audio tracks.
            ${!tracksMatch ? "<strong>Warning: Track counts do not match!</strong>" : ""}
            <br>Each assigned track should have exactly one clip. Empty tracks are fine unless assigned to cameras.
          </span>
        `
      }
    }

    function setupEventListeners() {
      timbreErrorHandler.logInfo("Setting up event listeners")

      if (elements.numSpeakers) elements.numSpeakers.addEventListener("change", handleSpeakerChange)
      if (elements.numCameras) elements.numCameras.addEventListener("change", handleCameraChange)
      if (elements.cuttingMethod)
        elements.cuttingMethod.addEventListener("change", () => updateFormState("cuttingMethod"))
      if (elements.frequency) elements.frequency.addEventListener("change", handleFrequencyChange)
      if (elements.transitions) elements.transitions.addEventListener("change", () => updateFormState("transitions"))
      if (elements.minCutDuration)
        elements.minCutDuration.addEventListener("change", () => updateFormState("minCutDuration"))
      if (elements.audioThreshold)
        elements.audioThreshold.addEventListener("change", () => updateFormState("audioThreshold"))
      if (elements.transitionType)
        elements.transitionType.addEventListener("change", () => updateFormState("transitionType"))

      if (elements.createEditBtn) elements.createEditBtn.addEventListener("click", handleCreateEdit)
      if (elements.resetFormBtn) elements.resetFormBtn.addEventListener("click", handleResetForm)
      if (elements.presetNewBtn) elements.presetNewBtn.addEventListener("click", openPresetModal)
      if (elements.presetDeleteBtn) elements.presetDeleteBtn.addEventListener("click", handleDeletePreset)
      if (elements.presetSelect) elements.presetSelect.addEventListener("change", handlePresetSelect)
      if (elements.themeToggleBtn) elements.themeToggleBtn.addEventListener("click", toggleTheme)

      if (elements.presetUpdateBtn) {
        elements.presetUpdateBtn.addEventListener("click", updateCurrentPreset)
      }

      if (elements.savePresetBtn) elements.savePresetBtn.addEventListener("click", handleSavePreset)
      if (elements.cancelPresetBtn) elements.cancelPresetBtn.addEventListener("click", closePresetModal)
      if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener("click", closePresetModal)

      window.addEventListener("click", (e) => {
        if (e.target === elements.presetModal) {
          closePresetModal()
        }
      })

      if (elements.collapseBtn) elements.collapseBtn.addEventListener("click", toggleAdvancedSettings)

      document.querySelectorAll(".btn").forEach((button) => {
        button.addEventListener("click", createRipple)
      })

      window.addEventListener("beforeunload", (e) => {
        if (appState.ui.isDirty) {
          const message = "You have unsaved changes. Are you sure you want to leave?"
          e.returnValue = message
          return message
        }
      })

      timbreErrorHandler.logInfo("Event listeners set up successfully")
    }

    function handleResetForm() {
      timbreErrorHandler.logInfo("Resetting form")

      if (appState.ui.isDirty) {
        if (!confirm("You have unsaved changes. Are you sure you want to reset the form?")) {
          return
        }
      }

      // Clear all errors first
      timbreErrorHandler.clearAllErrors()

      appState.formData = {
        cuttingMethod: "disabled",
        frequency: "medium",
        transitions: true,
        numSpeakers: 2,
        numCameras: 2,
        speakerNames: ["", "", "", "", ""],
        trackMapping: [],
        trackNumbers: [],
        audioTrackNumbers: [],
        minCutDuration: 1.5,
        audioThreshold: "-30dB",
        transitionType: "cut",
      }

      if (elements.cuttingMethod) elements.cuttingMethod.value = "disabled"
      if (elements.frequency) elements.frequency.value = "medium"
      if (elements.transitions) elements.transitions.checked = true
      if (elements.numSpeakers) elements.numSpeakers.value = "2"
      if (elements.numCameras) elements.numCameras.value = "2"

      appState.currentPresetIndex = null
      if (elements.presetSelect) elements.presetSelect.value = ""

      clearAllErrors()
      updateSpeakersUI()
      updateTrackMappingUI()
      updateMinCutDurationBasedOnFrequency()
      setupAdvancedSettings()

      appState.ui.isDirty = false
      showToast("Form has been reset", "info")
      timbreErrorHandler.logInfo("Form reset complete")
    }

    function handleDeletePreset() {
      if (appState.currentPresetIndex === null) {
        showToast("No preset selected", "warning")
        timbreErrorHandler.logWarning("Delete preset attempted with no preset selected")
        return
      }

      const presetName = appState.presets[appState.currentPresetIndex].name

      if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
        timbreErrorHandler.logInfo(`Deleting preset: ${presetName}`)

        appState.presets.splice(appState.currentPresetIndex, 1)
        savePresetsToStorage()
        updatePresetDropdown()

        appState.currentPresetIndex = null
        if (elements.presetSelect) elements.presetSelect.value = ""

        showToast(`Preset "${presetName}" has been deleted`, "success")
      }
    }

    function openPresetModal() {
      if (!validateForm()) {
        showToast("Please fix the errors before saving a preset", "error")
        timbreErrorHandler.logWarning("Cannot open preset modal due to validation errors")
        return
      }

      appState.ui.isNewPreset = true

      if (appState.ui.isDirty && appState.currentPresetIndex !== null) {
        const currentPresetName = appState.presets[appState.currentPresetIndex].name
        if (
          confirm(
            `You have unsaved changes to preset "${currentPresetName}". Save changes before creating a new preset?`,
          )
        ) {
          const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
          appState.presets[appState.currentPresetIndex].data = updatedPresetData
          savePresetsToStorage()
          showToast(`Changes to preset "${currentPresetName}" saved`, "success")
          timbreErrorHandler.logInfo(`Updated preset "${currentPresetName}" before creating new preset`)
        }
      }

      if (elements.presetName) elements.presetName.value = ""
      if (elements.presetModal) elements.presetModal.classList.add("active")
      if (elements.presetName) elements.presetName.focus()

      const presetNameError = document.getElementById("presetNameError")
      if (presetNameError) presetNameError.textContent = ""
      if (elements.presetName) elements.presetName.classList.remove("error")

      timbreErrorHandler.logInfo("Preset modal opened for new preset")
    }

    function closePresetModal() {
      if (elements.presetModal) elements.presetModal.classList.remove("active")
      timbreErrorHandler.logInfo("Preset modal closed")
    }

    function handleSavePreset() {
      if (!elements.presetName) return

      const presetName = elements.presetName.value.trim()
      timbreErrorHandler.logInfo(`Attempting to save preset: "${presetName}"`)

      if (!presetName) {
        const presetNameError = document.getElementById("presetNameError")
        if (presetNameError) presetNameError.textContent = "Preset name is required"
        elements.presetName.classList.add("error")
        timbreErrorHandler.logWarning("Preset save failed: Name is required")
        return
      }

      const isDuplicate = appState.presets.some((preset) => preset.name === presetName)
      if (isDuplicate) {
        const presetNameError = document.getElementById("presetNameError")
        if (presetNameError) presetNameError.textContent = "A preset with this name already exists"
        elements.presetName.classList.add("error")
        timbreErrorHandler.logWarning("Preset save failed: Duplicate name")
        return
      }

      const presetData = JSON.parse(JSON.stringify(appState.formData))

      appState.presets.push({
        name: presetName,
        data: presetData,
      })

      savePresetsToStorage()
      updatePresetDropdown()

      if (elements.presetSelect) elements.presetSelect.value = (appState.presets.length - 1).toString()
      appState.currentPresetIndex = appState.presets.length - 1

      appState.ui.isDirty = false
      closePresetModal()

      showToast(`Preset "${presetName}" has been saved`, "success")
      timbreErrorHandler.logInfo(`Preset "${presetName}" saved successfully`)
    }

    function handleFrequencyChange() {
      updateFormState("frequency")
      updateMinCutDurationBasedOnFrequency()
      timbreErrorHandler.logInfo(`Frequency changed to: ${appState.formData.frequency}`)
    }

    function updateMinCutDurationBasedOnFrequency() {
      const frequency = appState.formData.frequency
      let newMinCutDuration = 1.5

      switch (frequency) {
        case "veryLow":
          newMinCutDuration = 3.0
          break
        case "low":
          newMinCutDuration = 2.0
          break
        case "medium":
          newMinCutDuration = 1.5
          break
        case "high":
          newMinCutDuration = 1.0
          break
        default:
          newMinCutDuration = 1.5
      }

      appState.formData.minCutDuration = newMinCutDuration
      timbreErrorHandler.logInfo(`Min cut duration updated to: ${newMinCutDuration}s based on frequency: ${frequency}`)

      if (elements.minCutDuration) {
        elements.minCutDuration.value = newMinCutDuration
      }
    }

    function toggleTheme() {
      const newTheme = appState.ui.theme === "dark" ? "light" : "dark"
      appState.ui.theme = newTheme
      document.documentElement.setAttribute("data-theme", newTheme)
      saveThemePreference(newTheme)
      updateThemeUI()
      timbreErrorHandler.logInfo(`Theme changed to: ${newTheme}`)
    }

    function updateThemeUI() {
      const isDark = appState.ui.theme === "dark"
      document.documentElement.setAttribute("data-theme", appState.ui.theme)

      if (elements.themeToggleBtn) {
        const sunIcon = elements.themeToggleBtn.querySelector(".sun-icon")
        const moonIcon = elements.themeToggleBtn.querySelector(".moon-icon")

        if (sunIcon && moonIcon) {
          if (isDark) {
            sunIcon.style.display = "block"
            moonIcon.style.display = "none"
          } else {
            sunIcon.style.display = "none"
            moonIcon.style.display = "block"
          }
        }
      }
    }

    function updateFormState(field) {
      const element = elements[field]

      if (element) {
        let value
        if (element.type === "checkbox") {
          value = element.checked
        } else if (element.type === "number") {
          value = Number.parseFloat(element.value)
        } else {
          value = element.value
        }

        appState.formData[field] = value
        appState.ui.isDirty = true
        clearError(field)

        timbreErrorHandler.logInfo(`Form field updated: ${field} = ${value}`)
      }
    }

    function handleSpeakerChange() {
      if (!elements.numSpeakers) return

      const speakerCount = Number.parseInt(elements.numSpeakers.value, 10)
      appState.formData.numSpeakers = speakerCount
      updateSpeakersUI()
      updateTrackMappingUI()
      appState.ui.isDirty = true
      timbreErrorHandler.logInfo(`Speaker count changed to: ${speakerCount}`)
    }

    function handleCameraChange() {
      if (!elements.numCameras) return

      const cameraCount = Number.parseInt(elements.numCameras.value, 10)
      appState.formData.numCameras = cameraCount
      updateTrackMappingUI()
      appState.ui.isDirty = true
      timbreErrorHandler.logInfo(`Camera count changed to: ${cameraCount}`)
    }

    function updateSpeakersUI() {
      const speakerCount = appState.formData.numSpeakers
      const container = elements.speakerNames

      if (!container) return

      timbreErrorHandler.logInfo(`Updating speakers UI for ${speakerCount} speakers`)

      container.innerHTML = ""

      for (let i = 0; i < speakerCount; i++) {
        const formGroup = document.createElement("div")
        formGroup.className = "form-group"

        const label = document.createElement("label")
        label.setAttribute("for", `speakerName${i}`)
        label.textContent = `Speaker ${i + 1}`

        const input = document.createElement("input")
        input.type = "text"
        input.className = "form-input"
        input.id = `speakerName${i}`
        input.placeholder = `Enter name for Speaker ${i + 1}`
        input.value = appState.formData.speakerNames[i] || ""

        input.addEventListener("input", (e) => {
          appState.formData.speakerNames[i] = e.target.value
          updateTrackMappingUI()
          clearError(`speakerName${i}`)
          appState.ui.isDirty = true
          timbreErrorHandler.logInfo(`Speaker ${i + 1} name updated to: ${e.target.value}`)
        })

        const errorDiv = document.createElement("div")
        errorDiv.className = "form-error"
        errorDiv.id = `speakerName${i}Error`

        formGroup.appendChild(label)
        formGroup.appendChild(input)
        formGroup.appendChild(errorDiv)
        container.appendChild(formGroup)
      }
    }

    function updateTrackMappingUI() {
      const cameraCount = appState.formData.numCameras
      const speakerCount = appState.formData.numSpeakers
      const container = elements.trackMapping

      if (!container) return

      timbreErrorHandler.logInfo(`Updating track mapping UI for ${cameraCount} cameras and ${speakerCount} speakers`)

      container.innerHTML = ""

      if (!appState.ui.tracksLoaded) {
        container.innerHTML = `
          <div class="loading-indicator">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loading-spinner">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Loading track information from Premiere Pro...</span>
          </div>
        `
        return
      }

      // Fix: Initialize arrays properly
      if (!appState.formData.trackMapping || appState.formData.trackMapping.length !== cameraCount) {
        appState.formData.trackMapping = Array(cameraCount).fill("")
      }
      if (!appState.formData.trackNumbers || appState.formData.trackNumbers.length !== cameraCount) {
        appState.formData.trackNumbers = Array(cameraCount).fill(1)
      }
      if (!appState.formData.audioTrackNumbers || appState.formData.audioTrackNumbers.length !== cameraCount) {
        appState.formData.audioTrackNumbers = Array(cameraCount).fill(1)
      }

      for (let i = 0; i < cameraCount; i++) {
        const cameraItem = document.createElement("div")
        cameraItem.className = "camera-item"

        const cameraHeader = document.createElement("h3")
        cameraHeader.className = "camera-header"
        cameraHeader.textContent = `Camera ${i + 1}`

        const cameraControls = document.createElement("div")
        cameraControls.className = "camera-controls"

        const speakerGroup = document.createElement("div")
        speakerGroup.className = "camera-control-group"

        const speakerLabel = document.createElement("label")
        speakerLabel.textContent = "Assign to Speaker"
        speakerLabel.setAttribute("for", `camera${i}Select`)

        const speakerWrapper = document.createElement("div")
        speakerWrapper.className = "select-wrapper"

        const speakerSelect = document.createElement("select")
        speakerSelect.className = "form-select"
        speakerSelect.id = `camera${i}Select`

        const noneOption = document.createElement("option")
        noneOption.value = ""
        noneOption.textContent = "Not assigned"
        speakerSelect.appendChild(noneOption)

        for (let j = 0; j < speakerCount; j++) {
          const option = document.createElement("option")
          option.value = j.toString()

          const speakerName = appState.formData.speakerNames[j] || `Speaker ${j + 1}`
          option.textContent = speakerName

          speakerSelect.appendChild(option)
        }

        if (appState.formData.trackMapping[i]) {
          speakerSelect.value = appState.formData.trackMapping[i]
        }

        speakerSelect.addEventListener("change", (e) => {
          appState.formData.trackMapping[i] = e.target.value
          clearError(`camera${i}Select`)
          appState.ui.isDirty = true
          timbreErrorHandler.logInfo(`Camera ${i + 1} assigned to speaker: ${e.target.value}`)
        })

        speakerWrapper.appendChild(speakerSelect)
        const selectIcon = document.createElement("div")
        selectIcon.className = "select-icon"
        speakerWrapper.appendChild(selectIcon)

        speakerGroup.appendChild(speakerLabel)
        speakerGroup.appendChild(speakerWrapper)

        const speakerError = document.createElement("div")
        speakerError.className = "form-error"
        speakerError.id = `camera${i}SelectError`
        speakerGroup.appendChild(speakerError)

        const trackInputs = document.createElement("div")
        trackInputs.className = "track-inputs"

        const videoTrackGroup = document.createElement("div")
        videoTrackGroup.className = "track-input-group"

        const videoTrackLabel = document.createElement("label")
        videoTrackLabel.textContent = "Video Track"
        videoTrackLabel.setAttribute("for", `videoTrack${i}`)

        const videoTrackSelect = document.createElement("select")
        videoTrackSelect.className = "track-dropdown"
        videoTrackSelect.id = `videoTrack${i}`

        const videoTrackCount = appState.trackInfo.videoTracksCount || 0

        for (let j = 1; j <= videoTrackCount; j++) {
          const option = document.createElement("option")
          option.value = j.toString()

          let statusIndicator = ""
          let statusClass = ""

          if (appState.trackInfo.videoTrackStatus && appState.trackInfo.videoTrackStatus[j - 1] !== undefined) {
            const status = appState.trackInfo.videoTrackStatus[j - 1]
            if (status === 0) {
              statusIndicator = " (empty)"
              statusClass = "track-empty"
            } else if (status === 2) {
              statusIndicator = " (multiple clips)"
              statusClass = "track-with-multiple"
            } else {
              statusIndicator = " (1 clip)"
              statusClass = "track-with-clip"
            }
          }

          option.textContent = `Track ${j}${statusIndicator}`
          if (statusClass) {
            option.className = statusClass
          }

          videoTrackSelect.appendChild(option)
        }

        videoTrackSelect.value = appState.formData.trackNumbers[i].toString()

        videoTrackSelect.addEventListener("change", (e) => {
          appState.formData.trackNumbers[i] = Number.parseInt(e.target.value, 10)
          appState.ui.isDirty = true
          timbreErrorHandler.logInfo(`Camera ${i + 1} video track set to: ${e.target.value}`)
        })

        videoTrackGroup.appendChild(videoTrackLabel)
        videoTrackGroup.appendChild(videoTrackSelect)

        const audioTrackGroup = document.createElement("div")
        audioTrackGroup.className = "track-input-group"

        const audioTrackLabel = document.createElement("label")
        audioTrackLabel.textContent = "Audio Track"
        audioTrackLabel.setAttribute("for", `audioTrack${i}`)

        const audioTrackSelect = document.createElement("select")
        audioTrackSelect.className = "track-dropdown"
        audioTrackSelect.id = `audioTrack${i}`

        const audioTrackCount = appState.trackInfo.audioTracksCount || 0

        for (let j = 1; j <= audioTrackCount; j++) {
          const option = document.createElement("option")
          option.value = j.toString()

          let statusIndicator = ""
          let statusClass = ""

          if (appState.trackInfo.audioTrackStatus && appState.trackInfo.audioTrackStatus[j - 1] !== undefined) {
            const status = appState.trackInfo.audioTrackStatus[j - 1]
            if (status === 0) {
              statusIndicator = " (empty)"
              statusClass = "track-empty"
            } else if (status === 2) {
              statusIndicator = " (multiple clips)"
              statusClass = "track-with-multiple"
            } else {
              statusIndicator = " (1 clip)"
              statusClass = "track-with-clip"
            }
          }

          option.textContent = `Track ${j}${statusIndicator}`
          if (statusClass) {
            option.className = statusClass
          }

          audioTrackSelect.appendChild(option)
        }

        audioTrackSelect.value = appState.formData.audioTrackNumbers[i].toString()

        audioTrackSelect.addEventListener("change", (e) => {
          appState.formData.audioTrackNumbers[i] = Number.parseInt(e.target.value, 10)
          appState.ui.isDirty = true
          timbreErrorHandler.logInfo(`Camera ${i + 1} audio track set to: ${e.target.value}`)
        })

        audioTrackGroup.appendChild(audioTrackLabel)
        audioTrackGroup.appendChild(audioTrackSelect)

        trackInputs.appendChild(videoTrackGroup)
        trackInputs.appendChild(audioTrackGroup)

        cameraControls.appendChild(speakerGroup)
        cameraItem.appendChild(cameraHeader)
        cameraItem.appendChild(cameraControls)
        cameraItem.appendChild(trackInputs)
        container.appendChild(cameraItem)
      }
    }

    function setupAdvancedSettings() {
      timbreErrorHandler.logInfo("Setting up advanced settings")

      if (!elements.advancedSection || !elements.collapseBtn) return

      elements.advancedSection.setAttribute("data-expanded", appState.ui.advancedSettingsExpanded.toString())
      elements.collapseBtn.setAttribute("aria-expanded", appState.ui.advancedSettingsExpanded.toString())

      const advancedContent = elements.advancedSection.querySelector(".collapsible-content")
      if (advancedContent) {
        advancedContent.innerHTML = `
          <div class="form-grid">
            <div class="form-group">
              <label for="audioThreshold">Audio Threshold</label>
              <input type="text" id="audioThreshold" class="form-input" value="${appState.formData.audioThreshold || "-30dB"}">
              <div class="form-error" id="audioThresholdError"></div>
            </div>

            <div class="form-group">
              <label for="minCutDuration">Minimum Cut Duration (sec)</label>
              <input type="number" id="minCutDuration" class="form-input" value="${appState.formData.minCutDuration || 1.5}" min="0.5" max="10" step="0.5">
              <div class="form-error" id="minCutDurationError"></div>
            </div>

            <div class="form-group" style="display: none">
              <label for="transitionType">Transition Type</label>
              <div class="select-wrapper">
                <select id="transitionType" class="form-select">
                  <option value="cut" ${appState.formData.transitionType === "cut" ? "selected" : ""}>Cut</option>
                  <option value="crossDissolve" ${appState.formData.transitionType === "crossDissolve" ? "selected" : ""}>Cross Dissolve</option>
                  <option value="dip" ${appState.formData.transitionType === "dip" ? "selected" : ""}>Dip to Black</option>
                  <option value="wipe" ${appState.formData.transitionType === "wipe" ? "selected" : ""}>Wipe</option>
                </select>
                <div class="select-icon"></div>
              </div>
            </div>
          </div>
        `

        const audioThreshold = document.getElementById("audioThreshold")
        const minCutDuration = document.getElementById("minCutDuration")
        const transitionType = document.getElementById("transitionType")

        if (audioThreshold) {
          audioThreshold.addEventListener("change", () => updateFormState("audioThreshold"))
        }

        if (minCutDuration) {
          minCutDuration.addEventListener("change", () => updateFormState("minCutDuration"))
        }

        if (transitionType) {
          transitionType.addEventListener("change", () => updateFormState("transitionType"))
        }

        elements.audioThreshold = audioThreshold
        elements.minCutDuration = minCutDuration
        elements.transitionType = transitionType
      }
    }

    function toggleAdvancedSettings() {
      appState.ui.advancedSettingsExpanded = !appState.ui.advancedSettingsExpanded
      if (elements.advancedSection)
        elements.advancedSection.setAttribute("data-expanded", appState.ui.advancedSettingsExpanded.toString())
      if (elements.collapseBtn)
        elements.collapseBtn.setAttribute("aria-expanded", appState.ui.advancedSettingsExpanded.toString())
      timbreErrorHandler.logInfo(`Advanced settings ${appState.ui.advancedSettingsExpanded ? "expanded" : "collapsed"}`)
    }

    function validateForm() {
      timbreErrorHandler.logInfo("Validating form")

      let isValid = true
      appState.ui.errors = {}
      appState.ui.globalError = null

      // Clear previous error displays
      timbreErrorHandler.clearAllErrors()

      // Validate speaker names
      let hasNamedSpeaker = false
      for (let i = 0; i < appState.formData.numSpeakers; i++) {
        if (appState.formData.speakerNames[i] && appState.formData.speakerNames[i].trim() !== "") {
          hasNamedSpeaker = true
          break
        }
      }

      if (!hasNamedSpeaker) {
        timbreErrorHandler.handleError(ErrorCodes.FORM_MISSING_SPEAKER_NAMES, {
          numSpeakers: appState.formData.numSpeakers,
        })
        isValid = false
      }

      // Validate camera assignments
      const assignedSpeakers = new Set()
      const duplicateAssignments = []

      for (let i = 0; i < appState.formData.numCameras; i++) {
        if (!appState.formData.trackMapping[i]) {
          timbreErrorHandler.handleError(ErrorCodes.FORM_INVALID_CAMERA_ASSIGNMENT, {
            cameraIndex: i + 1,
            issue: "unassigned",
          })
          isValid = false
        } else {
          assignedSpeakers.add(appState.formData.trackMapping[i])
        }

        // Check for duplicate track assignments
        const videoTrack = appState.formData.trackNumbers[i]
        const audioTrack = appState.formData.audioTrackNumbers[i]

        for (let j = i + 1; j < appState.formData.numCameras; j++) {
          if (appState.formData.trackNumbers[j] === videoTrack) {
            duplicateAssignments.push({ type: "video", track: videoTrack, cameras: [i + 1, j + 1] })
          }
          if (appState.formData.audioTrackNumbers[j] === audioTrack) {
            duplicateAssignments.push({ type: "audio", track: audioTrack, cameras: [i + 1, j + 1] })
          }
        }
      }

      if (duplicateAssignments.length > 0) {
        timbreErrorHandler.handleError(ErrorCodes.TRACK_DUPLICATE_ASSIGNMENT, {
          duplicates: duplicateAssignments,
        })
        isValid = false
      }

      // Validate audio threshold format
      const audioThreshold = appState.formData.audioThreshold
      if (audioThreshold && !audioThreshold.match(/^-?\d+(\.\d+)?dB$/)) {
        timbreErrorHandler.handleError(ErrorCodes.FORM_INVALID_AUDIO_THRESHOLD, {
          value: audioThreshold,
        })
        isValid = false
      }

      // Validate cut duration
      const cutDuration = appState.formData.minCutDuration
      if (cutDuration < 0.5 || cutDuration > 10) {
        timbreErrorHandler.handleError(ErrorCodes.FORM_INVALID_CUT_DURATION, {
          value: cutDuration,
        })
        isValid = false
      }

      if (isValid) {
        timbreErrorHandler.logInfo("Form validation passed")
      } else {
        timbreErrorHandler.logWarning("Form validation failed")
        // Show single toast for validation failure instead of multiple errors
        showToast("Please fix the errors before creating the edit", "error")
      }

      return isValid
    }

    function setError(field, message) {
      appState.ui.errors[field] = message

      const errorElement = document.getElementById(`${field}Error`)
      if (errorElement) {
        errorElement.textContent = message
      }

      const inputElement = document.getElementById(field)
      if (inputElement) {
        inputElement.classList.add("error")
      }

      timbreErrorHandler.logWarning(`Error set for ${field}: ${message}`)
    }

    function clearError(field) {
      delete appState.ui.errors[field]

      const errorElement = document.getElementById(`${field}Error`)
      if (errorElement) {
        errorElement.textContent = ""
      }

      const inputElement = document.getElementById(field)
      if (inputElement) {
        inputElement.classList.remove("error")
      }
    }

    function clearAllErrors() {
      appState.ui.errors = {}
      appState.ui.globalError = null

      if (elements.globalErrorContainer) {
        elements.globalErrorContainer.innerHTML = ""
        elements.globalErrorContainer.style.display = "none"
      }

      if (elements.trackValidationContainer) {
        elements.trackValidationContainer.innerHTML = ""
        elements.trackValidationContainer.style.display = "none"
      }

      document.querySelectorAll(".form-error").forEach((errorElement) => {
        errorElement.textContent = ""
      })

      document.querySelectorAll(".form-input, .form-select, .track-dropdown").forEach((inputElement) => {
        inputElement.classList.remove("error")
      })

      timbreErrorHandler.logInfo("All errors cleared")
    }

    function checkTrackInfo(callback) {
      timbreErrorHandler.logInfo("Checking track information from Premiere Pro")

      try {
        appState.trackInfo = {
          audioTracks: [],
          videoTracks: [],
          audioTracksCount: 0,
          videoTracksCount: 0,
          hasErrors: false,
          errorMessages: [],
          audioTrackStatus: [],
          videoTrackStatus: [],
          tracksMatch: true,
        }

        if (typeof CSInterface === "undefined") {
          timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "checkTrackInfo" })
          return
        }

        const csInterface = new CSInterface()
        csInterface.evalScript("$._PPP_.getAudioTrackClipItemsPath()", (audioResult) => {
          try {
            if (!audioResult) {
              timbreErrorHandler.handleError(ErrorCodes.PPRO_TRACK_ACCESS_ERROR, { trackType: "audio" })
              return
            }

            let audioTracks = []
            try {
              audioTracks = JSON.parse(audioResult)
            } catch (e) {
              audioTracks = audioResult.split(",")
              timbreErrorHandler.logWarning("Audio track result was not valid JSON, parsed by splitting")
            }

            appState.trackInfo.audioTracks = audioTracks
            appState.trackInfo.audioTracksCount = audioTracks.length

            // Only show track warnings for assigned tracks
            appState.trackInfo.audioTrackStatus = audioTracks.map((path, index) => {
              const trackNumber = index + 1
              if (path === "") {
                // Only show warning if this track is assigned
                if (appState.formData.audioTrackNumbers && appState.formData.audioTrackNumbers.includes(trackNumber)) {
                  timbreErrorHandler.handleError(ErrorCodes.TRACK_NO_CLIPS, {
                    trackType: "audio",
                    trackNumber: trackNumber,
                  })
                }
                return 0
              }
              if (path.includes("Error: Multiple clips")) {
                // Only show warning if this track is assigned
                if (appState.formData.audioTrackNumbers && appState.formData.audioTrackNumbers.includes(trackNumber)) {
                  timbreErrorHandler.handleError(ErrorCodes.TRACK_MULTIPLE_CLIPS, {
                    trackType: "audio",
                    trackNumber: trackNumber,
                  })
                }
                return 2
              }
              return 1
            })

            csInterface.evalScript("$._PPP_.getVideoTracks()", (videoResult) => {
              try {
                if (!videoResult) {
                  timbreErrorHandler.handleError(ErrorCodes.PPRO_TRACK_ACCESS_ERROR, { trackType: "video" })
                  return
                }

                let videoTracks = []
                try {
                  videoTracks = JSON.parse(videoResult)
                } catch (e) {
                  videoTracks = videoResult.split(",")
                  timbreErrorHandler.logWarning("Video track result was not valid JSON, parsed by splitting")
                }

                appState.trackInfo.videoTracks = videoTracks
                appState.trackInfo.videoTracksCount = videoTracks.length

                // Only show track warnings for assigned tracks
                appState.trackInfo.videoTrackStatus = videoTracks.map((path, index) => {
                  const trackNumber = index + 1
                  if (path === "") {
                    // Only show warning if this track is assigned
                    if (appState.formData.trackNumbers && appState.formData.trackNumbers.includes(trackNumber)) {
                      timbreErrorHandler.handleError(ErrorCodes.TRACK_NO_CLIPS, {
                        trackType: "video",
                        trackNumber: trackNumber,
                      })
                    }
                    return 0
                  }
                  if (path.includes("Error: Multiple clips")) {
                    // Only show warning if this track is assigned
                    if (appState.formData.trackNumbers && appState.formData.trackNumbers.includes(trackNumber)) {
                      timbreErrorHandler.handleError(ErrorCodes.TRACK_MULTIPLE_CLIPS, {
                        trackType: "video",
                        trackNumber: trackNumber,
                      })
                    }
                    return 2
                  }
                  return 1
                })

                if (appState.trackInfo.audioTracksCount !== appState.trackInfo.videoTracksCount) {
                  timbreErrorHandler.handleError(ErrorCodes.TRACK_COUNT_MISMATCH, {
                    audioTracks: appState.trackInfo.audioTracksCount,
                    videoTracks: appState.trackInfo.videoTracksCount,
                  })
                  appState.trackInfo.tracksMatch = false
                }

                timbreErrorHandler.logInfo(
                  `Track check complete: ${appState.trackInfo.videoTracksCount} video, ${appState.trackInfo.audioTracksCount} audio tracks`,
                )

                if (callback && typeof callback === "function") {
                  callback(appState.trackInfo)
                }
              } catch (error) {
                timbreErrorHandler.handleError(
                  ErrorCodes.PPRO_SCRIPT_ERROR,
                  {
                    operation: "getVideoTracks",
                    script: "$._PPP_.getVideoTracks()",
                  },
                  error,
                )
              }
            })
          } catch (error) {
            timbreErrorHandler.handleError(
              ErrorCodes.PPRO_SCRIPT_ERROR,
              {
                operation: "getAudioTrackClipItemsPath",
                script: "$._PPP_.getAudioTrackClipItemsPath()",
              },
              error,
            )
          }
        })
      } catch (error) {
        timbreErrorHandler.handleError(ErrorCodes.PPRO_NOT_CONNECTED, { operation: "checkTrackInfo" }, error)
      }
    }

    async function handleCreateEdit() {
      if (appState.ui.isProcessing) {
        timbreErrorHandler.logWarning("Create edit button clicked while already processing")
        return
      }

      timbreErrorHandler.logInfo("Create edit button clicked")

      appState.ui.isProcessing = true
      if (elements.createEditBtn) {
        elements.createEditBtn.disabled = true
        elements.createEditBtn.innerHTML = `
          <span class="btn-icon">
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                       M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                       M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          Checking tracks...
        `
      }

      try {
        await new Promise((resolve) => checkTrackInfo(resolve))
        timbreErrorHandler.logInfo("Track check complete, validating form")
      } catch (e) {
        timbreErrorHandler.handleError(ErrorCodes.PPRO_TRACK_ACCESS_ERROR, { operation: "handleCreateEdit" }, e)
        resetCreateButton()
        return
      }

      if (!validateForm()) {
        timbreErrorHandler.logWarning("Form validation failed, edit creation aborted")
        scrollToFirstErrorField()
        resetCreateButton()
        return
      }

      if (elements.createEditBtn) {
        elements.createEditBtn.innerHTML = `
          <span class="btn-icon">
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                       M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                       M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          Creating clone...
        `
      }

      try {
        if (typeof CSInterface === "undefined") {
          throw new Error("CSInterface not available")
        }

        const csInterface = new CSInterface()
        csInterface.evalScript("$._PPP_.createClone()")
        timbreErrorHandler.logInfo("Created clone")

        if (elements.createEditBtn) {
          elements.createEditBtn.innerHTML = `
            <span class="btn-icon">
              <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                         M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                         M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </span>
            Processing Data...
          `
        }

        const editData = {
          cuttingMethod: appState.formData.cuttingMethod,
          frequency: appState.formData.frequency,
          transitions: appState.formData.transitions,
          speakers: [],
          minCutDuration: appState.formData.minCutDuration,
          audioThreshold: appState.formData.audioThreshold,
          transitionType: appState.formData.transitionType,
          trackValidation: appState.trackValidation,
          trackInfo: appState.trackInfo,
        }

        for (let i = 0; i < appState.formData.numSpeakers; i++) {
          const speakerName = appState.formData.speakerNames[i] || `Speaker ${i + 1}`
          const cameras = []
          for (let j = 0; j < appState.formData.numCameras; j++) {
            if (appState.formData.trackMapping[j] === i.toString()) {
              cameras.push({
                cameraIndex: j,
                videoTrack: appState.formData.trackNumbers[j],
                audioTrack: appState.formData.audioTrackNumbers[j],
              })
            }
          }
          editData.speakers.push({ name: speakerName, cameras })
        }

        const { frequency, minCutDuration, audioThreshold } = appState.formData
        const mergeGapMap = {
          low: minCutDuration * 0.25,
          medium: minCutDuration * 0.5,
          high: minCutDuration * 1.0,
        }
        const mergeGap = mergeGapMap[frequency] ?? minCutDuration * 0.5

        const args = []
        for (let i = 0; i < appState.formData.numCameras; i++) {
          if (!appState.formData.trackMapping[i]) continue

          const file = appState.trackInfo.audioTracks[appState.formData.audioTrackNumbers[i] - 1]
          const vTrack = appState.formData.trackNumbers[i]
          const aTrack = appState.formData.audioTrackNumbers[i]

          if (!file || file.includes("Error")) {
            timbreErrorHandler.logWarning(`Skipping bad track ${aTrack}`)
            continue
          }

          args.push(file, vTrack, aTrack)
        }

        args.push(String(audioThreshold), String(minCutDuration), String(mergeGap))

        showToast("Running audio analysis on all tracks…", "info")
        timbreErrorHandler.logInfo(`Invoking analysis with ${args.length} arguments`)

        if (elements.createEditBtn) {
          elements.createEditBtn.innerHTML = `
          <span class="btn-icon">
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                       M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                       M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          Running analysis on all tracks...
          `
        }

        const stdout = await runAudioAnalysis(args)
        const { timeline, err } = JSON.parse(stdout)

        if (err) {
          throw new Error(err)
        }

        if (!timeline) {
          throw new Error("Timeline not found in analysis output")
        }

        if (elements.createEditBtn) {
          elements.createEditBtn.innerHTML = `
            <span class="btn-icon">
              <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                        M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                        M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </span>
            Applying cuts to timeline...
          `
        }

        await new Promise((resolve) => {
          csInterface.evalScript(`$._PPP_.processTimeline(${JSON.stringify(timeline)});`, () => {
            showToast("Timeline applied in Premiere Pro", "success")
            timbreErrorHandler.logInfo("processTimeline() callback received")
            resolve()
          })
        })

        showToast("All done!", "success")
        timbreErrorHandler.logInfo("Completed multi-camera audio analysis and edit")
      } catch (err) {
        timbreErrorHandler.handleError(
          ErrorCodes.AUDIO_ANALYSIS_FAILED,
          {
            operation: "handleCreateEdit",
            analysisArgs: args,
          },
          err,
        )
        showToast(`Error during analysis: ${err}`, "error")
      } finally {
        resetCreateButton()
        appState.ui.isDirty = false
        appState.ui.isProcessing = false
      }
    }

    function resetCreateButton() {
      if (elements.createEditBtn) {
        appState.ui.isProcessing = false
        elements.createEditBtn.disabled = false
        elements.createEditBtn.innerHTML = `
          <span class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                       M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                       M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
          Create Multi-Cam Edit
        `
      }
    }

    function scrollToFirstErrorField() {
      const firstErrorField = Object.keys(appState.ui.errors)[0]
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }

    function handlePresetSelect() {
      if (!elements.presetSelect) return

      const selectedIndex = elements.presetSelect.value

      if (!selectedIndex) return

      if (appState.ui.isDirty && appState.currentPresetIndex !== Number.parseInt(selectedIndex)) {
        if (appState.currentPresetIndex !== null) {
          const currentPresetName = appState.presets[appState.currentPresetIndex].name
          if (
            confirm(
              `You have unsaved changes to preset "${currentPresetName}". Save changes before loading a different preset?`,
            )
          ) {
            const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
            appState.presets[appState.currentPresetIndex].data = updatedPresetData
            savePresetsToStorage()
            showToast(`Changes to preset "${currentPresetName}" saved`, "success")
            timbreErrorHandler.logInfo(`Changes to preset "${currentPresetName}" saved before loading new preset`)
          }
        } else if (confirm("You have unsaved changes. Save as a new preset before loading?")) {
          openPresetModal()
          elements.presetSelect.value =
            appState.currentPresetIndex !== null ? appState.currentPresetIndex.toString() : ""
          return
        }
      }

      const preset = appState.presets[selectedIndex]
      loadPreset(preset.data)

      appState.currentPresetIndex = Number.parseInt(selectedIndex)
      appState.ui.isDirty = false

      showToast(`Preset "${preset.name}" loaded`, "info")
      timbreErrorHandler.logInfo(`Preset "${preset.name}" loaded`)
    }

    function updateCurrentPreset() {
      if (appState.currentPresetIndex === null) {
        openPresetModal()
        return
      }

      if (!validateForm()) {
        showToast("Please fix the errors before updating the preset", "error")
        timbreErrorHandler.logWarning("Cannot update preset due to validation errors")
        return
      }

      const presetName = appState.presets[appState.currentPresetIndex].name

      if (confirm(`Update preset "${presetName}" with current settings?`)) {
        const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
        appState.presets[appState.currentPresetIndex].data = updatedPresetData

        savePresetsToStorage()
        appState.ui.isDirty = false

        showToast(`Preset "${presetName}" has been updated`, "success")
        timbreErrorHandler.logInfo(`Preset "${presetName}" updated successfully`)
      }
    }

    function loadPreset(presetData) {
      appState.formData = JSON.parse(JSON.stringify(presetData))

      if (elements.cuttingMethod) elements.cuttingMethod.value = presetData.cuttingMethod
      if (elements.frequency) elements.frequency.value = presetData.frequency
      if (elements.transitions) elements.transitions.checked = presetData.transitions
      if (elements.numSpeakers) elements.numSpeakers.value = presetData.numSpeakers
      if (elements.numCameras) elements.numCameras.value = presetData.numCameras

      updateSpeakersUI()
      updateTrackMappingUI()

      if (elements.minCutDuration) {
        elements.minCutDuration.value = presetData.minCutDuration || 1.5
      }
      if (elements.audioThreshold) {
        elements.audioThreshold.value = presetData.audioThreshold || "-30dB"
      }
      if (elements.transitionType) {
        elements.transitionType.value = presetData.transitionType || "cut"
      }

      clearAllErrors()
    }

    function updatePresetDropdown() {
      const select = elements.presetSelect

      if (!select) return

      select.innerHTML = '<option value="" disabled selected>Select preset...</option>'

      appState.presets.forEach((preset, index) => {
        const option = document.createElement("option")
        option.value = index.toString()
        option.textContent = preset.name
        select.appendChild(option)
      })

      timbreErrorHandler.logInfo(`Preset dropdown updated with ${appState.presets.length} presets`)
    }

    function createRipple(event) {
      const button = event.currentTarget

      const circle = document.createElement("span")
      const diameter = Math.max(button.clientWidth, button.clientHeight)

      circle.style.width = circle.style.height = `${diameter}px`
      circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`
      circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`
      circle.classList.add("ripple")

      const ripple = button.getElementsByClassName("ripple")[0]
      if (ripple) {
        ripple.remove()
      }

      button.appendChild(circle)
    }

    async function runAudioAnalysis(cliArgs) {
      return new Promise((resolve, reject) => {
        try {
          timbreErrorHandler.logInfo("Starting audio analysis", { argsCount: cliArgs.length })

          if (typeof CSInterface === "undefined") {
            throw new Error("CSInterface not available")
          }

          const cs = new CSInterface()
          const extDir = cs.getSystemPath(SystemPath.EXTENSION)
          const isWin = cs.getOSInformation().includes("Windows")
          const sep = isWin ? "\\" : "/"

          if (!Array.isArray(cliArgs) || cliArgs.length < 4) {
            timbreErrorHandler.handleError(ErrorCodes.AUDIO_ANALYSIS_FAILED, {
              reason: "insufficient_arguments",
              argsLength: cliArgs?.length || 0,
            })
            return reject(new Error("Insufficient arguments for audio analysis"))
          }

          // Validate audio files exist
          const audioFiles = cliArgs.filter((arg, index) => index % 3 === 0 && index < cliArgs.length - 3)
          for (const file of audioFiles) {
            if (!file || file.includes("Error")) {
              timbreErrorHandler.handleError(ErrorCodes.AUDIO_FILE_NOT_FOUND, { file })
              return reject(new Error(`Invalid audio file: ${file}`))
            }
          }

          const safeArgs = cliArgs.map((a) => String(a).replace(/\\/g, "\\\\"))
          const exeName = isWin ? "audioTool-win.exe" : "audioTool-mac"
          const exePath = `${extDir}${sep}audioTool${sep}${exeName}`

          timbreErrorHandler.logInfo(`Running: ${exePath} ${safeArgs.join(" ")}`)

          // Fix: Check for CEP process API availability
          if (!window.cep || !window.cep.process) {
            throw new Error("CEP process API not available")
          }

          const startRes = window.cep.process.createProcess(exePath, ...safeArgs)
          if (startRes.err !== 0) {
            timbreErrorHandler.handleError(ErrorCodes.AUDIO_ANALYSIS_FAILED, {
              reason: "process_start_error",
              message: startRes.err,
            })
            return reject({ err: startRes.err })
          }
          const pid = startRes.data

          // Capture both streams
          let stdoutData = ""
          let stderrData = ""
          window.cep.process.stdout(pid, (chunk) => {
            stdoutData += chunk
          })
          window.cep.process.stderr(pid, (chunk) => {
            stderrData += chunk
          })

          // Poll until it exits with timeout
          let pollCount = 0
          const maxPolls = 240 // 2 minutes timeout
          const poll = setInterval(() => {
            pollCount++
            if (pollCount > maxPolls) {
              clearInterval(poll)
              timbreErrorHandler.handleError(ErrorCodes.AUDIO_PROCESSING_TIMEOUT, {
                reason: "timeout",
                duration: maxPolls * 500,
              })
              return reject(new Error("Audio analysis timeout"))
            }

            const stat = window.cep.process.isRunning(pid)
            if (stat.err !== 0) {
              clearInterval(poll)
              timbreErrorHandler.handleError(ErrorCodes.AUDIO_ANALYSIS_FAILED, {
                reason: "process_poll_error",
                message: stat.err,
              })
              return reject({ err: stat.err })
            }
            if (!stat.data) {
              clearInterval(poll)
              // If any stderr output, treat as error
              if (stderrData.trim()) {
                timbreErrorHandler.handleError(ErrorCodes.AUDIO_ANALYSIS_FAILED, {
                  reason: "stderr_output",
                  message: stderrData.trim(),
                })
                return reject({ err: stderrData.trim() })
              }
              // Else return stdout (must be JSON)
              if (!stdoutData.trim()) {
                timbreErrorHandler.handleError(ErrorCodes.AUDIO_ANALYSIS_FAILED, {
                  reason: "no_output",
                })
                return reject({ err: "No output from analysis tool" })
              }
              resolve(stdoutData)
            }
          }, 500)
        } catch (e) {
          timbreErrorHandler.handleError(
            ErrorCodes.AUDIO_ANALYSIS_FAILED,
            {
              reason: "exception",
              message: e.message,
            },
            e,
          )
          reject(e)
        }
      })
    }

    // Initialize authentication
    authSetup()
  } catch (error) {
    timbreErrorHandler.handleError(
      ErrorCodes.SYSTEM_UNKNOWN_ERROR,
      {
        operation: "DOMContentLoaded",
        location: "main_initialization",
      },
      error,
    )
  }
})
