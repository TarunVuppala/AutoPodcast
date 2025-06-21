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
		app.setExtensionPersistent("com.unity.timbre.multi_camera_editor.dev", 0); // 0, while testing (to enable rapid reload); 1 for "Never unload me, even when not visible."
	},

	disableImportWorkspaceWithProjects: function () {
		var prefToModify = 'FE.Prefs.ImportWorkspace';
		app.properties.setProperty(prefToModify, "0", 1, false);
	},

	closeLog: function () {
		app.enableQE();
		qe.executeConsoleCommand("con.closelog");
	},

	confirmPProHostVersion: function () {
		var version = parseFloat(app.version);
		return version;
	},

	setLocale: function (localeFromCEP) {
		$.locale = localeFromCEP;
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

			var root = app.project.rootItem;
			var seqBin = root.createBin(seq.name);

			$._PPP_.createClone();
			seq = app.project.activeSequence;


			var usedV = {}, usedA = {}, projItems = {};
			for (var i = 0; i < tl.length; i++) {
				var e = tl[i];
				usedV[e.v] = true;
				usedA[e.a] = true;
			}

			for (var vt in usedV) {
				var track = seq.videoTracks[Number(vt) - 1];
				if (track.clips.numItems > 0) {
					projItems[vt] = track.clips[0].projectItem;
				} else {
					$._PPP_.updateEventPanel(
						"Warning: video track " + vt + " has no source clip!"
					);
				}
			}

			for (vt in usedV) {
				var vTrack = seq.videoTracks[Number(vt) - 1];
				while (vTrack.clips.numItems) {
					vTrack.clips[0].remove(true, true);
				}
			}
			for (var at in usedA) {
				var aTrack = seq.audioTracks[Number(at) - 1];
				while (aTrack.clips.numItems) {
					aTrack.clips[0].remove(true, true);
				}
			}

			for (var idx = 0; idx < tl.length; idx++) {
				var e = tl[idx];
				var projItem = projItems[e.v];
				if (!projItem) {
					continue;
				}

				var inTime = new Time(); inTime.seconds = e.s;
				var outTime = new Time(); outTime.seconds = e.e;
				var name =
					e.t + "_" + (idx + 1) + "_" +
					e.s.toFixed(2) + "-" +
					e.e.toFixed(2);

				var subItem = projItem.createSubClip(name, inTime, outTime, 1);
				subItem.moveBin(seqBin);
				seq.insertClip(subItem, inTime, e.v - 1, e.a - 1);
			}

			app.project.save();
			$._PPP_.updateEventPanel(
				"Timeline processing complete: " + tl.length + " entries applied"
			);
		}
		catch (err) {
			$._PPP_.updateEventPanel("Error in processTimeline: " + err.toString());
			throw err;
		}
	},

	forceLogfilesOn: function () {
		app.enableQE();
		var previousLogFilesValue = qe.getDebugDatabaseEntry("CreateLogFilesThatDoNotExist");

		if (previousLogFilesValue !== 'true') {
			qe.setDebugDatabaseEntry("CreateLogFilesThatDoNotExist", "true");
		}
	},
}