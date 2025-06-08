$._PPP_ = {
	updateEventPanel: function (message, type) {
		app.setSDKEventMessage(message, type || "info");
	},
	getStableFingerprint: function () {
		if (typeof system === "undefined") {
			try { system = new ExternalObject("shell"); }
			catch (_) { return $.getenv("COMPUTERNAME") || $.getenv("HOSTNAME") || "unknown"; }
		}

		var host = $.getenv("COMPUTERNAME") || $.getenv("HOSTNAME") || "unknown",
			id = host;

		try {
			if ($.os.indexOf("Windows") === 0) {
				id = system.callSystem(
					'reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid'
				).split(/\\s+/).pop();
			} else {
				id = system.callSystem(
					"ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/{print $3}'"
				).replace(/\"/g, '').trim();
			}
		} catch (_) {
			id = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
				return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
			});
		}
		return host + "|" + id;
	},

	keepPanelLoaded: function () {
		//add name here
		app.setExtensionPersistent("com.adobe.PProPanel", 0); // 0, while testing (to enable rapid reload); 1 for "Never unload me, even when not visible."
	},

	disableImportWorkspaceWithProjects: function () {
		var prefToModify = 'FE.Prefs.ImportWorkspace';
		var propertyExists = app.properties.doesPropertyExist(prefToModify);
		var propertyIsReadOnly = app.properties.isPropertyReadOnly(prefToModify);
		var propertyValue = app.properties.getProperty(prefToModify);

		app.properties.setProperty(prefToModify, "0", 1, false);
		var safetyCheck = app.properties.getProperty(prefToModify);
		if (safetyCheck != propertyValue) {
			$._PPP_.updateEventPanel("Changed \'Import Workspaces with Projects\' from " + propertyValue + " to " + safetyCheck + ".");
		}
	},

	closeLog: function () {
		app.enableQE();
		qe.executeConsoleCommand("con.closelog");
	},

	confirmPProHostVersion: function () {
		var version = parseFloat(app.version);
		if (version < 14.0) {
			$._PPP_.updateEventPanel("Note: PProPanel relies on features added in 14.0, but is currently running in " + version + ".");
		}
		return version;
	},
	setLocale: function (localeFromCEP) {
		$.locale = localeFromCEP;
		$._PPP_.updateEventPanel("ExtendScript Locale set to " + localeFromCEP + ".");
	},
	getAudioTrackClipItemsPath: function () {
		try {
			var seq = app.project.activeSequence;
			if (!seq) {
				throw "No active sequence";
			}

			var audioTracks = seq.audioTracks;
			var clipPaths = [];

			for (var i = 0; i < audioTracks.numTracks; i++) {
				var clips = audioTracks[i].clips;

				if (clips.numItems > 1) {
					clipPaths.push("Error: Multiple clips " + (i + 1));
				}
				else if (clips.numItems === 0) {
					clipPaths.push("");
				}
				else {
					clipPaths.push(clips[0].projectItem.getMediaPath());
				}
			}

			return clipPaths;
		}
		catch (e) {
			$._PPP_.updateEventPanel(e.toString());
			return [];
		}
	},

	getVideoTracks: function () {
		try {
			var seq = app.project.activeSequence;
			if (!seq) {
				throw "No active sequence";
			}
			var videoTracks = seq.videoTracks;
			var videoTrackItems = [];

			for (var i = 0; i < videoTracks.numTracks; i++) {
				var clips = videoTracks[i].clips;
				if (clips.numItems > 1) {
					videoTrackItems.push("Error: Multiple clips " + (i + 1));
				}
				else if (clips.numItems === 0) {
					videoTrackItems.push("");
				}
				else {
					videoTrackItems.push(clips[0].projectItem.getMediaPath());
				}
			}

			return videoTrackItems;
		} catch (e) {
			$._PPP_.updateEventPanel(e.toString());
			return [];
		}
	},

	createClone: function () {
		var seq = app.project.activeSequence;
		seq.clone();
	},

	processTimeline: function (tl) {
		try {
			if (!tl || tl.length === 0) {
				throw new Error("No timeline provided.");
			}
			$._PPP_.updateEventPanel("Starting timeline processing...");
			var seq = app.project.activeSequence;
			if (!seq) {
				$._PPP_.updateEventPanel("No active sequence!");
				return;
			}

			var usedV = {}, usedA = {}, projItems = {};
			for (var i = 0; i < tl.length; i++) {
				var e = tl[i];
				usedV[e.videoTrack] = true;
				usedA[e.audioTrack] = true;
			}
			for (var vt in usedV) {
				var track = seq.videoTracks[Number(vt) - 1];
				if (track.clips.numItems > 0) {
					projItems[vt] = track.clips[0].projectItem;
				} else {
					$._PPP_.updateEventPanel("Warning: video track " + vt + " has no source clip!");
				}
			}

			for (var vt in usedV) {
				var track = seq.videoTracks[Number(vt) - 1];
				while (track.clips.numItems) {
					track.clips[0].remove(true, true);
				}
			}
			for (var at in usedA) {
				var track = seq.audioTracks[Number(at) - 1];
				while (track.clips.numItems) {
					track.clips[0].remove(true, true);
				}
			}
			// $._PPP_.saveProject();

			for (var idx = 0; idx < tl.length; idx++) {
				var e = tl[idx];
				var vTrack = seq.videoTracks[e.videoTrack - 1];
				var aTrack = seq.audioTracks[e.audioTrack - 1];
				var projItem = projItems[e.videoTrack];
				if (!projItem) {
					$._PPP_.updateEventPanel("Skipping entry " + idx + ": no source item for track " + e.videoTrack);
					continue;
				}

				var inTime = new Time(); inTime.seconds = e.start;
				var outTime = new Time(); outTime.seconds = e.end;
				var name = e.type + "_" + (idx + 1)
					+ "_" + e.start.toFixed(2)
					+ "-" + e.end.toFixed(2);

				var subItem = projItem.createSubClip(name, inTime, outTime, 1);

				seq.insertClip(subItem, inTime, e.videoTrack - 1, e.audioTrack - 1);

				var clip = vTrack.clips[vTrack.clips.numItems - 1];

				// if (e.type === "fadeOut") {
				// 	clip.addVideoTransition("Cross Dissolve", FADE_DURATION);
				// 	clip.addAudioTransition("Constant Power", FADE_DURATION);
				// }
				// else if (e.type === "fadeIn") {
				// 	clip.addVideoTransition("Cross Dissolve", FADE_DURATION);
				// 	clip.addAudioTransition("Constant Power", FADE_DURATION);
				// }
				// type==="keep": no transition

				$._PPP_.updateEventPanel(
					"Inserted " + name + " (" + e.type + ") at " + e.start.toFixed(2) + "s"
				);
			}

			$._PPP_.saveProject();
			$._PPP_.updateEventPanel("Timeline processing complete: " + tl.length + " entries applied");
		}
		catch (err) {
			$._PPP_.updateEventPanel("Error in processTimeline: " + err.toString());
		}
	},
	
	forceLogfilesOn: function () {
		app.enableQE();
		var previousLogFilesValue = qe.getDebugDatabaseEntry("CreateLogFilesThatDoNotExist");

		if (previousLogFilesValue === 'true') {
			$._PPP_.updateEventPanel("Force create Log files was already ON.");
		} else {
			qe.setDebugDatabaseEntry("CreateLogFilesThatDoNotExist", "true");
			$._PPP_.updateEventPanel("Set Force create Log files to ON.");
		}
	},
}