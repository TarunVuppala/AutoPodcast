# Multi-Camera Edit Tool for Adobe Premiere Pro

## Overview
The Multi-Camera Edit Tool is an Adobe Premiere Pro extension that automates the creation of multi-camera edits based on audio analysis and customizable settings. This tool helps editors save time by automatically generating multi-camera sequences with intelligent camera switching based on audio cues, speaker assignments, and customizable parameters.

## Features
- **Audio-Based Cutting**: Automatically create cuts based on sophisticated audio analysis
  - Analyzes amplitude changes to detect natural speaking breaks
  - Configurable threshold settings for different audio environments
  - Intelligent merging of nearby cuts to prevent choppy edits
- **Customizable Frequency**: Control how often camera angles change
  - Very Low: Minimal cuts for a more stable viewing experience
  - Low: Fewer cuts, good for interviews and presentations
  - Medium: Balanced cutting frequency for most content
  - High: More dynamic cutting for engaging content
- **Speaker Assignment**: Assign specific cameras to different speakers
  - Name speakers for easier identification
  - Assign multiple cameras to each speaker for varied angles
  - Prioritize specific cameras for each speaker
- **Track Validation**: Ensures your timeline is properly set up before processing
  - Verifies each track has exactly one clip
  - Checks for track count mismatches
  - Provides detailed error messages for troubleshooting
- **Preset Management**: Save and load your favorite configurations
  - Save unlimited custom presets
  - Update existing presets
  - Delete unwanted presets
  - Persistent storage between sessions
- **Dark/Light Theme**: Choose your preferred interface style
  - Automatically saves your preference
  - Consistent styling throughout the interface

## Getting Started

### Prerequisites
- Adobe Premiere Pro (2022 or newer)
- A sequence with properly set up video and audio tracks
- Each track should contain exactly one clip

### Installation
1. Download the extension package from the Adobe Exchange
2. Double-click the `.zxp` file to install using Adobe Extension Manager
3. Restart Premiere Pro
4. Access the panel via Window > Extensions > Multi-Camera Edit Tool

### Basic Usage
1. Open a sequence containing your multi-camera footage
2. Configure your edit settings (cutting method, frequency, etc.)
3. Name your speakers for easier identification
4. Assign cameras to speakers and select the corresponding video/audio tracks
5. Click "Create Multi-Cam Edit" to generate your sequence

## Audio Analysis Process
The tool uses a sophisticated audio analysis process to determine optimal cut points:

1. **Threshold Detection**: Analyzes audio amplitude against your specified threshold
2. **Minimum Duration Enforcement**: Ensures cuts aren't too close together based on frequency setting
3. **Intelligent Merging**: Combines nearby potential cuts to create natural-feeling edits
4. **Speaker-Aware Cutting**: Prioritizes cuts based on speaker assignments

## Advanced Settings
- **Audio Threshold**: Set the sensitivity for detecting audio changes (-10dB to -60dB)
- **Minimum Cut Duration**: Control the minimum time between cuts (0.5s to 10s)
- **Transition Type**: Choose between different transition styles (Cut, Cross Dissolve, Dip to Black, Wipe)

## Tips for Best Results
- Ensure each track has exactly one clip
- Make sure audio and video track counts match
- Use the same number of audio and video tracks for each camera
- For audio-based cutting, ensure good quality audio with minimal background noise
- Start with the "Medium" frequency setting and adjust as needed
- Name your speakers descriptively for easier identification
- Use the track validation system to catch issues before processing

## Troubleshooting
- If you see track validation errors, check that each assigned track has exactly one clip
- If the tool isn't detecting your tracks, try closing and reopening your sequence
- For any persistent issues, check the Premiere Pro event panel for detailed logs
- If audio analysis isn't producing expected results, try adjusting the threshold and minimum cut duration

## Technical Implementation
The tool is built using:
- HTML/CSS for the user interface
- JavaScript for client-side logic and state management
- Adobe CEP (Common Extensibility Platform) for extension integration
- ExtendScript for communication with Premiere Pro

**License:** This project is proprietary and not open source. All rights are reserved by Tarun Vuppala.
