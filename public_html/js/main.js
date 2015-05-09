"use strict";

var DEBUG_MODE_ON=true;
var KEY_ENTER = 13;
var KEY_UP = 38;
var KEY_DOWN = 40;

if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function(){};
}

var activeProject;
var pageTitle;
var title;
var hoverTimer;
var fileToBeLoaded;
var oldHash;

var username;
var h1, fileToolbar, projectToolbar, userMenu;


document.addEventListener("DOMContentLoaded", function(e) {

	XI.fire("DOMContentLoaded");

	console.log("CodeMirror" , CodeMirror.version, "loaded");


	GateKeeper.init(loginCallback, logoutCallback);
	Preview.init();

	pageTitle = document.title;
	title = document.getElementById("pageTitle");
	console.log("Init " + pageTitle);

	window.addEventListener("resize", fixLayout, false);
	window.addEventListener("hashchange", readHash, false);
	window.addEventListener("beforeunload", warnBeforeUnload);

	document.addEventListener("visibilitychange", function(e) {
		var date = new Date(e.timeStamp);
		console.debug(document.hidden ? "borta!" : "tillbaka!", date.toTimeString().substr(0,8));
	}, false);


	h1 = document.querySelector("#header h1");
	h1.addEventListener("click", function(){setHash()}, false);

	projectToolbar = document.querySelector("#projectToolbar");
	projectToolbar.addEventListener("click", projectToolbarHandler, false);

	fileToolbar = document.querySelector("#fileBrowser .toolbar");
	fileToolbar.addEventListener("click", fileToolbarHandler, false);

	userMenu = document.getElementById("userMenu");
	userMenu.addEventListener("click", userMenuHandler, false);
	username = document.getElementById("username");

	var dividers = document.querySelectorAll(".divider");
	for(var i=0; i<dividers.length; i++) {
		dividers[i].addEventListener("mousedown", startDivide, false);
	}


	if(_USER && _USER.username) {
		GateKeeper.setUser(_USER);
	} else {
		GateKeeper.showLogin();
	}
}, false);



function startDivide(e) {
	console.log("divider down");
	e.preventDefault();

	var subjectId = e.target.dataset.subject;
	var subject = document.getElementById(subjectId);
	if(!subject) return;

	document.addEventListener("mousemove", mouseMove);
	document.addEventListener("mouseup", mouseUp);
	var pos = e.target.dataset.subject_pos;

	function mouseMove(e) {
		var dx = (pos==="right")? -e.movementX : e.movementX;
		subject.style.width = (subject.offsetWidth+dx) + "px";
		console.log("move", subject, e);
	}

	function mouseUp() {
		document.removeEventListener("mousemove", mouseMove);
		document.removeEventListener("mouseup", mouseUp);
	}

}



function loginCallback(user) {
	document.body.classList.add("authorized");
	username.textContent = user.username;

    ProjectList.setOrderBy(user.projects_order_by, user.projects_order_dir);
	ProjectList.loadProjects();
	readHash();
}


function logoutCallback() {
	ProjectList.clear();
	FileList.clear();
	Todo.clear();

	for(var i=0; i<XioCode.getPanes().length; i++) {
		var pane = XioCode.getPanes()[i];
		if(pane.type === 10) {
			pane.codeEditor.clear()
		}
	}

	activeProject = null;
	activeFile = null;
	oldHash = null;
	xioDocs = {};
}


function warnBeforeUnload(e) {
	var n = File.countDirtyFiles();
	console.log("dirty check", n);
	if(n>0) {
		var text = "You have "+n+" unsaved files. Are you sure you want to navigate away from this page";
		e.returnValue = text;
		return text;
	}
}



/***************** TOOLBAR **********************************************************************/

function projectToolbarHandler(e) {
	if(e.button!==0) return;
	if(projectToolbar.classList.contains("disabled")) return;
	if(!activeProject) return;

	var button = e.target;
	switch(button.dataset.action) {

		case "run":
		previewProject(activeProject.id);
		break;

		case "config":
		ProjectConfig.open(activeProject.id);
		break;

		case "export":
			window.location="/scripts/export_zip.php?path=" + activeProject.id + "/";
		break;

		default:
		console.warn("Unknown button clicked");
	}

}


function fileToolbarHandler(e) {
	if(e.button!==0) return false;

	var button = e.target;
	if(button.classList.contains("disabled")) return;

	switch(button.dataset.action) {

		case "new":
		XioCode.getActiveCodeEditor().newFile();
		break;

		case "reload":
		FileList.loadProjectFiles();
		break;

		default:
		console.warn("Unknown button clicked");
	}
}



/***************** USER MENU **********************************************************************/

function userMenuHandler(e) {
	console.log("click", e);
	if(e.button!==0) return false;

	var target = e.target;
	while(target.nodeName!=="LI") {
		if(target===userMenu) return;
		target = target.parentElement;
	}

	switch(target.dataset.action) {
		case "logout":
		GateKeeper.logout();
		break;

		case "exportAllZip":
		var d = new Date();
		window.location="/scripts/export_zip.php?path=" + "&filename=Projects_"+d.toISOString().substring(0,10)+'.zip';
		break;

		case "changePassword":
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
	for(var i=0; i<XioCode.getPanes().length; i++) {
		var pane = XioCode.getPanes()[i];
		if(pane.type === 10) {
			var height = pane.codeEditor.elem.offsetHeight - 25;
			pane.codeEditor.editor.setSize(null, height);
		}
	}
	Preview.fixLayout();
}


function openProject(id) {
	console.log("Open project", id);

	FileList.clear();
	FileList.setProjectId(id);
	ProjectList.updateLastOpened(id);
	Todo.loadAll(id);

	activeProject = {'id':id};
	XioCode.openProject(id);

	//set active project if project is loaded
	if(ProjectList.getProject(id)) {
		activeProject = ProjectList.getProject(id);
		activeProject.id = id;
		document.title = pageTitle + " - " + activeProject.name;
		title.textContent = activeProject.name;
	}

	for(var i=0; i<XioCode.getPanes().length; i++) {
		var pane = XioCode.getPanes()[i];
		if(pane.type === 10) {
			pane.codeEditor.setProjectId(id);
		}
	}

	projectToolbar.classList.remove("disabled");

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


function createNewFile(path) {
	if(!path) path="";
	XioPop.prompt("Enter the new filename", "", path, function(newFileName) {
		if(newFileName===false) {
			console.debug("abort file creation");
			return;
		} else if(newFileName.trim()==="") {
			console.debug("not a valid filename");
			XioPop.alert("Invalid filename", "You must enter a valid filename, try again", function() {
				createNewFile();
			});
		} else {
			Ajax.post2JSON("/scripts/file_handler.php", {action:"new", project_id:activeProject.id, uri:newFileName}, fileCreationCallback);
		}
	});
}

function fileCreationCallback(json) {
	if(!json) return false;

	switch(json.status) {
		case STATUS_OK:
		console.log("file saved as ", json.uri);
		FileList.loadProjectFiles();
		XioCode.getActiveCodeEditor().openFile(json.uri);
		break;

		case STATUS_FILE_COLLISION:
		XioPop.confirm("File already exists", "Are you sure you want to overwrite "+json.uri+"?", function(answer) {
			if(answer) {
				Ajax.post2JSON("/scripts/file_handler.php", {action:"new", project_id:activeProject.id, uri:newFileName, overwrite:true}, fileCreationCallback);
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
		'uri':uri,
		'new_uri':newUri
	};
	if(overwrite===true) parameters['overwrite']=true;
	Ajax.post2JSON("/scripts/file_handler.php", parameters, renameCallback);
}

function renameCallback(json) {
	switch(json.status) {
		case STATUS_OK:

		console.log("File '%s' renamed to '%s'", json.uri, json.newUri);
		FileList.loadProjectFiles();

		var openedFile = File.getFileByUri(activeProject.id, json.uri);
		if(openedFile) {
			openedFile.rename(json.newUri);
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

function previewFile(uri) {
	var path = projectsURL + activeProject.id +"/"+ uri;
	console.log("Preview:", path);

	if(Preview.isVisible()) {
		Preview.load(path);
	} else {
		window.open(path, 'code_file_preview');
	}
}


function errorCallback(e) {
	if(e.status === 401) {
		console.warn("You have to login again...");
		// TODO: relogin without loosing data
	} else {
		console.error("Error callback", e);
	}
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

	//console.log("Read hash", hash, window.location.hash);
	var match = hash.match(/^#([^\/]*)$/);
	if(match) {
		var projectId = match[1];

		if(!activeProject || (activeProject && projectId!=activeProject.id)) {
			openProject(projectId);
		}

	} else {
		console.log("Show projects page");
		chooseProject();
	}
	oldHash=hash;
}


function chooseProject() {
	projectToolbar.classList.add("disabled");
	document.getElementById("projectChooser").classList.remove("hidden");
	document.getElementById("projectArea").classList.add("hidden");

	title.textContent = "My projects";
	activeProject = null;
	document.title = pageTitle;
	txtProjectFilter.focus();
}


function getMimeByUri(uri) {
	var extension = /\.([^.]+)$/.exec(uri);
	if(!extension) return "";
	var info = CodeMirror.findModeByExtension(extension[1]);
	if(!info) {
		switch(extension[1]) {
			case "svg": return "xml";
		}
	}
	return info? info.mode : "";
}


function findFunctions() {
	console.log("Finding functions");

	var text = XioCode.getActiveCodeEditor().editor.getValue();

	var doc = XioCode.getActiveCodeEditor().editor.getDoc();
	var functions = [];
	var hit;

	// Find functions in the format:   function pelle(arg1, arg2) {
	var re = new RegExp("function\\s+([A-Z0-9_]+)\\s*\\(([^\\)]*)\\)", "gmi");
	while(hit = re.exec(text)) {
		var pos = doc.posFromIndex(hit.index);
		var argus = hit[2].replace(" ","").split(",");
		functions.push({text:hit[1], name:hit[1], args:argus, index:hit.index, line:pos.line, char:pos.char});
	}

	// Find functions in the format:   pelle = function(arg1, arg2) {   or   pelle: function(arg1, arg2)
	re = new RegExp("([A-Z0-9_\.]+)\\s*[=:]\\s*function\\s*\\(([^\\)]*)\\)", "gmi");
	while(hit = re.exec(text)) {
		var pos = doc.posFromIndex(hit.index);
		var argus = hit[2].replace(" ","").split(",");
        functions.push({text:hit[1], name:hit[1], args:argus, index:hit.index, line:pos.line, char:pos.char});
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


function toHumanReadableDateTime(ts) {
	if(!ts) return "";
	var ts = new Date(ts);
	var now = new Date();
	var time = ts.toTimeString().substr(0,5);
	var date = ts.toISOString().substr(0,10);

	var diff = ts - now;
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	if(diff<24*60*60*1000 && now.getDate()===ts.getDate()) {
		return "Today " + time;
	} else if(diff<2*24*60*60*1000 && yesterday.getDate()===ts.getDate()) {
		return "Yesterday " + time;
	}
	return date + " " + time;
}


function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
