var GateKeeper = (function() {
	
	var 
	ACCESS_CHECK_INTERVAL=5*60*1000, //Every 5 minutes

	
	loginBox, frmLogin, btnLogin, txtUsername, txtPassword, username,
	checkAccessInterval, loginCallback, logoutCallback,

	
	
	
	init = function(callbackLogin, callbackLogout) {
		loginCallback = callbackLogin;
		logoutCallback = callbackLogout;
	
		loginBox = document.getElementById("login");
		
		frmLogin = document.getElementById("loginForm");
		frmLogin.addEventListener("submit", loginRequest, false);
		
		btnLogin = document.getElementById("btnLogin");
		txtUsername = frmLogin.elements.code_username;
		txtPassword = frmLogin.elements.code_password;
		
		window.addEventListener("userLogin", loginAccepted, false);
		
	},
	
	loginRequest = function(e) {
		e.preventDefault();
		if(!txtUsername.value || !txtPassword.value) {
			return;
		}

		btnLogin.disabled=true;
		btnLogin.textContent="Authorizing...";

		var xhr = new XMLHttpRequest();
		xhr.open("post", "/scripts/gatekeeper_login.php", true);
		xhr.onload = loginCallback;
		xhr.send(new FormData(frmLogin));
	},

	loginCallback = function(e) {
		var user = JSON.parse(e.target.responseText);
		if(e.target.status===200 && user && user.username) {
			_USER = user;
			var userLogin = new CustomEvent("userLogin");
			window.dispatchEvent(userLogin);
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

	loginAccepted = function(e) {
		console.log("Login accepted", e);
		console.log(_USER);
		
		//Access check every minute
		checkAccessInterval = setInterval(checkAccess, ACCESS_CHECK_INTERVAL);
		
		if(loginCallback) loginCallback(_USER);
	},

	logout = function() {
		Ajax.post("/scripts/gatekeeper_logout.php");
		clearInterval(checkAccessInterval);
		
		if(logoutCallback) logoutCallback();
		
		showLogin();
	},

	showLogin = function() {
		document.body.classList.remove("authorized");
		document.title = pageTitle + " - Login";
		txtUsername.focus();
	},


	checkAccess = function() {
		console.log(new Date().toTimeString().substr(0,5), "Access check");
		Ajax.getJSON("/scripts/gatekeeper_check_access.php", {user_id: _USER.user_id}, function(json) {
			if(json.status !== STATUS_OK) {
				console.warn(json.message);
				logout();
			}
		});
	}
	
	
	
	return {
		init: init,
		showLogin: showLogin,
		logout: logout
	}	
}());
