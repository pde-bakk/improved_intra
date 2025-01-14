/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   auth.js                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: fbes <fbes@student.codam.nl>                 +#+                     */
/*                                                   +#+                      */
/*   Created: 2021/11/28 20:22:10 by fbes          #+#    #+#                 */
/*   Updated: 2022/03/28 17:14:03 by fbes          ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

const optionsURL = "https://iintra.freekb.es/options.php";

let authPort = chrome.runtime.connect({ name: portName });
authPort.onDisconnect.addListener(function() {
	iConsole.log("Disconnected from service worker");
});
authPort.onMessage.addListener(function(msg) {
	switch (msg["action"]) {
		case "pong":
			iConsole.log("pong");
			break;
		case "resynced":
			iConsole.log("Options resynced.");
			window.location.replace(optionsURL);
			break;
		case "error":
			iConsole.error(msg["message"]);
			break;
	}
});
setInterval(function() {
	authPort.disconnect();
	authPort = chrome.runtime.connect({ name: portName });
}, 250000);

const authResElem = document.getElementById("result");
if (authResElem) {
	try {
		const authRes = JSON.parse(authResElem.innerText);
		if (!("error" in authRes["auth"])) {
			const action = document.getElementById("action");
			if (action) {
				action.innerText = "Please wait while we redirect you to the Improved Intra 42 options page...";
			}

			const redirLink = document.getElementById("redir_link");
			if (redirLink) {
				redirLink.setAttribute("href", optionsURL);
			}

			// display clickable link in case redirection does not happen
			// after 2 seconds
			setTimeout(function() {
				const clicker = document.getElementById("clicker");
				if (clicker) {
					clicker.style.display = "block";
				}
			}, 2000);

			improvedStorage.set(authRes).then(function() {
				improvedStorage.set({"username": authRes["user"]["login"]}).then(function() {
					iConsole.log("Authentication details saved in local storage!");
					authPort.postMessage({ action: "resync" });
				});
			});
		}
		else {
			iConsole.error("Error " + authRes["auth"]["error"] + ":", authRes["auth"]["error_description"]);
		}
	}
	catch (err) {
		iConsole.error(err);
		alert("Unable to retrieve authentication details. Could not authorize in extension's scope. See the Javascript console for details.");
	}
}
