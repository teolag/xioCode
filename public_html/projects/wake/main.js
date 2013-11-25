var user;


var header = document.getElementById('header');
var pageContainer = document.getElementById('page');
var loginForm = document.getElementById('loginForm');
var btnLogout = document.getElementById('btnLogout');
var navLinks = document.querySelectorAll(".navLink");


var startup = function() {
	loginForm.addEventListener("submit", login, false);
	btnLogout.addEventListener("click", logout, false);
	window.addEventListener("popstate", historyPop, false);
	
	
	for(var i=0; i<navLinks.length; i++) {
		navLinks[i].addEventListener("click", navLinkClicked, false);
	}
	
	
	checkAccess();

}

var checkAccess = function() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET","ajax/gatekeeper_check_access.php");
	xhr.onload = function(e) {		
		if(xhr.status == 403) {
			showLogin();
		} else if (xhr.status == 202) {
			user = JSON.parse(xhr.responseText);
			console.log("User already logged in:", user);
			loginAccepted();
		}
	}
	xhr.send();
}

var showLogin = function() {
	loginForm.show();
	header.hide();
	pageContainer.hide();
}

var loginAccepted = function() {
	btnLogout.innerHTML = "Logout " + user.name;
	loginForm.hide();
	header.show();
	pageContainer.show();
}

var login = function(e) {
	e.preventDefault();
	var xhr = new XMLHttpRequest();
	xhr.open('POST', "ajax/gatekeeper_login.php", false);
	var formData = new FormData(loginForm);
	xhr.onload = function(e) {		
		if(xhr.status == 202) {
			user = JSON.parse(xhr.responseText);
			console.log("Login acceped", user);
			loginAccepted();
		} else {
			alert("incorrect password");
		}
	}
	xhr.send(formData);
	e.preventDefault();
	return false;
}


var logout = function(e) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', "ajax/gatekeeper_logout.php", false);
	xhr.onload = function(e) {		
		showLogin();
	}
	xhr.send();
	return false;
}

var navLinkClicked = function(e) {
	console.log("navLink clicked", this, e);
	var uri = this.data("uri");
	loadPage(uri);	
	e.preventDefault();
}

var loadPage = function(page) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "ajax/load_page.php?page="+page, false);
	xhr.onload = function(e) {		
		if(xhr.status == 200) {
			pageContainer.innerHTML = xhr.responseText;
			history.pushState(null, "title", page);
		} else {
			alert("error loading page");
		}
	}
	xhr.send();
}

var historyPop = function(e) {
	console.log("history pop", location, e);
}


Element.prototype.data = function(name, value) {
	if(value) {
		this.setAttribute("data-" + name, value);
		return this;
	} else {
		return this.getAttribute("data-" + name);
	}
};
Element.prototype.hide = function() {
	this.classList.add("hidden");
	return this;
};

Element.prototype.show = function() {
	this.classList.remove("hidden");
	return this;
};


startup();