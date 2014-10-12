var GateKeeper = (function() {

	var
	ACCESS_CHECK_INTERVAL=5*60*1000, //Every 5 minutes

	user,

	loginBox, frmLogin, btnLogin, txtUsername, txtPassword, username,
	checkAccessInterval, onLoginCallback, onLogoutCallback,




	init = function(callbackLogin, callbackLogout) {
		onLoginCallback = callbackLogin;
		onLogoutCallback = callbackLogout;

		loginBox = document.getElementById("login");

		frmLogin = document.getElementById("loginForm");
		frmLogin.addEventListener("submit", loginRequest, false);

		btnLogin = document.getElementById("btnLogin");
		txtUsername = frmLogin.elements.code_username;
		txtPassword = frmLogin.elements.code_password;
	},

	loginRequest = function(e) {
		e.preventDefault();
		if(!txtUsername.value || !txtPassword.value) {
			return;
		}

		btnLogin.disabled=true;
		btnLogin.textContent="Authorizing...";

		Ajax.post2JSON("/scripts/gatekeeper.php?action=login", frmLogin, loginCallback);
	},

	loginCallback = function(response) {
		if(response.status===STATUS_OK) {
			user = response.user;
			loginAccepted();
		}
		else {
			console.warn("Incorrect login or password");
			loginBox.className="";
			setTimeout(function(){
				loginBox.classList.add("shake");
			},1);
		}
		frmLogin.reset();
		btnLogin.disabled=false;
		btnLogin.textContent="Login";
		txtUsername.focus();
	},

	loginAccepted = function() {
		console.log("Welcome", user.username);

		//Access check every minute
		checkAccessInterval = setInterval(checkAccess, ACCESS_CHECK_INTERVAL);

		if(onLoginCallback) onLoginCallback(user);
	},

	logout = function() {
		Ajax.post("/scripts/gatekeeper.php?action=logout");
		clearInterval(checkAccessInterval);

		if(onLogoutCallback) onLogoutCallback();

		showLogin();
	},

	showLogin = function() {
		document.body.classList.remove("authorized");
		document.title = pageTitle + " - Login";
		frmLogin.reset();
		btnLogin.disabled=false;
		btnLogin.textContent="Login";
		txtUsername.focus();
	},


	checkAccess = function() {
		console.log(new Date().toTimeString().substr(0,5), "Access check");
		Ajax.getJSON("/scripts/gatekeeper.php", {action: "check", user_id: user.user_id}, function(json) {
			if(json.status !== STATUS_OK) {
				console.warn(json.message);
				logout();
			}
		});
	},

	setUser = function(u) {
		user = u;
		loginAccepted();
	};



	return {
		init: init,
		showLogin: showLogin,
		logout: logout,
		setUser: setUser
	}
}());
