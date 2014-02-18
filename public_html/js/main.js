"use strict";


var DEBUG_MODE_ON=true;
var ACCESS_CHECK_INTERVAL=5*60*1000; //Every 5 minutes
var KEY_ENTER = 13;
var KEY_UP = 38;
var KEY_DOWN = 40;
var UNSAVED_FILENAME = "untitled";

if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function(){};
}



var activeProject;
var activeFile;
var checkAccessInterval;
var pageTitle;
var title;
var hoverTimer;
var fileToBeLoaded;
var oldHash;

var loginBox, loginForm, loginButton;
var username;
var h1, toolbar, userMenu, leftColumn, workspaceDivider;


document.addEventListener("DOMContentLoaded", startup, false);
function startup() {
	init();
	if(_USER && _USER.username) {
		window.dispatchEvent(new CustomEvent("userLogin"));
	} else {
		showLogin();
	}
}


function init() {
	initWriter();

	pageTitle = document.title;
	title = document.getElementById("pageTitle");
	console.log("Init " + pageTitle);

	username = document.getElementById("username");
	loginBox = document.getElementById("login");
	loginForm = document.getElementById("loginForm");
	loginButton = document.getElementById("btnLogin");
	loginForm.addEventListener("submit", loginRequest, false);

	leftColumn = document.getElementById("leftColumn");
	workspaceDivider = document.getElementById("workspaceDivider");
	workspaceDivider.addEventListener("mousedown", startDivideDrag, false);

	window.onresize = fixLayout;
	window.onhashchange = readHash;
	window.onbeforeunload = warnBeforeUnload;
	window.addEventListener("userLogin", loginAccepted, false);

	h1 = document.querySelector("#header h1");
	h1.addEventListener("click", function(){setHash()}, false);

	toolbar = document.getElementById("toolbar");
	toolbar.addEventListener("click", toolbarHandler, false);

	userMenu = document.getElementById("userMenu");
	userMenu.addEventListener("click", userMenuHandler, false);
}


function warnBeforeUnload(e) {
	var n = numberOfUnsavedFiles();
	if(n>0) {
		return "You have "+n+" unsaved files. Are you sure you want to navigate away from this page";
	}
}

function numberOfUnsavedFiles() {
	var counter = 0;
	if(activeProject) {
		for(var uri in xioDocs[activeProject.id]) {
			if(!xioDocs[activeProject.id][uri].isClean()) {
				counter++;
			}
		}
	}
	return counter;
}



function loginRequest(e) {
	e.preventDefault();
	if(!loginForm.elements.code_username.value ||
		!loginForm.elements.code_password.value) {
		return;
	}

	loginButton.disabled=true;
	loginButton.textContent="Authorizing...";

	var xhr = new XMLHttpRequest();
	xhr.open("post", "/scripts/gatekeeper_login.php", true);
	xhr.onload = loginCallback;
	xhr.send(new FormData(loginForm));
}

function loginCallback(e) {
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
	loginForm.reset();
	loginButton.disabled=false;
	loginButton.textContent="Login";
	loginForm.elements.code_username.focus();
}

function loginAccepted(e) {
	console.log("Login accepted", e);
	console.log(_USER);

	document.body.classList.add("authorized");
	username.textContent = _USER.username;

	//Access check every minute
	checkAccessInterval = setInterval(checkAccess, ACCESS_CHECK_INTERVAL);

	ProjectList.loadProjects();
	readHash();
}

function logout() {
	ProjectList.clear();
	FileList.clear();
	openedList.innerHTML="";
	var doc = CodeMirror.Doc("");
	var old = codeMirror.swapDoc(doc);
	activeProject = null;
	activeFile = null;
	xioDocs = {};
	clearInterval(checkAccessInterval);

	var xhr = new XMLHttpRequest();
	xhr.open("get", "/scripts/gatekeeper_logout.php", true);
	xhr.send();

	showLogin();
}

function showLogin() {
	document.body.classList.remove("authorized");
	document.title = pageTitle + " - Login";
	loginForm.elements.code_username.focus();
}


function checkAccess() {
	console.log(new Date().toTimeString().substr(0,5), "Access check");
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/scripts/gatekeeper_check_access.php");
	xhr.onload = function(e) {
		if(xhr.status !== 202) {
			logout();
		}
	};
	xhr.send();
}



/***************** TOOLBAR **********************************************************************/

function toolbarHandler(e) {
	if(e.button!==0) return false;

	var button = e.target;
	if(button.classList.contains("disabled")) return;

	switch(button.id) {

		case "btnNew":
		createNewFile();
		break;

		case "btnSave":
		saveFile();
		break;

		case "btnPreviewFile":
		var path = projectsURL + activeProject.id +"/"+ activeFile;
		console.log("Preview:", projectsURL + activeProject.id +"/"+ activeFile);
		window.open(path, 'code_file_preview');
		break;

		case "btnPreviewProject":
		previewProject(activeProject.id);
		break;


		case "btnProjectConfig":
		ProjectConfig.open(activeProject.id);
		break;

		case "btnExportZip":
			window.location="/scripts/export_zip.php?path=" + activeProject.id + "/";
		break;

		default:
		console.warn("Unknown button clicked");
	}

}



/***************** USER MENU **********************************************************************/

function userMenuHandler(e) {
	if(e.button!==0) return false;

	var target = e.target;
	while(target.nodeName!=="LI") {
		if(target===userMenu) return;
		target = target.parentElement;
	}

	switch(target.id) {
		case "btnLogout":
		logout();
		break;

		case "btnExportAllZip":
		var d = new Date();
		window.location="/scripts/export_zip.php?path=" + "&filename=Projects_"+d.toISOString().substring(0,10)+'.zip';
		break;

		case "btnChangePassword":
		XioPop.prompt("Change password", "Enter your new password", "", function(newPass) {
			if(newPass) {
				var formData = new FormData();
				formData.append("newPass", newPass);
				var xhr = new XMLHttpRequest();
				xhr.open('POST', "/scripts/change_password.php", true);
				xhr.onload = function(e) {
					var xhr = e.target;
					if(xhr.status===200) {
						console.log("Sparat");
						XioPop.close();
					} else {
						console.err("Error changing password", xhr);
					}
				};
				xhr.send(formData);
			}
		});
		break;
	}
}










function fixLayout() {
	var height = document.getElementById("fileList").offsetHeight;
	if(height===0) height=projectArea.offsetHeight - openedList.offsetHeight - 20;
	codeMirror.setSize(null, height-2);
}



function openProject(id) {
	FileList.clear();
	FileList.setProjectId(id);
	redrawOpenedDocs(id);

	activeProject = {'id':id};
	if(ProjectList.getProject(id)) {
		activeProject = ProjectList.getProject(id);
		activeProject.id = id;
		document.title = pageTitle + " - " + activeProject.name;
		title.textContent = activeProject.name;
	}

	document.getElementById("projectChooser").classList.add("hidden");
	document.getElementById("projectArea").classList.remove("hidden");
	fixLayout();
}

function previewProject(id) {
	var url = ProjectList.getProject(id).run_url;
	if(!url) {
		url = projectsURL + id + "/";
	}
	window.open(url, id+'_preview');
}


function openFile(uri) {
	if(!uri) uri="";
	setHash(activeProject.id + "/" + uri);
}


function unloadFile() {
	openFile(UNSAVED_FILENAME);
	codeMirror.focus();
}


function createNewFile() {
	XioPop.prompt("Enter the new filename", "", "", function(newFileName) {
		if(newFileName===false) {
			console.debug("abort file creation");
			return;
		} else if(newFileName.trim()==="") {
			console.debug("not a valid filename");
			XioPop.alert("Invalid filename", "You must enter a valid filename, try again", function() {
				createNewFile();
			});
		} else {
			Ajax.getJSON("/scripts/file_handler.php", {action:"new", project_id:activeProject.id, uri:escape(newFileName)}, fileCreationCallback);
		}
	});
}
function fileCreationCallback(json) {
	if(!json) return false;

	switch(json.status) {
		case STATUS_OK:
		console.log("file saved as ", json.uri);
		FileList.loadProjectFiles();
		openFile(json.uri);
		break;

		case STATUS_FILE_COLLISION:
		XioPop.confirm("File already exists", "Are you sure you want to overwrite "+json.uri+"?", function(answer) {
			if(answer) {
				Ajax.getJSON("/scripts/file_handler.php", {action:"new", project_id:activeProject.id, uri:escape(newFileName), overwrite:true}, fileCreationCallback);
			}
		});
		break;

		default:
		console.warn("handle callback", json);
	}
}


function saveFile() {
	if(activeFile===UNSAVED_FILENAME) {
		console.log("Save As...  ");
		XioPop.prompt("Save file as...", "Enter the filename", "", function(answer) {
			if(answer) {
				saveFileAs(answer);
			}
		});
		return;
	} else if(!activeFile || xioDocs[activeProject.id][activeFile].isClean()) {
		return;
	}

	var formData = new FormData();
	formData.append("uri", activeFile);
	formData.append("project_id", activeProject.id);
	formData.append("code", codeMirror.getValue());
	formData.append("action", "save");

	console.log("Save file '"+ activeFile+"'...");

	FileList.showSpinner(activeFile);
	Ajax.postFormDataWithJsonResponse("/scripts/file_handler.php", formData, saveSuccess, errorCallback);
}


function saveSuccess(json) {
	switch(json.status) {
		case STATUS_OK:
		console.log("file saved as ", json.uri);
		setFileToClean(json.uri);
		break;

		default:
		console.warn("handle callback", json);
	}
	FileList.hideSpinner(activeFile);
}


function saveFileAs(newFileName, overwrite) {

	var formData = new FormData();
	formData.append("uri", newFileName);
	formData.append("project_id", activeProject.id);
	formData.append("code", codeMirror.getValue());
	formData.append("action", "saveAs");
	if(overwrite) formData.append("overwrite", true);

	Ajax.postFormDataWithJsonResponse("/scripts/file_handler.php", formData, saveAsSuccess, errorCallback);	
}

function saveAsSuccess(json) {
	switch(json.status) {
		case STATUS_OK:
		console.log("file saved as ", json.uri);
		FileList.loadProjectFiles();
		openFile(json.uri);
		if(activeFile===UNSAVED_FILENAME) {
			delete xioDocs[activeProject.id][activeFile];
		}
		break;

		case STATUS_FILE_COLLISION:
		XioPop.confirm("File already exists", "Are you sure you want to overwrite "+json.uri+"?", function(answer) {
			if(answer) {
				saveFileAs(newFileName, true);
			}
		});
		break;

		default:
		console.warn("handle callback", json);
	}
}


function renameFile(uri, newUri, overwrite) {
	var parameters = {
		'action':'rename',
		'project_id':activeProject.id,
		'uri':encodeURI(uri),
		'new_uri':encodeURI(newUri)
	};
	if(overwrite===true) parameters['overwrite']=true;
	Ajax.getJSON("/scripts/file_handler.php", parameters, renameCallback, errorCallback);
}

function renameCallback(json) {
		switch(json.status) {
			case STATUS_OK:
			console.log(json.uri, "renamed to", json.newUri);
			FileList.loadProjectFiles();
			if(activeFile===json.uri) {
				openFile(json.newUri);
			}
			if(xioDocs[activeProject.id].hasOwnProperty(json.uri)) {
				xioDocs[activeProject.id][json.newUri] = xioDocs[activeProject.id][json.uri];
				delete xioDocs[activeProject.id][json.uri];
				redrawOpenedDocs(activeProject.id);
			}
			break;

			case STATUS_FILE_COLLISION:
			XioPop.confirm("File already exists", "Are you sure you want to overwrite "+json.newUri+"?", function(answer) {
				if(answer) {
					renameFile(json.uri, json.newUri, true);
				}
			});
			break;

			default:
			console.warn("handle callback", json);
		}
	}


function errorCallback(e) {
	console.error("Error callback", e);
}






function setHash(newHash) {
	if(!newHash) {
		history.pushState({foo: "bar"}, "kokooo", "/");
		readHash();
		oldHash = "";
	} else if(newHash!=oldHash) {
		window.location.hash = newHash;
		oldHash = newHash;
	}
}

function readHash() {
	var hash = window.location.hash;
	if(oldHash===hash) return;

	console.log("Read hash", hash, window.location.hash);
	var match = hash.match(/^#([^\/]*)\/?(.*)$/);
	if(match) {
		var project_id = match[1];
		var uri = match[2];

		console.log("   project_id:", project_id);
		console.log("   uri:", uri);

		if(!activeProject || (activeProject && project_id!=activeProject.id)) {
			console.log("Open project", project_id);
			openProject(project_id);
		}
		if(uri) {
			if(uri!==activeFile) {
				getOrCreateDoc(project_id, uri);
				FileList.setActiveFile(uri);
			}
		} else {
			unloadFile();
		}

	} else {
		console.log("  Show projects page");
		chooseProject();
	}
	oldHash=hash;
}

function chooseProject() {
	document.getElementById("projectChooser").classList.remove("hidden");
	document.getElementById("projectArea").classList.add("hidden");

	title.textContent = "My projects";
	activeProject = null;
	document.title = pageTitle;
	txtProjectFilter.focus();
}





function setFileToClean(uri) {
	console.log(uri, "is now clean");
	var doc = xioDocs[activeProject.id][uri];
	doc.markClean();
	updateCleanStatus(uri);
}

function updateCleanStatus(uri) {
	var tab = openedList.querySelector("li[data-uri='"+uri+"']");
	if(xioDocs[activeProject.id][uri].isClean()) {
		document.getElementById("btnSave").classList.add("disabled");
		FileList.setFileAsClean(uri);
		if(tab) tab.classList.remove("changed");
	} else {
		document.getElementById("btnSave").classList.remove("disabled");
		FileList.setFileAsDirty(uri);
		if(tab) tab.classList.add("changed");
	}
}





function startDivideDrag(e) {
	if(e.button===0) {
		document.addEventListener("mouseup", endDivideDrag, false);
		document.addEventListener("mousemove", divideDrag, false);
		e.preventDefault();
	}
}
function divideDrag(e) {
	var left = e.pageX - leftColumn.offsetLeft*1.5;
	if(left<100){
		left=34;
		projectArea.classList.add("compact");
	} else {
		projectArea.classList.remove("compact");
	}
	fixLayout();
	leftColumn.style.width = left + "px";
}
function endDivideDrag(e) {
	document.removeEventListener("mouseup", endDivideDrag, false);
	document.removeEventListener("mousemove", divideDrag, false);
}











function findFunctions() {
	console.log("Finding functions");

	var text = codeMirror.getValue();

	var doc = codeMirror.getDoc();
	var functions = [];
	var hit;

	// Find functions in the format:   function pelle(arg1, arg2) {
	var re = new RegExp("function\\s+([A-Z0-9_]+)\\s*\\(([^\\)]*)\\)", "gmi");
	while(hit = re.exec(text)) {
		var pos = doc.posFromIndex(hit.index);
		var argus = hit[2].replace(" ","").split(",");
		functions.push({"name":hit[1], "args":argus, "index":hit.index, "line":pos.line, "char":pos.char});
	}

	// Find functions in the format:   pelle = function(arg1, arg2) {
	re = new RegExp("([A-Z0-9_]+)\\s*=\\s*function\\s*\\(([^\\)]*)\\)", "gmi");
	while(hit = re.exec(text)) {
		console.log("func 2", hit);
		var pos = doc.posFromIndex(hit.index);
		var argus = hit[2].replace(" ","").split(",");
		functions.push({"name":hit[1], "args":argus, "index":hit.index, "line":pos.line, "char":pos.char});
	}

	function compare(a,b) {
		if (a.name < b.name) return -1;
		if (a.name > b.name) return 1;
		return 0;
	}

	functions.sort(compare);
	return functions;

}


function toHumanReadableFileSize(bytes, si) {
	var unit = si ? 1000 : 1024;
    if (bytes < unit) return bytes + " bytes";
    var exp = Math.floor(Math.log(bytes) / Math.log(unit));
    var pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");
	var val = bytes/Math.pow(unit, exp);
    return val.toFixed(1) + " " + pre + "B";
}



var clone = (function(){
  return function (obj) { Clone.prototype=obj; return new Clone(); };
  function Clone(){}
}());



