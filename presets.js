/**
 * Multi-Camera Edit Tool - Presets Management
 * Handles saving, loading, and managing presets for the Timbre Panel interface
 */

// Preset management functions
window.PresetManager = {
    loadPresetsFromStorage: function (appState, elements, logToPanel, showToast) {
        try {
            const savedPresets = localStorage.getItem("timbrePresets")
            if (savedPresets) {
                appState.presets = JSON.parse(savedPresets)
                this.updatePresetDropdown(appState, elements, logToPanel)
                logToPanel("Presets loaded from storage", "info")
            }
        } catch (error) {
            logToPanel(`Error loading presets: ${error.message}`, "error")
            showToast("Error loading saved presets", "error")
        }
    },

    savePresetsToStorage: (appState, logToPanel, showToast) => {
        try {
            localStorage.setItem("timbrePresets", JSON.stringify(appState.presets))
            logToPanel("Presets saved to storage", "info")
        } catch (error) {
            logToPanel(`Error saving presets: ${error.message}`, "error")
            showToast("Error saving presets", "error")
        }
    },

    openPresetModal: function (appState, elements, validateForm, logToPanel, showToast) {
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
                this.savePresetsToStorage(appState, logToPanel, showToast)
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
    },

    closePresetModal: (elements, logToPanel) => {
        elements.presetModal.classList.remove("active")
        logToPanel("Preset modal closed", "info")
    },

    handleSavePreset: function (appState, elements, logToPanel, showToast) {
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
        this.savePresetsToStorage(appState, logToPanel, showToast)

        // Update the dropdown
        this.updatePresetDropdown(appState, elements, logToPanel)

        // Select the new preset
        elements.presetSelect.value = (appState.presets.length - 1).toString()
        appState.currentPresetIndex = appState.presets.length - 1

        // Reset dirty state
        appState.ui.isDirty = false

        // Close modal
        this.closePresetModal(elements, logToPanel)

        showToast(`Preset "${presetName}" has been saved`, "success")
        logToPanel(`Preset "${presetName}" saved successfully`, "info")
    },

    handleDeletePreset: function (appState, elements, logToPanel, showToast) {
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
            this.savePresetsToStorage(appState, logToPanel, showToast)

            // Update the dropdown
            this.updatePresetDropdown(appState, elements, logToPanel)

            // Reset current preset
            appState.currentPresetIndex = null
            elements.presetSelect.value = ""

            showToast(`Preset "${presetName}" has been deleted`, "success")
        }
    },

    handlePresetSelect: function (
        appState,
        elements,
        updateSpeakersUI,
        updateTrackMappingUI,
        clearAllErrors,
        logToPanel,
        showToast,
    ) {
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
                    this.savePresetsToStorage(appState, logToPanel, showToast)
                    showToast(`Changes to preset "${currentPresetName}" saved`, "success")
                    logToPanel(`Changes to preset "${currentPresetName}" saved before loading new preset`, "info")
                }
            } else if (confirm("You have unsaved changes. Save as a new preset before loading?")) {
                // Open modal to save as new preset
                this.openPresetModal(appState, elements, () => true, logToPanel, showToast)
                // Revert selection since we're saving first
                elements.presetSelect.value = appState.currentPresetIndex !== null ? appState.currentPresetIndex.toString() : ""
                return
            }
        }

        // Load the selected preset
        const preset = appState.presets[selectedIndex]
        this.loadPreset(preset.data, appState, elements, updateSpeakersUI, updateTrackMappingUI, clearAllErrors, logToPanel)

        // Update current preset index
        appState.currentPresetIndex = Number.parseInt(selectedIndex)

        // Reset dirty state
        appState.ui.isDirty = false

        showToast(`Preset "${preset.name}" loaded`, "info")
        logToPanel(`Preset "${preset.name}" loaded`, "info")
    },

    updateCurrentPreset: function (appState, elements, validateForm, logToPanel, showToast) {
        if (appState.currentPresetIndex === null) {
            this.openPresetModal(appState, elements, validateForm, logToPanel, showToast) // If no preset is selected, open modal to create new
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
            this.savePresetsToStorage(appState, logToPanel, showToast)

            // Reset dirty state
            appState.ui.isDirty = false

            showToast(`Preset "${presetName}" has been updated`, "success")
            logToPanel(`Preset "${presetName}" updated successfully`, "info")
        }
    },

    loadPreset: (presetData, appState, elements, updateSpeakersUI, updateTrackMappingUI, clearAllErrors, logToPanel) => {
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
    },

    updatePresetDropdown: (appState, elements, logToPanel) => {
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
    },
}
