var GateKeeper = (function() {

	var
	ACCESS_CHECK_INTERVAL=5*60*1000, //Every 5 minutes

	user,

	loginBox, frmLogin, btnLogin, txtUsername, txtPassword, username,
	checkAccessInterval, onLoginCallback, onLogoutCallback,

	btnGoogleLogin,

	init = function(callbackLogin, callbackLogout) {
		onLoginCallback = callbackLogin;
		onLogoutCallback = callbackLogout;

		loginBox = document.getElementById("login");

		frmLogin = document.getElementById("loginForm");
		frmLogin.addEventListener("submit", loginRequest, false);

		btnLogin = document.getElementById("btnLogin");
		txtUsername = frmLogin.elements.code_username;
		txtPassword = frmLogin.elements.code_password;

		btnGoogleLogin = document.getElementById("btnGoogleLogin");
		btnGoogleLogin.addEventListener("click", loginUsingGoogle, false);
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
		user = null;
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
		var userId = user ? user.user_id : 0
		Ajax.getJSON("/scripts/gatekeeper.php", {action: "check", user_id: userId}, function(json) {
			if(json.status !== STATUS_OK) {
				if(user) {
					console.warn(json.message);
					console.debug("Force logout");
					logout();
				}
			} else {
				if(!user) {
					setUser(json.user);
				}
			}
		});
	},

	setUser = function(u) {
		user = u;
		loginAccepted();
	},


	loginUsingGoogle = function(e) {
		var url = e.target.dataset.url,
			title = "Google login",
			w = 500,
			h = 600,
			left = (screen.width/2)-(w/2),
  			top = (screen.height/2)-(h/2),
			options = 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left;
  		window.open(url, title, options);
	},

	googleLoginCallback = function(data) {
		setUser(data.user);
	};


	return {
		init: init,
		showLogin: showLogin,
		logout: logout,
		setUser: setUser,
		checkAccess: checkAccess,
		googleLoginCallback: googleLoginCallback
	}
}());
