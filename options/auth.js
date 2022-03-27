/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   auth.js                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: fbes <fbes@student.codam.nl>                 +#+                     */
/*                                                   +#+                      */
/*   Created: 2021/11/28 20:22:10 by fbes          #+#    #+#                 */
/*   Updated: 2022/03/07 04:14:21 by fbes          ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

let authPort = chrome.runtime.connect({ name: portName });
authPort.onDisconnect.addListener(function() {
	console.log("%c[Improved Intra]%c Disconnected from service worker", "color: #00babc;", "");
});
authPort.onMessage.addListener(function(msg) {
	switch (msg["action"]) {
		case "pong":
			console.log("pong");
			break;
		case "resynced":
			console.log("Options resynced.");
			window.location.replace(optionsURL);
			break;
		case "error":
			console.error(msg["message"]);
			break;
	}
});
setInterval(function() {
	authPort.disconnect();
	authPort = chrome.runtime.connect({ name: portName });
}, 250000);

var authResElem = document.getElementById("result");
if (authResElem) {
	try {
		var authRes = JSON.parse(authResElem.innerText);
		if (!("error" in authRes["auth"])) {
			var optionsURL = "https://darkintra.freekb.es/options.php";
			var action = document.getElementById("action");
			if (action) {
				action.innerText = "Please wait while we redirect you to the Improved Intra 42 options page...";
			}

			var redirLink = document.getElementById("redir_link");
			if (redirLink) {
				redirLink.setAttribute("href", optionsURL);
			}

			// display clickable link in case redirection does not happen
			// after 2 seconds
			setTimeout(function() {
				var clicker = document.getElementById("clicker");
				if (clicker) {
					clicker.style.display = "block";
				}
			}, 2000);

			improvedStorage.set(authRes).then(function() {
				improvedStorage.set({"username": authRes["user"]["login"]}).then(function() {
					console.log("%c[Improved Intra]%c Authentication details saved in local storage!", "color: #00babc;", "");
					authPort.postMessage({ action: "resync" });
				});
			});
		}
		else {
			console.error("Error " + authRes["auth"]["error"] + ":", authRes["auth"]["error_description"]);
		}
	}
	catch (err) {
		console.error(err);
		alert("Unable to retrieve authentication details. Could not authorize in extension's scope. See the Javascript console for details.");
	}
}
