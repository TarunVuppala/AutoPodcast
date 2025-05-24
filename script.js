/**
 * Multi-Camera Edit Tool
 * JavaScript functionality for the Timbre Panel interface
 */

function onLoaded() {
  const csInterface = new CSInterface()
  logToPanel("Panel loaded", "info");
  loadJSX();

  csInterface.addEventListener("com.adobe.csxs.events.PProPanelRenderEvent", function (event) {
    alert(event.data);
  });

  csInterface.addEventListener("com.adobe.csxs.events.WorkspaceChanged", function (event) {
    alert("New workspace selected: " + event.data);
  });

  csInterface.addEventListener("com.adobe.ccx.start.handleLicenseBanner", function (event) {
    alert("User chose to go \"Home\", wherever that is...");
  });

  csInterface.addEventListener("ApplicationBeforeQuit", function (event) {
    csInterface.evalScript("$._PPP_.closeLog()");
  });

  csInterface.evalScript("$._PPP_.getVersionInfo()", myVersionInfoFunction);
  csInterface.evalScript("$._PPP_.getActiveSequenceName()", myCallBackFunction);
  csInterface.evalScript("$._PPP_.getUserName()", myUserNameFunction);
  csInterface.evalScript("$._PPP_.getProjectProxySetting()", myGetProxyFunction);
  csInterface.evalScript("$._PPP_.keepPanelLoaded()");
  csInterface.evalScript("$._PPP_.disableImportWorkspaceWithProjects()");
  csInterface.evalScript("$._PPP_.registerProjectPanelSelectionChangedFxn()");  	// Project panel selection changed
  csInterface.evalScript("$._PPP_.registerItemAddedFxn()");					  	// Item added to project
  csInterface.evalScript("$._PPP_.registerProjectChangedFxn()");					// Project changed
  csInterface.evalScript("$._PPP_.registerSequenceSelectionChangedFxn()");		// Selection within the active sequence changed
  csInterface.evalScript("$._PPP_.registerSequenceActivatedFxn()");				// The active sequence changed
  csInterface.evalScript("$._PPP_.registerActiveSequenceStructureChangedFxn()");	// Clips within the active sequence changed
  csInterface.evalScript("$._PPP_.registerItemsAddedToProjectFxn()");  // register for message, whenever something is added to the active project
  csInterface.evalScript("$._PPP_.registerSequenceMessaging()");
  csInterface.evalScript("$._PPP_.registerActiveSequenceChangedFxn()");
  csInterface.evalScript("$._PPP_.confirmPProHostVersion()");
  csInterface.evalScript("$._PPP_.forceLogfilesOn()");  // turn on log files when launching

  // Good idea from our friends at Evolphin; make the ExtendScript locale match the JavaScript locale!
  var prefix = "$._PPP_.setLocale('";
  var locale = csInterface.hostEnvironment.appUILocale;
  var postfix = "');";

  var entireCallWithParams = prefix + locale + postfix;
  csInterface.evalScript(entireCallWithParams);
}

function myCallBackFunction(data) {
  // Updates seq_display with whatever ExtendScript function returns.
  var boilerPlate = "Active Sequence: ";
  var seq_display = document.getElementById("active_seq");
  seq_display.innerHTML = boilerPlate + data;
}

function myUserNameFunction(data) {
  // Updates username with whatever ExtendScript function returns.
  var user_name = document.getElementById("username");
  user_name.innerHTML = data;
}

function myGetProxyFunction(data) {
  // Updates proxy_display based on current sequence's value.
  var boilerPlate = "Proxies enabled for project: ";
  var proxy_display = document.getElementById("proxies_on");

  if (proxy_display !== null) {
    proxy_display.innerHTML = boilerPlate + data;
  }
}

function myVersionInfoFunction(data) {
  var v_string = document.getElementById("version_string");
  v_string.innerHTML = data;
}

/**
* Load JSX file into the scripting context of the product. All the jsx files in 
* folder [ExtensionRoot]/jsx & [ExtensionRoot]/jsx/[AppName] will be loaded.
*/
function loadJSX() {
  var csInterface = new CSInterface();

  // get the appName of the currently used app. For Premiere Pro it's "PPRO"
  var appName = csInterface.hostEnvironment.appName;
  var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);

  // load general JSX script independent of appName
  var extensionRootGeneral = extensionPath + "/jsx/";
  csInterface.evalScript("$._ext.evalFiles(\"" + extensionRootGeneral + "\")");

  // load JSX scripts based on appName
  var extensionRootApp = extensionPath + "/jsx/" + appName + "/";
  csInterface.evalScript("$._ext.evalFiles(\"" + extensionRootApp + "\")");
}

function logToPanel(message, type = "info") {
    try {
      const csInterface = new CSInterface()

      // Convert objects to strings if needed
      if (typeof message === "object") {
        try {
          message = JSON.stringify(message)
        } catch (e) {
          message = "[Object cannot be stringified]"
        }
      }

      // Escape single quotes to prevent JavaScript errors
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
      // If this fails, we have no way to log the error
      // We could try to display it in the UI as a last resort
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

document.addEventListener("DOMContentLoaded", () => {
  // Update the appState to include more validation fields and track information
  const appState = {
    // Form data
    formData: {
      cuttingMethod: "disabled",
      frequency: "medium",
      transitions: true,
      numSpeakers: 2,
      numCameras: 2,
      speakerNames: ["", "", "", "", ""],
      trackMapping: [], // Will store camera to speaker mapping
      trackNumbers: [], // Will store video track numbers
      audioTrackNumbers: [], // Will store audio track numbers
      minCutDuration: 1.5,
      audioThreshold: "-30dB",
      transitionType: "cut",
    },

    // UI state
    ui: {
      isProcessing: false,
      advancedSettingsExpanded: false,
      errors: {},
      isDirty: false,
      theme: "dark", // Default theme
      globalError: null,
      isNewPreset: false,
      tracksLoaded: false, // Flag to indicate if tracks have been loaded
    },

    // Track information from Premiere Pro
    trackInfo: {
      audioTracks: [],
      videoTracks: [],
      audioTracksCount: 0,
      videoTracksCount: 0,
      hasErrors: false,
      errorMessages: [],
      audioTrackStatus: [], // 0: no clip, 1: one clip, 2: multiple clips
      videoTrackStatus: [], // 0: no clip, 1: one clip, 2: multiple clips
      tracksMatch: true, // Flag to indicate if audio and video track counts match
    },

    // Track validation results
    trackValidation: {
      valid: true,
      message: "",
      details: [],
      audioTracks: 0,
      videoTracks: 0,
    },

    // Presets
    presets: [],
    currentPresetIndex: null,
    authState: {
      apiKey: null,
      isAuthenticated: false,
      lastVerified: null,
      verificationInterval: 30 * 24 * 60 * 60 * 1000,
      trialMode: false,
      trialExpiry: null,
      error: null
    }
  }

  const authState = appState.authState;
  function loadApiKey() {
    try {
      const saved = localStorage.getItem("timbreAuth");
      if (saved) {
        const p = JSON.parse(saved);
        authState.apiKey = p.apiKey;
        authState.isAuthenticated = p.isAuthenticated;
        authState.lastVerified = p.lastVerified ? new Date(p.lastVerified) : null;
        authState.trialMode = p.trialMode || false;
        authState.trialExpiry = p.trialExpiry ? new Date(p.trialExpiry) : null;
        logToPanel(`Auth state loaded from storage ${JSON.stringify(p)}`, "info");
        return true;
      }
      return false;
    } catch (err) {
      logToPanel(`Error loading auth state: ${err}`, "error");
      return false;
    }
  }

  function saveApiKey() {
    try {
      localStorage.setItem("timbreAuth", JSON.stringify({
        apiKey: authState.apiKey,
        isAuthenticated: authState.isAuthenticated,
        lastVerified: authState.lastVerified ? authState.lastVerified.toISOString() : null,
        trialMode: authState.trialMode,
        trialExpiry: authState.trialExpiry ? authState.trialExpiry.toISOString() : null
      }));
      logToPanel("Auth state saved to storage", "info");
    } catch (err) {
      logToPanel(`Error saving auth state: ${err}`, "error");
    }
  }

  function clearAuthState() {
    authState.apiKey =
      authState.isAuthenticated =
      authState.lastVerified =
      authState.trialMode =
      authState.trialExpiry =
      authState.error = null;
    try {
      localStorage.removeItem("timbreAuth");
      logToPanel("Auth state cleared", "info");
    } catch (err) {
      logToPanel(`Error clearing auth state: ${err}`, "error");
    }
  }

  async function verifyApiKey(apiKey) {
    try {
      logToPanel(`Verifying API key: ${apiKey}`, "info");
      const validKeys = ["DEMO-KEY-123", "PREMIUM-KEY-456", "TIMBRE-PRO-789"];
      if (validKeys.includes(apiKey)) {
        authState.apiKey = apiKey;
        authState.isAuthenticated = true;
        authState.lastVerified = new Date();
        authState.error = null;
        saveApiKey();
        logToPanel("API key verified successfully", "success");
        return true;
      } else {
        authState.error = "Invalid API key. Please check and try again.";
        logToPanel(authState.error, "error");
        return false;
      }
    } catch (err) {
      authState.error = "Verification failed. Please check your connection.";
      logToPanel(`API key verification failed: ${err}`, "error");
      return false;
    }
  }

  function needsVerification() {
    if (!authState.isAuthenticated || !authState.lastVerified) return true;
    return Date.now() - authState.lastVerified.getTime() > authState.verificationInterval;
  }

  function startTrial() {
    authState.trialMode = true;
    authState.trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    authState.isAuthenticated = true;
    authState.lastVerified = new Date();
    saveApiKey();
    logToPanel("Trial started: 14 days remaining", "info");
  }

  function isTrialValid() {
    return authState.trialMode && authState.trialExpiry && Date.now() < authState.trialExpiry.getTime();
  }

  function getTrialDaysRemaining() {
    if (!isTrialValid()) return 0;
    const ms = authState.trialExpiry.getTime() - Date.now();
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  }

  function showAuthToast(message, type = "info") {
    let container = document.getElementById("authToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "authToastContainer";
      container.className = "auth-toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `
        <div class="auth-toast-content">
            <div class="auth-toast-message">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  function showTrialBanner() {
    if (!isTrialValid()) return;
    const days = getTrialDaysRemaining();
    let banner = document.getElementById("trialBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "trialBanner";
      banner.className = "trial-banner";
      banner.innerHTML = `
            <div class="trial-banner-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Trial: ${days} days remaining</span>
            </div>
            <a href="https://www.timbre-edit-tool.com/purchase" target="_blank" class="trial-banner-btn">
                Purchase License
            </a>
        `;
      document.body.insertBefore(banner, document.body.firstChild);
    } else {
      const span = banner.querySelector("span");
      if (span) span.textContent = `Trial: ${days} days remaining`;
    }
  }

  function showAuthModal() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("appContent").style.display = "none";
  }

  function closeAuthModal() {
    const mod = document.getElementById("authModal");
    mod.classList.add("closing");
    setTimeout(() => {
      mod.style.display = "none";
      mod.classList.remove("closing");
    }, 300);
  }

  function showApp() {
    document.getElementById("appContent").style.display = "block";
    closeAuthModal();
  }

  function checkAuthStatus() {
    const loaded = loadApiKey();
    if (!loaded || !authState.isAuthenticated || needsVerification()) {
      if (authState.trialMode && isTrialValid()) {
        showTrialBanner();
        showApp();
        return true;
      }
      logToPanel("Api key trial", "info")

      showAuthModal();
      return false;
    }
    if (authState.trialMode && isTrialValid()) showTrialBanner();

    showApp();
    logToPanel("Api key verified", "info")
    return true;
  }

  function setupAuthModalEvents() {
    document.querySelectorAll(".auth-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".auth-tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab + "-tab").classList.add("active");
      });
    });
    document.getElementById("verifyKeyBtn").addEventListener("click", async () => {
      const input = document.getElementById("apiKey");
      const errorDiv = document.getElementById("apiKeyError");
      const key = input.value.trim();
      if (!key) {
        errorDiv.textContent = "Please enter a license key";
        input.classList.add("error");
        return;
      }
      const btn = document.getElementById("verifyKeyBtn");
      btn.disabled = true;
      btn.innerHTML = `
            <span class="btn-icon">
                <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                             M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                             M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
            </span>
            Verifying...
        `;
      const ok = await verifyApiKey(key);
      btn.disabled = false;
      btn.textContent = "Activate License";
      if (ok) {
        closeAuthModal();
        showAuthToast("License activated!", "success");
        init();
      } else {
        errorDiv.textContent = authState.error || "Invalid license key";
        input.classList.add("error");
      }
    });
    document.getElementById("startTrialBtn").addEventListener("click", () => {
      startTrial();
      closeAuthModal();
      showAuthToast("Trial started (14 days)", "success");
      showTrialBanner();
      init();
    });
    document.getElementById("apiKey").addEventListener("focus", e => {
      e.target.classList.remove("error");
      document.getElementById("apiKeyError").textContent = "";
    });
  }

  function onload() {
    setupAuthModalEvents();
    if (checkAuthStatus()) {
      showApp();
      return;
    }
    const apiInput = document.getElementById("apiKey");
    if (apiInput) {
      apiInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById("verifyKeyBtn").click();
        }
      });
    }
  }

  // Load presets from localStorage
  function loadPresetsFromStorage() {
    try {
      const savedPresets = localStorage.getItem("timbrePresets")
      if (savedPresets) {
        appState.presets = JSON.parse(savedPresets)
        updatePresetDropdown()
        logToPanel("Presets loaded from storage", "info")
      }
    } catch (error) {
      logToPanel(`Error loading presets: ${error.message}`, "error")
      showToast("Error loading saved presets", "error")
    }
  }

  // Save presets to localStorage
  function savePresetsToStorage() {
    try {
      localStorage.setItem("timbrePresets", JSON.stringify(appState.presets))
      logToPanel("Presets saved to storage", "info")
    } catch (error) {
      logToPanel(`Error saving presets: ${error.message}`, "error")
      showToast("Error saving presets", "error")
    }
  }

  // Load theme preference from localStorage
  function loadThemePreference() {
    try {
      const savedTheme = localStorage.getItem("timbreTheme")
      if (savedTheme) {
        appState.ui.theme = savedTheme
        document.documentElement.setAttribute("data-theme", savedTheme)
        logToPanel(`Theme loaded: ${savedTheme}`, "info")
      }
    } catch (error) {
      logToPanel(`Error loading theme preference: ${error.message}`, "error")
    }
  }

  // Save theme preference to localStorage
  function saveThemePreference(theme) {
    try {
      localStorage.setItem("timbreTheme", theme)
      logToPanel(`Theme saved: ${theme}`, "info")
    } catch (error) {
      logToPanel(`Error saving theme preference: ${error.message}`, "error")
    }
  }

  // DOM Elements
  const elements = {
    // Form elements
    cuttingMethod: document.getElementById("cuttingMethod"),
    frequency: document.getElementById("frequency"),
    transitions: document.getElementById("transitions"),
    numSpeakers: document.getElementById("numSpeakers"),
    numCameras: document.getElementById("numCameras"),
    speakerNames: document.getElementById("speakerNames"),
    trackMapping: document.getElementById("trackMapping"),
    minCutDuration: document.getElementById("minCutDuration"),
    audioThreshold: document.getElementById("audioThreshold"),
    transitionType: document.getElementById("transitionType"),

    // Buttons
    createEditBtn: document.getElementById("createEditBtn"),
    resetFormBtn: document.getElementById("resetFormBtn"),
    presetSelect: document.getElementById("presetSelect"),
    presetNewBtn: document.getElementById("presetNewBtn"),
    presetUpdateBtn: document.getElementById("presetUpdateBtn"),
    presetDeleteBtn: document.getElementById("presetDeleteBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),

    // Advanced settings
    advancedSection: document.querySelector(".collapsible"),
    collapseBtn: document.querySelector(".collapse-btn"),

    // Global error display
    globalErrorContainer: document.getElementById("globalErrorContainer"),

    // Track validation display
    trackValidationContainer: document.getElementById("trackValidationContainer"),
    trackInfoBanner: document.querySelector(".track-info-banner"),

    // Modal elements
    presetModal: document.getElementById("presetModal"),
    presetName: document.getElementById("presetName"),
    savePresetBtn: document.getElementById("savePresetBtn"),
    cancelPresetBtn: document.getElementById("cancelPresetBtn"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
  }

  /**
   * Initialize the application
   * This is the main entry point
   */
  function init() {
    logToPanel("Initializing Multi-Camera Edit Tool", "info")
    onload()

    // Load theme preference
    loadThemePreference()
    updateThemeUI()

    // Load presets from storage
    loadPresetsFromStorage()

    // Set up initial UI for speakers only
    updateSpeakersUI()

    // Disable the create edit button until tracks are loaded
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

    // Show loading indicator for track mapping
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

    // Set up event listeners
    setupEventListeners()

    // Add animation class to main panel
    document.querySelector(".timbre-panel").classList.add("fade-in")

    // Configure minCutDuration based on frequency
    updateMinCutDurationBasedOnFrequency()

    // Check track info from Premiere Pro first
    logToPanel("Requesting track information from Premiere Pro...", "info")
    checkTrackInfo((trackInfo) => {
      logToPanel(`Track info loaded: ${JSON.stringify(trackInfo)}`, "info")

      // Enable the create edit button now that tracks are loaded
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

      // Set the tracks loaded flag
      appState.ui.tracksLoaded = true

      // Now update the track mapping UI with the track info
      updateTrackMappingUI()

      // Set up advanced settings
      setupAdvancedSettings()

      // Update UI with track info if needed
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

      // Check if audio and video track counts match
      if (trackInfo.videoTracksCount !== trackInfo.audioTracksCount) {
        appState.trackInfo.tracksMatch = false
        logToPanel(
          `Warning: Video track count (${trackInfo.videoTracksCount}) does not match audio track count (${trackInfo.audioTracksCount})`,
          "warning",
        )

        if (elements.globalErrorContainer) {
          elements.globalErrorContainer.innerHTML = `
            <strong>Warning:</strong> Video track count (${trackInfo.videoTracksCount}) does not match audio track count (${trackInfo.audioTracksCount}).
            This may cause issues with camera assignments.
          `
          elements.globalErrorContainer.style.display = "block"
        }
      } else {
        appState.trackInfo.tracksMatch = true
        logToPanel(`Track counts match: ${trackInfo.videoTracksCount} video and audio tracks`, "info")
      }

      // Update the track info banner
      updateTrackInfoBanner()
    })
  }

  /**
   * Update the track info banner with current track counts
   */
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
          <br>Each track must have exactly one clip. Tracks with multiple clips or no clips will cause errors.
        </span>
      `
    }
  }

  /**
   * Set up all event listeners for the application
   */
  function setupEventListeners() {
    logToPanel("Setting up event listeners", "info")

    // Form change events
    elements.numSpeakers.addEventListener("change", handleSpeakerChange)
    elements.numCameras.addEventListener("change", handleCameraChange)
    elements.cuttingMethod.addEventListener("change", () => updateFormState("cuttingMethod"))
    elements.frequency.addEventListener("change", handleFrequencyChange)
    elements.transitions.addEventListener("change", () => updateFormState("transitions"))
    elements.minCutDuration.addEventListener("change", () => updateFormState("minCutDuration"))
    elements.audioThreshold.addEventListener("change", () => updateFormState("audioThreshold"))
    elements.transitionType.addEventListener("change", () => updateFormState("transitionType"))

    // Button click events
    elements.createEditBtn.addEventListener("click", handleCreateEdit)
    elements.resetFormBtn.addEventListener("click", handleResetForm)
    elements.presetNewBtn.addEventListener("click", openPresetModal)
    elements.presetDeleteBtn.addEventListener("click", handleDeletePreset)
    elements.presetSelect.addEventListener("change", handlePresetSelect)
    elements.themeToggleBtn.addEventListener("click", toggleTheme)
    logToPanel(`${elements.themeToggleBtn ? "Theme toggle button found" : "Theme toggle button not found"}`, "info")

    // Add update preset button event listener
    if (elements.presetUpdateBtn) {
      elements.presetUpdateBtn.addEventListener("click", updateCurrentPreset)
    }

    // Modal events
    elements.savePresetBtn.addEventListener("click", handleSavePreset)
    elements.cancelPresetBtn.addEventListener("click", closePresetModal)
    elements.modalCloseBtn.addEventListener("click", closePresetModal)

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === elements.presetModal) {
        closePresetModal()
      }
    })

    // Advanced settings toggle
    elements.collapseBtn.addEventListener("click", toggleAdvancedSettings)

    // Add ripple effect to buttons
    document.querySelectorAll(".btn").forEach((button) => {
      button.addEventListener("click", createRipple)
    })

    // Check for unsaved changes before closing/refreshing
    window.addEventListener("beforeunload", (e) => {
      if (appState.ui.isDirty) {
        const message = "You have unsaved changes. Are you sure you want to leave?"
        e.returnValue = message
        return message
      }
    })

    logToPanel("Event listeners set up successfully", "info")
  }

  /**
   * Handle the reset form button click
   */
  function handleResetForm() {
    logToPanel("Resetting form", "info")

    // Confirm with the user if there are unsaved changes
    if (appState.ui.isDirty) {
      if (!confirm("You have unsaved changes. Are you sure you want to reset the form?")) {
        return
      }
    }

    // Reset form data to defaults
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

    // Reset UI elements
    elements.cuttingMethod.value = "disabled"
    elements.frequency.value = "medium"
    elements.transitions.checked = true
    elements.numSpeakers.value = "2"
    elements.numCameras.value = "2"

    // Reset current preset
    appState.currentPresetIndex = null
    elements.presetSelect.value = ""

    // Clear errors
    clearAllErrors()

    // Update UI
    updateSpeakersUI()
    updateTrackMappingUI()
    updateMinCutDurationBasedOnFrequency()
    setupAdvancedSettings()

    // Reset dirty state
    appState.ui.isDirty = false

    showToast("Form has been reset", "info")
    logToPanel("Form reset complete", "info")
  }

  /**
   * Handle the delete preset button click
   */
  function handleDeletePreset() {
    if (appState.currentPresetIndex === null) {
      showToast("No preset selected", "warning")
      logToPanel("Delete preset attempted with no preset selected", "warning")
      return
    }

    const presetName = appState.presets[appState.currentPresetIndex].name

    if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
      logToPanel(`Deleting preset: ${presetName}`, "info")

      // Remove the preset
      appState.presets.splice(appState.currentPresetIndex, 1)

      // Save to storage
      savePresetsToStorage()

      // Update the dropdown
      updatePresetDropdown()

      // Reset current preset
      appState.currentPresetIndex = null
      elements.presetSelect.value = ""

      showToast(`Preset "${presetName}" has been deleted`, "success")
    }
  }

  /**
   * Open the preset modal for saving a new preset
   */
  function openPresetModal() {
    if (!validateForm()) {
      showToast("Please fix the errors before saving a preset", "error")
      logToPanel("Cannot open preset modal due to validation errors", "error")
      return
    }

    // Set flag for new preset
    appState.ui.isNewPreset = true

    // If there are unsaved changes to a current preset, ask to save them first
    if (appState.ui.isDirty && appState.currentPresetIndex !== null) {
      const currentPresetName = appState.presets[appState.currentPresetIndex].name
      if (
        confirm(`You have unsaved changes to preset "${currentPresetName}". Save changes before creating a new preset?`)
      ) {
        // Update the current preset with current form data
        const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
        appState.presets[appState.currentPresetIndex].data = updatedPresetData
        savePresetsToStorage()
        showToast(`Changes to preset "${currentPresetName}" saved`, "success")
        logToPanel(`Updated preset "${currentPresetName}" before creating new preset`, "info")
      }
    }

    // Clear the preset name field for a new preset
    elements.presetName.value = ""
    elements.presetModal.classList.add("active")
    elements.presetName.focus()

    // Clear any previous errors
    document.getElementById("presetNameError").textContent = ""
    elements.presetName.classList.remove("error")

    logToPanel("Preset modal opened for new preset", "info")
  }

  /**
   * Close the preset modal
   */
  function closePresetModal() {
    elements.presetModal.classList.remove("active")
    logToPanel("Preset modal closed", "info")
  }

  /**
   * Handle the save preset button click
   */
  function handleSavePreset() {
    const presetName = elements.presetName.value.trim()
    logToPanel(`Attempting to save preset: "${presetName}"`, "info")

    if (!presetName) {
      document.getElementById("presetNameError").textContent = "Preset name is required"
      elements.presetName.classList.add("error")
      logToPanel("Preset save failed: Name is required", "error")
      return
    }

    // Check for duplicate names
    const isDuplicate = appState.presets.some((preset) => preset.name === presetName)
    if (isDuplicate) {
      document.getElementById("presetNameError").textContent = "A preset with this name already exists"
      elements.presetName.classList.add("error")
      logToPanel("Preset save failed: Duplicate name", "error")
      return
    }

    // Create a deep copy of the current form data
    const presetData = JSON.parse(JSON.stringify(appState.formData))

    // Add the new preset
    appState.presets.push({
      name: presetName,
      data: presetData,
    })

    // Save to storage
    savePresetsToStorage()

    // Update the dropdown
    updatePresetDropdown()

    // Select the new preset
    elements.presetSelect.value = (appState.presets.length - 1).toString()
    appState.currentPresetIndex = appState.presets.length - 1

    // Reset dirty state
    appState.ui.isDirty = false

    // Close modal
    closePresetModal()

    showToast(`Preset "${presetName}" has been saved`, "success")
    logToPanel(`Preset "${presetName}" saved successfully`, "info")
  }

  /**
   * Handle frequency change and update min cut duration
   */
  function handleFrequencyChange() {
    updateFormState("frequency")
    updateMinCutDurationBasedOnFrequency()
    logToPanel(`Frequency changed to: ${appState.formData.frequency}`, "info")
  }

  /**
   * Update minCutDuration based on frequency
   */
  function updateMinCutDurationBasedOnFrequency() {
    const frequency = appState.formData.frequency
    let newMinCutDuration = 1.5 // default

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
    logToPanel(`Min cut duration updated to: ${newMinCutDuration}s based on frequency: ${frequency}`, "info")

    // Update the UI if the element exists
    if (elements.minCutDuration) {
      elements.minCutDuration.value = newMinCutDuration
    }
  }

  /**
   * Toggle between light and dark theme
   */
  function toggleTheme() {
    const newTheme = appState.ui.theme === "dark" ? "light" : "dark"
    appState.ui.theme = newTheme
    document.documentElement.setAttribute("data-theme", newTheme)
    saveThemePreference(newTheme)
    updateThemeUI()
    logToPanel(`Theme changed to: ${newTheme}`, "info")
  }

  /**
   * Update UI based on current theme
   */
  function updateThemeUI() {
    const isDark = appState.ui.theme === "dark"
    document.documentElement.setAttribute("data-theme", appState.ui.theme)

    // Update theme toggle button
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

  /**
   * Update the form state when a field changes
   * @param {string} field - The field name to update
   */
  function updateFormState(field) {
    const element = elements[field]

    if (element) {
      // Get the value based on input type
      let value
      if (element.type === "checkbox") {
        value = element.checked
      } else if (element.type === "number") {
        value = Number.parseFloat(element.value)
      } else {
        value = element.value
      }

      // Update the state
      appState.formData[field] = value

      // Mark form as dirty (unsaved changes)
      appState.ui.isDirty = true

      // Clear any error for this field
      clearError(field)

      logToPanel(`Form field updated: ${field} = ${value}`, "info")
    }
  }

  /**
   * Handle speaker count change
   */
  function handleSpeakerChange() {
    const speakerCount = Number.parseInt(elements.numSpeakers.value, 10)
    appState.formData.numSpeakers = speakerCount
    updateSpeakersUI()
    updateTrackMappingUI()
    appState.ui.isDirty = true
    logToPanel(`Speaker count changed to: ${speakerCount}`, "info")
  }

  /**
   * Handle camera count change
   */
  function handleCameraChange() {
    const cameraCount = Number.parseInt(elements.numCameras.value, 10)
    appState.formData.numCameras = cameraCount
    updateTrackMappingUI()
    appState.ui.isDirty = true
    logToPanel(`Camera count changed to: ${cameraCount}`, "info")
  }

  /**
   * Update the speaker name inputs based on speaker count
   */
  function updateSpeakersUI() {
    const speakerCount = appState.formData.numSpeakers
    const container = elements.speakerNames

    logToPanel(`Updating speakers UI for ${speakerCount} speakers`, "info")

    container.innerHTML = ""

    // Create inputs for each speaker
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

      // Add event listener to update state on input
      input.addEventListener("input", (e) => {
        appState.formData.speakerNames[i] = e.target.value
        updateTrackMappingUI()
        clearError(`speakerName${i}`)
        appState.ui.isDirty = true
        logToPanel(`Speaker ${i + 1} name updated to: ${e.target.value}`, "info")
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

  /**
   * Update the track mapping UI with current track information
   */
  function updateTrackMappingUI() {
    const cameraCount = appState.formData.numCameras
    const speakerCount = appState.formData.numSpeakers
    const container = elements.trackMapping

    logToPanel(`Updating track mapping UI for ${cameraCount} cameras and ${speakerCount} speakers`, "info")

    // Clear the container
    container.innerHTML = ""

    // If tracks haven't been loaded yet, show a loading indicator
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

    // Ensure arrays are initialized with correct length
    if (!appState.formData.trackMapping || appState.formData.trackMapping.length !== cameraCount) {
      appState.formData.trackMapping = Array(cameraCount).fill("")
    }
    if (!appState.formData.trackNumbers || appState.formData.trackNumbers.length !== cameraCount) {
      appState.formData.trackNumbers = Array(cameraCount).fill(1)
    }
    if (!appState.formData.audioTrackNumbers || appState.formData.audioTrackNumbers.length !== cameraCount) {
      appState.formData.audioTrackNumbers = Array(cameraCount).fill(1)
    }

    // Create mapping items for each camera
    for (let i = 0; i < cameraCount; i++) {
      const cameraItem = document.createElement("div")
      cameraItem.className = "camera-item"

      const cameraHeader = document.createElement("h3")
      cameraHeader.className = "camera-header"
      cameraHeader.textContent = `Camera ${i + 1}`

      const cameraControls = document.createElement("div")
      cameraControls.className = "camera-controls"

      // Speaker assignment
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

      // Add "Not assigned" option
      const noneOption = document.createElement("option")
      noneOption.value = ""
      noneOption.textContent = "Not assigned"
      speakerSelect.appendChild(noneOption)

      // Add options for each speaker
      for (let j = 0; j < speakerCount; j++) {
        const option = document.createElement("option")
        option.value = j.toString()

        // Use speaker name if available, otherwise use default
        const speakerName = appState.formData.speakerNames[j] || `Speaker ${j + 1}`
        option.textContent = speakerName

        speakerSelect.appendChild(option)
      }

      // Set current value if available
      if (appState.formData.trackMapping[i]) {
        speakerSelect.value = appState.formData.trackMapping[i]
      }

      // Add event listener to update state on change
      speakerSelect.addEventListener("change", (e) => {
        appState.formData.trackMapping[i] = e.target.value
        clearError(`camera${i}Select`)
        appState.ui.isDirty = true
        logToPanel(`Camera ${i + 1} assigned to speaker: ${e.target.value}`, "info")
      })

      speakerWrapper.appendChild(speakerSelect)
      speakerWrapper.appendChild(document.createElement("div"))
      speakerWrapper.lastChild.className = "select-icon"

      speakerGroup.appendChild(speakerLabel)
      speakerGroup.appendChild(speakerWrapper)

      // Error message for speaker assignment
      const speakerError = document.createElement("div")
      speakerError.className = "form-error"
      speakerError.id = `camera${i}SelectError`
      speakerGroup.appendChild(speakerError)

      // Track inputs
      const trackInputs = document.createElement("div")
      trackInputs.className = "track-inputs"

      // Video track dropdown
      const videoTrackGroup = document.createElement("div")
      videoTrackGroup.className = "track-input-group"

      const videoTrackLabel = document.createElement("label")
      videoTrackLabel.textContent = "Video Track"
      videoTrackLabel.setAttribute("for", `videoTrack${i}`)

      // Create dropdown for video tracks
      const videoTrackSelect = document.createElement("select")
      videoTrackSelect.className = "track-dropdown"
      videoTrackSelect.id = `videoTrack${i}`

      // Add options for video tracks
      const videoTrackCount = appState.trackInfo.videoTracksCount || 0

      for (let j = 1; j <= videoTrackCount; j++) {
        const option = document.createElement("option")
        option.value = j.toString()

        // Add status indicator if track info is available
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

      // Set current value
      videoTrackSelect.value = appState.formData.trackNumbers[i].toString()

      videoTrackSelect.addEventListener("change", (e) => {
        appState.formData.trackNumbers[i] = Number.parseInt(e.target.value, 10)
        appState.ui.isDirty = true
        logToPanel(`Camera ${i + 1} video track set to: ${e.target.value}`, "info")
      })

      videoTrackGroup.appendChild(videoTrackLabel)
      videoTrackGroup.appendChild(videoTrackSelect)

      // Audio track dropdown
      const audioTrackGroup = document.createElement("div")
      audioTrackGroup.className = "track-input-group"

      const audioTrackLabel = document.createElement("label")
      audioTrackLabel.textContent = "Audio Track"
      audioTrackLabel.setAttribute("for", `audioTrack${i}`)

      // Create dropdown for audio tracks
      const audioTrackSelect = document.createElement("select")
      audioTrackSelect.className = "track-dropdown"
      audioTrackSelect.id = `audioTrack${i}`

      // Add options for audio tracks
      const audioTrackCount = appState.trackInfo.audioTracksCount || 0

      for (let j = 1; j <= audioTrackCount; j++) {
        const option = document.createElement("option")
        option.value = j.toString()

        // Add status indicator if track info is available
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

      // Set current value
      audioTrackSelect.value = appState.formData.audioTrackNumbers[i].toString()

      audioTrackSelect.addEventListener("change", (e) => {
        appState.formData.audioTrackNumbers[i] = Number.parseInt(e.target.value, 10)
        appState.ui.isDirty = true
        logToPanel(`Camera ${i + 1} audio track set to: ${e.target.value}`, "info")
      })

      audioTrackGroup.appendChild(audioTrackLabel)
      audioTrackGroup.appendChild(audioTrackSelect)

      // Add track inputs to container
      trackInputs.appendChild(videoTrackGroup)
      trackInputs.appendChild(audioTrackGroup)

      // Assemble the camera item
      cameraControls.appendChild(speakerGroup)
      cameraItem.appendChild(cameraHeader)
      cameraItem.appendChild(cameraControls)
      cameraItem.appendChild(trackInputs)
      container.appendChild(cameraItem)
    }
  }

  /**
   * Set up advanced settings section
   */
  function setupAdvancedSettings() {
    logToPanel("Setting up advanced settings", "info")

    // Set initial state
    elements.advancedSection.setAttribute("data-expanded", appState.ui.advancedSettingsExpanded.toString())
    elements.collapseBtn.setAttribute("aria-expanded", appState.ui.advancedSettingsExpanded.toString())

    // Update the content of the advanced settings section
    const advancedContent = elements.advancedSection.querySelector(".collapsible-content")
    if (advancedContent) {
      advancedContent.innerHTML = `
        <h3 class="advanced-settings-header">Advanced Settings</h3>
        <div class="advanced-settings-grid">
          <div class="advanced-settings-item">
            <label for="audioThreshold">Audio Threshold</label>
            <input type="text" id="audioThreshold" class="form-input" value="${appState.formData.audioThreshold || "-30dB"}">
            <div class="form-error" id="audioThresholdError"></div>
          </div>

          <div class="advanced-settings-item">
            <label for="minCutDuration">Minimum Cut Duration (sec)</label>
            <input type="number" id="minCutDuration" class="form-input" value="${appState.formData.minCutDuration || 1.5}" min="0.5" max="10" step="0.5">
            <div class="form-error" id="minCutDurationError"></div>
          </div>

          <div class="advanced-settings-item">
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

      // Re-attach event listeners
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

      // Update references in elements object
      elements.audioThreshold = audioThreshold
      elements.minCutDuration = minCutDuration
      elements.transitionType = transitionType
    }
  }

  /**
   * Toggle advanced settings visibility
   */
  function toggleAdvancedSettings() {
    appState.ui.advancedSettingsExpanded = !appState.ui.advancedSettingsExpanded
    elements.advancedSection.setAttribute("data-expanded", appState.ui.advancedSettingsExpanded.toString())
    elements.collapseBtn.setAttribute("aria-expanded", appState.ui.advancedSettingsExpanded.toString())
    logToPanel(`Advanced settings ${appState.ui.advancedSettingsExpanded ? "expanded" : "collapsed"}`, "info")
  }

  /**
   * Validate the form before submission
   * @returns {boolean} - Whether the form is valid
   */
  function validateForm() {
    logToPanel("Validating form", "info")

    let isValid = true
    appState.ui.errors = {}
    appState.ui.globalError = null

    // Clear global error display
    if (elements.globalErrorContainer) {
      elements.globalErrorContainer.textContent = ""
      elements.globalErrorContainer.style.display = "none"
    }

    // Clear track validation display
    if (elements.trackValidationContainer) {
      elements.trackValidationContainer.textContent = ""
      elements.trackValidationContainer.style.display = "none"
    }

    // Validate speaker names (at least one must be filled)
    let hasNamedSpeaker = false
    for (let i = 0; i < appState.formData.numSpeakers; i++) {
      if (appState.formData.speakerNames[i] && appState.formData.speakerNames[i].trim() !== "") {
        hasNamedSpeaker = true
        break
      }
    }

    if (!hasNamedSpeaker) {
      for (let i = 0; i < appState.formData.numSpeakers; i++) {
        setError(`speakerName${i}`, "At least one speaker must have a name")
      }
      isValid = false
      logToPanel("Validation failed: No named speakers", "error")
    }

    // Validate track mapping (each camera should be assigned)
    const assignedSpeakers = new Set()
    for (let i = 0; i < appState.formData.numCameras; i++) {
      if (!appState.formData.trackMapping[i]) {
        setError(`camera${i}Select`, "Please assign this camera to a speaker")
        isValid = false
        logToPanel(`Validation failed: Camera ${i + 1} not assigned to a speaker`, "error")
      } else {
        assignedSpeakers.add(appState.formData.trackMapping[i])
      }
    }

    // Ensure at least one camera is assigned to each speaker
    if (assignedSpeakers.size < appState.formData.numSpeakers) {
      appState.ui.globalError = "Each speaker must have at least one camera assigned"
      isValid = false
      logToPanel("Validation failed: Not all speakers have cameras assigned", "error")

      if (elements.globalErrorContainer) {
        elements.globalErrorContainer.textContent = appState.ui.globalError
        elements.globalErrorContainer.style.display = "block"
      }
    }

    // Validate only the tracks that are being used
    const usedVideoTracks = []
    const usedAudioTracks = []
    const trackValidationDetails = []

    for (let i = 0; i < appState.formData.numCameras; i++) {
      // Only validate if this camera is assigned to a speaker
      if (appState.formData.trackMapping[i]) {
        const videoTrack = appState.formData.trackNumbers[i]
        const audioTrack = appState.formData.audioTrackNumbers[i]

        // Check for duplicate video tracks
        if (usedVideoTracks.includes(videoTrack)) {
          trackValidationDetails.push(`Video track ${videoTrack} is used more than once`)
          isValid = false
          logToPanel(`Validation failed: Video track ${videoTrack} used multiple times`, "error")
        } else {
          usedVideoTracks.push(videoTrack)
        }

        // Check for duplicate audio tracks
        if (usedAudioTracks.includes(audioTrack)) {
          trackValidationDetails.push(`Audio track ${audioTrack} is used more than once`)
          isValid = false
          logToPanel(`Validation failed: Audio track ${audioTrack} used multiple times`, "error")
        } else {
          usedAudioTracks.push(audioTrack)
        }

        // Check if the tracks have valid clips
        if (appState.trackInfo.videoTrackStatus && appState.trackInfo.videoTrackStatus[videoTrack - 1] !== undefined) {
          const status = appState.trackInfo.videoTrackStatus[videoTrack - 1]
          if (status === 0) {
            trackValidationDetails.push(`Video track ${videoTrack} has no clips`)
            isValid = false
            logToPanel(`Validation failed: Video track ${videoTrack} has no clips`, "error")
          } else if (status === 2) {
            trackValidationDetails.push(`Video track ${videoTrack} has multiple clips`)
            isValid = false
            logToPanel(`Validation failed: Video track ${videoTrack} has multiple clips`, "error")
          }
        }

        if (appState.trackInfo.audioTrackStatus && appState.trackInfo.audioTrackStatus[audioTrack - 1] !== undefined) {
          const status = appState.trackInfo.audioTrackStatus[audioTrack - 1]
          if (status === 0) {
            trackValidationDetails.push(`Audio track ${audioTrack} has no clips`)
            isValid = false
            logToPanel(`Validation failed: Audio track ${audioTrack} has no clips`, "error")
          } else if (status === 2) {
            trackValidationDetails.push(`Audio track ${audioTrack} has multiple clips`)
            isValid = false
            logToPanel(`Validation failed: Audio track ${audioTrack} has multiple clips`, "error")
          }
        }
      }
    }

    // Check if audio-based cutting is selected but no audio tracks are available
    if (appState.formData.cuttingMethod === "audio" && usedAudioTracks.length === 0) {
      appState.ui.globalError = "Audio-based cutting requires at least one audio track"
      isValid = false
      logToPanel("Validation failed: Audio-based cutting selected but no audio tracks used", "error")

      if (elements.globalErrorContainer) {
        elements.globalErrorContainer.textContent = appState.ui.globalError
        elements.globalErrorContainer.style.display = "block"
      }
    }

    // Display track validation errors if any
    if (trackValidationDetails.length > 0) {
      appState.trackValidation = {
        valid: false,
        message: "Track validation failed. Please check track assignments.",
        details: trackValidationDetails,
        audioTracks: usedAudioTracks.length,
        videoTracks: usedVideoTracks.length,
      }

      if (elements.trackValidationContainer) {
        elements.trackValidationContainer.innerHTML = `
          <strong>Track validation errors:</strong>
          <ul>
            ${trackValidationDetails.map((detail) => `<li>${detail}</li>`).join("")}
          </ul>
          <p>Found ${usedVideoTracks.length} video tracks and ${usedAudioTracks.length} audio tracks assigned.</p>
        `
        elements.trackValidationContainer.style.display = "block"
      }
    } else {
      appState.trackValidation = {
        valid: true,
        message: "",
        details: [],
        audioTracks: usedAudioTracks.length,
        videoTracks: usedVideoTracks.length,
      }
    }

    if (isValid) {
      logToPanel("Form validation passed", "info")
    } else {
      logToPanel("Form validation failed", "error")
    }

    return isValid
  }

  /**
   * Set an error message for a field
   * @param {string} field - The field ID
   * @param {string} message - The error message
   */
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

    logToPanel(`Error set for ${field}: ${message}`, "error")
  }

  /**
   * Clear an error message for a field
   * @param {string} field - The field ID
   */
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

  /**
   * Clear all error messages
   */
  function clearAllErrors() {
    appState.ui.errors = {}
    appState.ui.globalError = null

    // Clear global error container
    if (elements.globalErrorContainer) {
      elements.globalErrorContainer.textContent = ""
      elements.globalErrorContainer.style.display = "none"
    }

    // Clear track validation container
    if (elements.trackValidationContainer) {
      elements.trackValidationContainer.textContent = ""
      elements.trackValidationContainer.style.display = "none"
    }

    // Clear all field errors
    document.querySelectorAll(".form-error").forEach((errorElement) => {
      errorElement.textContent = ""
    })

    document.querySelectorAll(".form-input, .form-select, .track-dropdown").forEach((inputElement) => {
      inputElement.classList.remove("error")
    })

    logToPanel("All errors cleared", "info")
  }

  /**
   * Check track info from Premiere Pro
   * @param {Function} callback - Callback function to run after getting track info
   */
  function checkTrackInfo(callback) {
    const csInterface = new CSInterface()
    logToPanel("Checking track info from Premiere Pro", "info")

    try {
      // Reset track info
      appState.trackInfo = {
        audioTracks: [],
        videoTracks: [],
        audioTracksCount: 0,
        videoTracksCount: 0,
        hasErrors: false,
        errorMessages: [],
        audioTrackStatus: [], // 0: no clip, 1: one clip, 2: multiple clips
        videoTrackStatus: [], // 0: no clip, 1: one clip, 2: multiple clips
        tracksMatch: true,
      }

      // First get audio tracks
      csInterface.evalScript("$._PPP_.getAudioTrackClipItemsPath()", (audioResult) => {
        try {
          logToPanel(`Audio track result: ${audioResult}`, "info")

          // Parse audio track results
          let audioTracks = []
          try {
            audioTracks = JSON.parse(audioResult)
          } catch (e) {
            // If not valid JSON, try splitting by comma
            audioTracks = audioResult.split(",")
            logToPanel(`Parsed audio tracks by splitting: ${audioTracks.length} tracks`, "info")
          }

          appState.trackInfo.audioTracks = audioTracks
          appState.trackInfo.audioTracksCount = audioTracks.length

          // Determine status for each track
          appState.trackInfo.audioTrackStatus = audioTracks.map((path) => {
            if (path === "") return 0 // No clip
            if (path.includes("Error: Multiple clips")) return 2 // Multiple clips
            return 1 // One clip
          })

          logToPanel(`Audio track statuses: ${JSON.stringify(appState.trackInfo.audioTrackStatus)}`, "info")

          // Now get video tracks
          csInterface.evalScript("$._PPP_.getVideoTracks()", (videoResult) => {
            try {
              logToPanel(`Video track result: ${videoResult}`, "info")

              // Parse video track results
              let videoTracks = []
              try {
                videoTracks = JSON.parse(videoResult)
              } catch (e) {
                // If not valid JSON, try splitting by comma
                videoTracks = videoResult.split(",")
                logToPanel(`Parsed video tracks by splitting: ${videoTracks.length} tracks`, "info")
              }

              appState.trackInfo.videoTracks = videoTracks
              appState.trackInfo.videoTracksCount = videoTracks.length

              // Determine status for each track
              appState.trackInfo.videoTrackStatus = videoTracks.map((path) => {
                if (path === "") return 0 // No clip
                if (path.includes("Error: Multiple clips")) return 2 // Multiple clips
                return 1 // One clip
              })

              logToPanel(`Video track statuses: ${JSON.stringify(appState.trackInfo.videoTrackStatus)}`, "info")

              // Check if audio and video track counts match
              appState.trackInfo.tracksMatch =
                appState.trackInfo.audioTracksCount === appState.trackInfo.videoTracksCount

              if (!appState.trackInfo.tracksMatch) {
                appState.trackInfo.hasErrors = true
                appState.trackInfo.errorMessages.push(
                  `Track count mismatch: ${appState.trackInfo.videoTracksCount} video tracks and ${appState.trackInfo.audioTracksCount} audio tracks`,
                )
                logToPanel("Track count mismatch detected", "warning")
              }

              // Call the callback with the track info
              if (callback && typeof callback === "function") {
                callback(appState.trackInfo)
              }
            } catch (error) {
              logToPanel(`Error processing video track info: ${error.message}`, "error")
              appState.trackInfo.hasErrors = true
              appState.trackInfo.errorMessages.push("Error processing video track information")

              if (callback && typeof callback === "function") {
                callback(appState.trackInfo)
              }
            }
          })
        } catch (error) {
          logToPanel(`Error processing audio track info: ${error.message}`, "error")
          appState.trackInfo.hasErrors = true
          appState.trackInfo.errorMessages.push("Error processing audio track information")

          if (callback && typeof callback === "function") {
            callback(appState.trackInfo)
          }
        }
      })
    } catch (error) {
      logToPanel(`Error checking track info: ${error.message}`, "error")
      appState.trackInfo.hasErrors = true
      appState.trackInfo.errorMessages.push("Error communicating with Premiere Pro")

      if (callback && typeof callback === "function") {
        callback(appState.trackInfo)
      }
    }
  }

  /**
   * Update the handleCreateEdit function to include track validation
   */
  async function handleCreateEdit() {
    const csInterface = new CSInterface()
    if (appState.ui.isProcessing) {
      logToPanel("Create edit button clicked while already processing", "warning");
      return;
    }
    logToPanel("Create edit button clicked", "info");

    appState.ui.isProcessing = true;
    elements.createEditBtn.disabled = true;
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
    `;

    try {
      await new Promise(resolve => checkTrackInfo(resolve));
      logToPanel("Track check complete, validating form", "info");
    } catch (e) {
      // if your checkTrackInfo can reject, handle here
      logToPanel("Track check failed: " + e, "error");
      resetCreateButton();
      return;
    }

    if (!validateForm()) {
      showToast("Please fix the errors before creating the edit", "error");
      logToPanel("Form validation failed, edit creation aborted", "error");
      scrollToFirstErrorField();
      resetCreateButton();
      return;
    }

    elements.createEditBtn.innerHTML = `
      <span class="btn-icon">
        <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                   M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                   M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </span>
      Processing...
    `;

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
    };

    for (let i = 0; i < appState.formData.numSpeakers; i++) {
      const speakerName = appState.formData.speakerNames[i] || `Speaker ${i + 1}`;
      const cameras = [];
      for (let j = 0; j < appState.formData.numCameras; j++) {
        if (appState.formData.trackMapping[j] === i.toString()) {
          cameras.push({
            cameraIndex: j,
            videoTrack: appState.formData.trackNumbers[j],
            audioTrack: appState.formData.audioTrackNumbers[j],
          });
        }
      }
      editData.speakers.push({ name: speakerName, cameras });
    }

    logToPanel(`Sending edit data to Premiere Pro: ${JSON.stringify(editData)}`, "info");

    const { frequency, minCutDuration, audioThreshold } = appState.formData;
    const mergeGapMap = {
      low: minCutDuration * 0.25,
      medium: minCutDuration * 0.5,
      high: minCutDuration * 1.0,
    };
    const mergeGap = mergeGapMap[frequency] ?? (minCutDuration * 0.5);

    csInterface.evalScript("$._PPP_.createClone()");
    logToPanel("Created clone", "info");

    try {
      const args = [];
      for (let i = 0; i < appState.formData.numCameras; i++) {
        if (!appState.formData.trackMapping[i]) continue;

        const file = appState.trackInfo.audioTracks[appState.formData.audioTrackNumbers[i] - 1];
        const vTrack = appState.formData.trackNumbers[i];
        const aTrack = appState.formData.audioTrackNumbers[i];

        if (!file || file.includes("Error")) {
          logToPanel(`Skipping bad track ${aTrack}`, "warn");
          continue;
        }

        args.push(file, vTrack, aTrack);
      }

      args.push(
        String(audioThreshold),
        String(minCutDuration),
        String(mergeGap)
      );

      showToast("Running audio analysis on all tracks…", "info");
      // document.getElementById("out").textContent = `${args.join(" ")} length: ${args.length}`;
      logToPanel(`Invoking analysis with ${args.length} arguments`, "info");

      // 3) Call the packaged CLI once
      const stdout = await runAudioAnalysis(args);
      const { timeline } = JSON.parse(stdout);
      // logToPanel(`Received ${timeline} timeline entries`, "info");

      await new Promise(resolve => {
        csInterface.evalScript(
          `$._PPP_.processTimeline(${JSON.stringify(timeline)});`,
          () => {
            showToast("Timeline applied in Premiere Pro", "success");
            logToPanel("processTimeline() callback received", "info");
            resolve();
          }
        );
      });

      showToast("All done!", "success");
      logToPanel("Completed multi-camera audio analysis and edit", "success");
    }
    catch (err) {
      showToast(`Error during analysis: ${err}`, "error");
      logToPanel(`Error: ${err}`, "error");
    }
    finally {
      resetCreateButton();
      appState.ui.isDirty = false;
      appState.ui.isProcessing = false;
    }
  }

  function resetCreateButton() {
    elements.createEditBtn.disabled = false;
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
    `;
  }

  function scrollToFirstErrorField() {
    const firstErrorField = Object.keys(appState.ui.errors)[0];
    if (firstErrorField) {
      const el = document.getElementById(firstErrorField);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /**
   * Handle preset selection
   */
  function handlePresetSelect() {
    const selectedIndex = elements.presetSelect.value

    if (!selectedIndex) return

    // Check for unsaved changes
    if (appState.ui.isDirty && appState.currentPresetIndex !== Number.parseInt(selectedIndex)) {
      if (appState.currentPresetIndex !== null) {
        const currentPresetName = appState.presets[appState.currentPresetIndex].name
        if (
          confirm(
            `You have unsaved changes to preset "${currentPresetName}". Save changes before loading a different preset?`,
          )
        ) {
          // Save changes to current preset
          const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
          appState.presets[appState.currentPresetIndex].data = updatedPresetData
          savePresetsToStorage()
          showToast(`Changes to preset "${currentPresetName}" saved`, "success")
          logToPanel(`Changes to preset "${currentPresetName}" saved before loading new preset`, "info")
        }
      } else if (confirm("You have unsaved changes. Save as a new preset before loading?")) {
        // Open modal to save as new preset
        openPresetModal()
        // Revert selection since we're saving first
        elements.presetSelect.value = appState.currentPresetIndex !== null ? appState.currentPresetIndex.toString() : ""
        return
      }
    }

    // Load the selected preset
    const preset = appState.presets[selectedIndex]
    loadPreset(preset.data)

    // Update current preset index
    appState.currentPresetIndex = Number.parseInt(selectedIndex)

    // Reset dirty state
    appState.ui.isDirty = false

    showToast(`Preset "${preset.name}" loaded`, "info")
    logToPanel(`Preset "${preset.name}" loaded`, "info")
  }

  /**
   * Update an existing preset
   */
  function updateCurrentPreset() {
    if (appState.currentPresetIndex === null) {
      openPresetModal() // If no preset is selected, open modal to create new
      return
    }

    if (!validateForm()) {
      showToast("Please fix the errors before updating the preset", "error")
      logToPanel("Cannot update preset due to validation errors", "error")
      return
    }

    const presetName = appState.presets[appState.currentPresetIndex].name

    if (confirm(`Update preset "${presetName}" with current settings?`)) {
      // Update the preset data
      const updatedPresetData = JSON.parse(JSON.stringify(appState.formData))
      appState.presets[appState.currentPresetIndex].data = updatedPresetData

      // Save to storage
      savePresetsToStorage()

      // Reset dirty state
      appState.ui.isDirty = false

      showToast(`Preset "${presetName}" has been updated`, "success")
      logToPanel(`Preset "${presetName}" updated successfully`, "info")
    }
  }

  /**
   * Load a preset into the form
   * @param {Object} presetData - The preset data to load
   */
  function loadPreset(presetData) {
    logToPanel(`Loading preset data: ${JSON.stringify(presetData)}`, "info")

    // Update state
    appState.formData = JSON.parse(JSON.stringify(presetData))

    // Update UI
    elements.cuttingMethod.value = presetData.cuttingMethod
    elements.frequency.value = presetData.frequency
    elements.transitions.checked = presetData.transitions
    elements.numSpeakers.value = presetData.numSpeakers
    elements.numCameras.value = presetData.numCameras

    // Update UI components
    updateSpeakersUI()
    updateTrackMappingUI()

    // Update advanced settings if they exist
    if (elements.minCutDuration) {
      elements.minCutDuration.value = presetData.minCutDuration || 1.5
    }
    if (elements.audioThreshold) {
      elements.audioThreshold.value = presetData.audioThreshold || "-30dB"
    }
    if (elements.transitionType) {
      elements.transitionType.value = presetData.transitionType || "cut"
    }

    // Clear errors
    clearAllErrors()
  }

  /**
   * Update the preset dropdown with current presets
   */
  function updatePresetDropdown() {
    const select = elements.presetSelect

    // Clear current options
    select.innerHTML = '<option value="" disabled selected>Select preset...</option>'

    // Add options for each preset
    appState.presets.forEach((preset, index) => {
      const option = document.createElement("option")
      option.value = index.toString()
      option.textContent = preset.name
      select.appendChild(option)
    })

    logToPanel(`Preset dropdown updated with ${appState.presets.length} presets`, "info")
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (info, success, warning, error)
   */
  function showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toastContainer"
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }

    // Create toast element
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

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
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `

    // Add to container
    toastContainer.appendChild(toast)

    // Log the toast message
    logToPanel(`Toast notification: ${message} (${type})`, "info")

    // Remove after animation completes
    setTimeout(() => {
      toast.classList.add("fade-out")
      setTimeout(() => {
        toast.remove()
      }, 300)
    }, 5000)
  }

  /**
   * Create ripple effect on button click
   * @param {Event} event - The click event
   */
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

  // async function runAudioAnalysis(cliArgs) {
  //   return new Promise((resolve, reject) => {
  //     const cs = new CSInterface();
  //     const extDir = cs.getSystemPath(SystemPath.EXTENSION);
  //     const isWin = cs.getOSInformation().includes("Windows");
  //     const sep = isWin ? "\\" : "/";

  //     if (!Array.isArray(cliArgs) || cliArgs.length < 4) {
  //       return reject("runAudioAnalysis requires at least one file+tracks and the 3 params");
  //     }

  //     const safeArgs = cliArgs.map(arg => {
  //       const s = String(arg);
  //       return isWin ? s.replace(/\\/g, "\\\\") : s;
  //     });

  //     // pick the binary
  //     const exeName = isWin ? "audioTool-win.exe" : "audioTool-mac";
  //     let exePath = extDir + sep + "audioAnalysis" + sep + exeName;
  //     if (isWin) exePath = exePath.replace(/\\/g, "\\\\");

  //     // start the process
  //     const startRes = window.cep.process.createProcess(exePath, ...safeArgs);
  //     if (startRes.err !== 0) {
  //       return reject(`Error starting analysis process: ${startRes.err}`);
  //     }
  //     const pid = startRes.data;

  //     // poll until it exits
  //     const poll = setInterval(() => {
  //       const stat = window.cep.process.isRunning(pid);
  //       if (stat.err !== 0) {
  //         clearInterval(poll);
  //         return reject(`Error polling process: ${stat.err}`);
  //       }
  //       if (!stat.data) {
  //         clearInterval(poll);
  //         // read its stderr
  //         // window.cep.process.stderr(pid, stdout => {
  //         // 	if (!stdout) {
  //         // 		return reject("No output from analysis tool");
  //         // 	}
  //         // 	resolve(stdout);
  //         // });
  //         window.cep.process.stdout(pid, stdout => {
  //           if (!stdout) {
  //             return reject("No output from analysis tool");
  //           }
  //           resolve(stdout);
  //         });
  //       }
  //     }, 300);
  //   });
  // }

  async function runAudioAnalysis(cliArgs) {
  return new Promise((resolve, reject) => {
    const cs     = new CSInterface();
    const extDir = cs.getSystemPath(SystemPath.EXTENSION);
    const isWin  = cs.getOSInformation().includes("Windows");
    const sep    = isWin ? "\\" : "/";

    if (!Array.isArray(cliArgs) || cliArgs.length < 4) {
      return reject("runAudioAnalysis requires at least one file+tracks and the 3 params");
    }

    // Escape Windows backslashes
    const safeArgs = cliArgs.map(a => String(a).replace(/\\/g, "\\\\"));

    // Build path to your CLI in `audioanalysis/`
    const exeName = isWin ? "audioTool-win.exe" : "audioTool-mac";
    let exePath = extDir + sep + "audioAnalysis" + sep + exeName;
    if (isWin) exePath = exePath.replace(/\\/g, "\\\\");

    // Start the process directly (no cmd.exe /bin/sh)
    const startRes = window.cep.process.createProcess(exePath, ...safeArgs);
    if (startRes.err !== 0) {
      return reject(`Error starting analysis process: ${startRes.err}`);
    }
    const pid = startRes.data;

    // Capture both streams
    let stdoutData = "";
    let stderrData = "";
    window.cep.process.stdout(pid, chunk => { stdoutData += chunk; });
    window.cep.process.stderr(pid, chunk => { stderrData += chunk; });

    // Poll until it exits
    const poll = setInterval(() => {
      const stat = window.cep.process.isRunning(pid);
      if (stat.err !== 0) {
        clearInterval(poll);
        return reject(`Error polling process: ${stat.err}`);
      }
      if (!stat.data) {
        clearInterval(poll);
        // If any stderr output, treat as error
        if (stderrData.trim()) {
          return reject(stderrData.trim());
        }
        // Else return stdout (must be JSON)
        if (!stdoutData.trim()) {
          return reject("No output from analysis tool");
        }
        resolve(stdoutData);
      }
    }, 500);
  });
}

  init();
})