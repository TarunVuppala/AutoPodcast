/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function onLoaded() {
	var csInterface = new CSInterface();

	var env = csInterface.hostEnvironment;
	var appName = csInterface.hostEnvironment.appName;
	var appVersion = csInterface.hostEnvironment.appVersion;
	var APIVersion = csInterface.getCurrentApiVersion();

	var caps = csInterface.getHostCapabilities();

	loadJSX();

	updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);

	// Update the color of the panel when the theme color of the product changed.
	csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, onAppThemeColorChanged);
	// Listen for event sent in response to rendering a sequence.
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

onLoaded();

function dragHandler(event) {
	var csInterface = new CSInterface();
	var extPath = csInterface.getSystemPath(SystemPath.EXTENSION);
	var OSVersion = csInterface.getOSInformation();

	/*
		Note: PPro displays different behavior, depending on where the drag ends (and over which the panel has no control):

		Project panel?	Import into project.
		Sequence?		Import into project, add to sequence.
		Source monitor? Open in source, but do NOT import into project.
	
	*/

	if (extPath !== null) {
		extPath = extPath + "/payloads/test.jpg";
		if (OSVersion.indexOf("Windows") >= 0) {
			var sep = "\\\\";
			extPath = extPath.replace(/\//g, sep);
		}
		event.dataTransfer.setData("com.adobe.cep.dnd.file.0", extPath);
		//	event.dataTransfer.setData("com.adobe.cep.dnd.file.N", path);  N = (items to import - 1)
	}
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

function mySetProxyFunction(data) {
	var csInterface = new CSInterface();
	csInterface.evalScript("$._PPP_.getActiveSequenceName()", myCallBackFunction);
	csInterface.evalScript("$._PPP_.getProjectProxySetting()", myGetProxyFunction);
}

function myVersionInfoFunction(data) {
	var v_string = document.getElementById("version_string");
	v_string.innerHTML = data;
}

/**
 * Update the theme with the AppSkinInfo retrieved from the host product.
 */

function updateThemeWithAppSkinInfo(appSkinInfo) {

	//Update the background color of the panel

	var panelBackgroundColor = appSkinInfo.panelBackgroundColor.color;
	document.body.bgColor = toHex(panelBackgroundColor);

	var styleId = "ppstyle";
	var gradientBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 40) + " , " + toHex(panelBackgroundColor, 10) + ");";
	var gradientDisabledBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 15) + " , " + toHex(panelBackgroundColor, 5) + ");";
	var boxShadow = "-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 1px rgba(0, 0, 0, 0.2);";
	var boxActiveShadow = "-webkit-box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6);";

	var isPanelThemeLight = panelBackgroundColor.red > 50; // choose your own sweet spot
	var fontColor, disabledFontColor, borderColor, inputBackgroundColor, gradientHighlightBg;

	if (isPanelThemeLight) {
		fontColor = "#000000;";
		disabledFontColor = "color:" + toHex(panelBackgroundColor, -70) + ";";
		borderColor = "border-color: " + toHex(panelBackgroundColor, -90) + ";";
		inputBackgroundColor = toHex(panelBackgroundColor, 54) + ";";
		gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -40) + " , " + toHex(panelBackgroundColor, -50) + ");";
	} else {
		fontColor = "#ffffff;";
		disabledFontColor = "color:" + toHex(panelBackgroundColor, 100) + ";";
		borderColor = "border-color: " + toHex(panelBackgroundColor, -45) + ";";
		inputBackgroundColor = toHex(panelBackgroundColor, -20) + ";";
		gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -20) + " , " + toHex(panelBackgroundColor, -30) + ");";
	}

	//Update the default text style with pp values

	addRule(styleId, "button", "font-size:" + (1.2 * appSkinInfo.baseFontSize) + "px;");
	addRule(styleId, "[disabled]", gradientDisabledBg);
	addRule(styleId, "[disabled]", disabledFontColor);
}

function addRule(stylesheetId, selector, rule) {
	var stylesheet = document.getElementById(stylesheetId);
	if (stylesheet) {
		stylesheet = stylesheet.sheet;
		if (stylesheet.addRule) {
			stylesheet.addRule(selector, rule);
		} else if (stylesheet.insertRule) {
			stylesheet.insertRule(selector + " { " + rule + " }", stylesheet.cssRules.length);
		}
	}
}

function reverseColor(color, delta) {
	return toHex({ red: Math.abs(255 - color.red), green: Math.abs(255 - color.green), blue: Math.abs(255 - color.blue) }, delta);
}

/**
 * Convert the Color object to string in hexadecimal format;
 */

function computeValue(value, delta) {
	var computedValue = !isNaN(delta) ? value + delta : value;
	if (computedValue < 0) {
		computedValue = 0;
	} else if (computedValue > 255) {
		computedValue = 255;
	}

	computedValue = Math.round(computedValue).toString(16);
	return computedValue.length == 1 ? "0" + computedValue : computedValue;
}

function toHex(color, delta) {

	var hex = "";
	if (color) {
		hex = computeValue(color.red, delta) + computeValue(color.green, delta) + computeValue(color.blue, delta);
	}
	return "#" + hex;
}

function onAppThemeColorChanged(event) {
	// Should get a latest HostEnvironment object from application.
	var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
	// Gets the style information such as color info from the skinInfo, 
	// and redraw all UI controls of your extension according to the style info.
	updateThemeWithAppSkinInfo(skinInfo);
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

function evalScript(script, callback) {
	new CSInterface().evalScript(script, callback);
}

function onClickButton(ppid) {
	var extScript = "$._ext_" + ppid + ".run()";
	evalScript(extScript);
}

/**
 * Launches the packaged audio‐analysis CLI with *all* camera files,
 * their video+audio track numbers, and the three global params.
 *
 * @param {Array<string|number>} cliArgs
 *   An array of the form:
 *     [
 *       file1Path,  videoTrack1,  audioTrack1,
 *       file2Path,  videoTrack2,  audioTrack2,
 *       …,
 *       silenceThreshold,  minSilenceDuration,  mergeFactor
 *     ]
 * @returns {Promise<string>}  resolves with the raw JSON stdout
 */
async function runAudioAnalysis(cliArgs) {
	return new Promise((resolve, reject) => {
		const cs = new CSInterface();
		const extDir = cs.getSystemPath(SystemPath.EXTENSION);
		const isWin = cs.getOSInformation().includes("Windows");
		const sep = isWin ? "\\" : "/";

		if (!Array.isArray(cliArgs) || cliArgs.length < 4) {
			return reject("runAudioAnalysis requires at least one file+tracks and the 3 params");
		}

		const safeArgs = cliArgs.map(arg => {
			const s = String(arg);
			return isWin ? s.replace(/\\/g, "\\\\") : s;
		});

		// pick the binary
		const exeName = isWin ? "audioTool-win.exe" : "audioTool-mac";
		let exePath = extDir + sep + "audioAnalysis" + sep + exeName;
		if (isWin) exePath = exePath.replace(/\\/g, "\\\\");

		// start the process
		const startRes = window.cep.process.createProcess(exePath, ...safeArgs);
		if (startRes.err !== 0) {
			return reject(`Error starting analysis process: ${startRes.err}`);
		}
		const pid = startRes.data;

		// poll until it exits
		const poll = setInterval(() => {
			const stat = window.cep.process.isRunning(pid);
			if (stat.err !== 0) {
				clearInterval(poll);
				return reject(`Error polling process: ${stat.err}`);
			}
			if (!stat.data) {
				clearInterval(poll);
				// read its stderr
				// window.cep.process.stderr(pid, stdout => {
				// 	if (!stdout) {
				// 		return reject("No output from analysis tool");
				// 	}
				// 	document.getElementById("out").textContent = stdout;
				// 	resolve(stdout);
				// });
				window.cep.process.stdout(pid, stdout => {
					if (!stdout) {
						return reject("No output from analysis tool");
					}
					// document.getElementById("out").textContent = stdout;
					resolve(stdout);
				});
			}
		}, 300);
	});
}
