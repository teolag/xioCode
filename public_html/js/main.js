"use strict";

var codeMirror;
var fileListWidth = 220;

var DEBUG_MODE_ON=true;
var ACCESS_CHECK_INTERVAL=5*60*1000; //Every 5 minutes

var KEY_ENTER = 13;

var projects = [];
//var files;

var activeProject;
var activeFile;
var checkAccessInterval;
var pageTitle;
var hoverTimer;
var fileToBeLoaded;
var localStore = window.localStorage;
var openedFolders = [];


var oldHash=window.location.hash;



if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function(){};
}

var projectsFilter = document.getElementById('projectsFilter');
projectsFilter.addEventListener("search", filterProjects);
projectsFilter.addEventListener("keyup", filterProjects);

var projectsList = document.getElementById('projectsList');
projectsList.addEventListener("click", function(e) {
	var target = e.target;
	var doo;
	
	if(target.nodeName==="A") {
		doo = target.dataset.do;
		console.log("Do", doo);
		e.preventDefault();
	}
	
	var li = target;		
	while(li.nodeName!=="LI") {
		if(li==projectsList) return;
		li = li.parentElement;
	}
	var projectId = li.dataset.project_id;
	
	switch(doo) {
	
		case "delete":
		var project = projects[projectId];
		XioPop.confirm("Delete project?", "Are you sure you want to delete project '"+project.name+"'?", function(answer) {
			if(answer) {
				var formData = new FormData();
				formData.append("project_id", projectId);
				var xhr = new XMLHttpRequest();
				xhr.open('POST', "/scripts/delete_project.php", true);
				xhr.onload = function(e) {
					var xhr = e.target;
					if(xhr.status===200) {
						console.log("Project deleted");
						findProjects();
					} else {
						console.err("Error deleting project", xhr);
					}
				};
				xhr.send(formData);
			}
		});
		break;
		
		case "rename":
		XioPop.prompt("Rename project", "Enter a new name for the project", projects[projectId].name, function(newName) {		
			if(newName) {
				var formData = new FormData();
				formData.append("new_name", newName);
				formData.append("project_id", projectId);
				var xhr = new XMLHttpRequest();
				xhr.open('POST', "/scripts/rename_project.php", true);
				xhr.onload = function(e) {
					var xhr = e.target;
					if(xhr.status===200) {
						console.log("Project renamed");
						findProjects();
					} else {
						console.err("Error renaming project", xhr);
					}
				};
				xhr.send(formData);				
			}
		});
		break;
	
		
		default:
		setHash(projectId+"/untitled");
	
	}
	
	
});




var loginBox = document.getElementById("login");
var loginForm = document.getElementById("loginForm");
var loginButton = document.getElementById("btnLogin");
loginForm.addEventListener("submit", loginRequest, false);


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






document.querySelector("#header h1").addEventListener("click", function() {
	setHash();
}, false);


var btnNewProject = document.getElementById("btnNewProject");
btnNewProject.addEventListener("click", function() {
	XioPop.prompt("Enter the projects name", "", "", function(projectName) {
		if(projectName) {
			var xhr = new XMLHttpRequest();
			xhr.open("get", "/scripts/new_project.php?projectName="+projectName, true);

			xhr.onload = function(e) {
				if(e.target.status===200) {
					findProjects();
				}
			};
			xhr.send();
		}
	});
}, false);




/***************** TOOLBAR **********************************************************************/

var toolbar = document.getElementById("toolbar");
toolbar.addEventListener("click", toolbarHandler, false);


function toolbarHandler(e) {
	if(e.button!==0) return false;

	var button = e.target;
	if(button.classList.contains("disabled")) return;

	switch(button.id) {

		case "btnNew":
		createNewFile();
		break;

		case "btnSave":
			if(activeFile==="untitled") {
				console.log("Save As...  ");
				XioPop.prompt("Save file as...", "Enter the filename", "", function(answer) {
					if(answer) {
						saveFileAs(answer);
					}
				});
			} else if(activeFile) {
				saveFile();
			}
		break;

		
		case "btnPreviewFile":
		var path = projectsURL + activeProject.id +"/"+ activeFile;
		console.log("Preview:", projectsURL + activeProject.id +"/"+ activeFile);
		window.open(path, 'code_file_preview');
		break;

		case "btnPreviewProject":
		var url = activeProject.run_url;
		if(!url) {
			url = projectsURL + activeProject.id + "/";
		}
		window.open(url, activeProject.id+'_preview');
		break;


		case "btnProjectConfig":
		XioPop.load("/scripts/project_config.php?project_id="+activeProject.id, function(e) {
			var frmProjectConfig = document.getElementById("frmProjectConfig");
			frmProjectConfig.addEventListener("submit", function(e) {
				e.preventDefault();
				console.log("Save project configurations");
				var formData = new FormData(frmProjectConfig);
				var xhr = new XMLHttpRequest();
				xhr.open('POST', "/scripts/project_config.php?do=save", false);
				xhr.onload = function(e) {
					var xhr = e.target;
					if(xhr.status===200) {
						console.log("Sparat");
						XioPop.close();
					} else {
						console.err("Error saving config", xhr);
					}
				};
				xhr.send(formData);
			}, false);

			var btnConfigCancel = document.getElementById("btnConfigCancel");
			btnConfigCancel.addEventListener("click", function(e) {
				XioPop.close();
			}, false);
		});
		break;

		case "btnExportZip":
			window.location="/scripts/export_zip.php?path=" + activeProject.id + "/";
		break;

		default:
		console.warn("Unknown button clicked");
	}

}



/***************** USER MENU **********************************************************************/

var userMenu = document.getElementById("userMenu");
userMenu.addEventListener("click", function(e) {
	if(e.button!==0) return false;

	var target = e.target;
	while(target.nodeName!=="LI") {
		if(target==userMenu) return;
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
});





window.onresize = function(e) {
	fixLayout();
};

window.onhashchange = function(e) {
	var newHash = window.location.hash;
	if(oldHash!=newHash) readHash(newHash);
};

window.onbeforeunload = function (evt) {
	var n = numberOfUnsavedFiles();
	if(n>0) {
		return "You have "+n+" unsaved files. Are you sure you want to navigate away from this page";
	}
};



function init() {
	pageTitle = document.title;
	console.log("Init " + pageTitle);
	
	if(_USER && _USER.username) {
		var userLogin = new CustomEvent("userLogin");
		window.dispatchEvent(userLogin);
	}
	
}


function logout() {
	document.body.classList.remove("authorized");
	projectsList.innerHTML="";
	FileList.clear();
	openedList.innerHTML="";
	projects = [];
	var doc = CodeMirror.Doc("");
	var old = codeMirror.swapDoc(doc);
	activeProject = null;
	activeFile = null;
	xioDocs = {};
	loginForm.elements.code_username.focus();	
	clearInterval(checkAccessInterval);
	
	var xhr = new XMLHttpRequest();
	xhr.open("get", "/scripts/gatekeeper_logout.php", true);
	xhr.send();
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



addEventListener("userLogin", function(e) {
	console.log("Login accepted");	
	console.log(_USER);
	
	document.body.classList.add("authorized");
	
	
	$("#username").html(_USER.username);
	
	//Access check every minute
	checkAccessInterval = setInterval(checkAccess, ACCESS_CHECK_INTERVAL);
	
	initWriter();
	findProjects();
});

function fixLayout() {
	var height = document.getElementById("fileList").offsetHeight;
	codeMirror.setSize(null, height);
}

function showImagePreview(uri) {
	var imgsrc = activeProject.id + "/" + uri;
	var item = files[uri];
	
	console.log("showImagePreview");
	$("#imagePreview").show();
	document.getElementById("imagePreviewImage").style.backgroundImage = "url('/scripts/image.php?src="+imgsrc+"&max_width=140&max_height=140')";
	$("#imagePreviewInfo").html(
		"<strong>" + item.filename + "</strong><br /><br />" +
		"Width: <strong>" + item.width + "</strong> px<br />" +
		"Height: <strong>" + item.height + "</strong> px<br />"
	);
}


function findProjects() {
	var url = "/scripts/get_all_projects.php";
	var xhr = new XMLHttpRequest();
	xhr.responseType='json';
	xhr.open("get", "/scripts/get_all_projects.php", true);
	xhr.onreadystatechange = function(e) {
		//console.log("readystate change", e.target.readyState, e.target);
	};
	xhr.onload = function(e) {
		if(e.target.status===200) {
			projects=e.target.response;
			var projectsHTML=[];
			for(var id in projects) {
				if (projects.hasOwnProperty(id)) {
					var item = projects[id];
					projectsHTML.push("<li data-project_id='"+id+"'>");
					projectsHTML.push("<h3>"+item.name+"</h3>");
					projectsHTML.push("<div style='display: block;'>");
					if(item.description) projectsHTML.push("<p>"+item.description+"</p>");
					projectsHTML.push("<a href='#' data-do='rename'>Rename</a>");
					projectsHTML.push("<a href='#' data-do='delete'>Delete</a>");
					projectsHTML.push("</div>");
					projectsHTML.push("</li>");
				}
			}
			console.log("%i projects found", Object.keys(projects).length, e.target.response);
			projectsList.innerHTML = projectsHTML.join("");
			filterProjects();
			readHash(window.location.hash);
		}
	};
	xhr.send();
}

function openProject(id) {
	if(!projects || projects.length===0) { 
		console.log("No projects loaded yet");
		return false;
	}

	var project = projects[id];
	if(project===undefined) {
		console.log("project id not found, return to base...");
		setHash();
		return;
	}
	activeProject = project;
	activeProject.id = id;
	document.title = pageTitle + " - " + project.name;

	document.getElementById("projectChooser").classList.add("hidden");
	document.getElementById("projectArea").classList.remove("hidden");
	$("#pageTitle").html(project.name);
	fixLayout();
	
	FileList.clear();
	FileList.setProjectId(id);
	redrawOpenedDocs(id);
}

function openFile(uri) {
	if(!uri) uri="";
	setHash(activeProject.id + "/" + uri);
}




function unloadFile() {
	openFile("untitled");
	//getOrCreateDoc(activeProject.id, "untitled")
	//setActiveFile("untitled");
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
			var xhr = new XMLHttpRequest();
			xhr.open("post", "/scripts/file_handler.php?do=new&project_id="+activeProject.id+"&uri="+escape(newFileName), true);
			xhr.onload = fileCreationCallback;
			xhr.send();
		}
	});	
}
function fileCreationCallback(e) {
	var json = validateCallback(e);
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
				var xhr = new XMLHttpRequest();
				xhr.open("post", "/scripts/file_handler.php?do=new&project_id="+activeProject.id+"&overwrite=true&uri="+escape(json.uri), true);
				xhr.onload = fileCreationCallback;
				xhr.send();
			}
		});
		break;
		
		default:
		console.warn("handle callback", json);
	}
	
	
}




function validateCallback(e) {
	if(e.target.status===200) {
		try {
			var json = JSON.parse(e.target.responseText);
			return json;
		}
		catch(err) {
			console.error("Ajax callback not valid json", e.target.responseText, err);
			return false;
		}		
	} else {
		console.error("Error during ajax call", e);
		return false;
	}
}



function saveFile() {
	codeMirror.save();
	
	var formData = new FormData();
	formData.append("uri", activeFile);
	formData.append("project_id", activeProject.id);
	formData.append("code", codeMirror.getValue());

	console.log("Save file '"+ activeFile+"'...");
	
	var $menuItem = $("li[data-uri='"+activeFile+"']");
	$menuItem.append("<img src='/images/ajax-loader.gif' class='file_spinner' />");
	
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/scripts/save.php", true);	
	xhr.onload = function(e) {
		if(e.target.status===200) {
			setFileToClean(activeFile);
			console.log("File saved");
		} else {
			console.error("Error saving file", e);
		}
		$menuItem.children("img").fadeOutAndRemove();
	};		
	xhr.send(formData);
}

function saveFileAs(newFileName, overwrite) {
	codeMirror.save();
	
	var formData = new FormData();
	formData.append("uri", newFileName);
	formData.append("project_id", activeProject.id);
	formData.append("code", codeMirror.getValue());
	formData.append("do", "saveAs");
	if(overwrite) formData.append("overwrite", true);
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/scripts/file_handler.php", true);
	xhr.onload = function(e) {
		var json = validateCallback(e);
		if(!json) return false;	
		
		switch(json.status) {
			case STATUS_OK:
			console.log("file saved as ", json.uri);
			FileList.loadProjectFiles();
			openFile(json.uri);
			if(activeFile==="untitled") {
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
	};
	
	xhr.send(formData);

}












function setHash(newHash) {
	if(!newHash) {
		oldHash = "";
		history.pushState({foo: "bar"}, "kokooo", "/");
		chooseProject();
	} else if(newHash!=oldHash) {
		oldHash = newHash;
		window.location.hash = newHash;
	}
}

function readHash(hash) {
	console.log("Read hash", hash);
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
			getOrCreateDoc(project_id, uri);
			FileList.setActiveFile(uri);
		} else {
			unloadFile();
		}
		
	} else {
		console.log("   Show projects page");
		chooseProject();
	}	
	oldHash=hash;
}


function filterProjects(e) {
	var searchString = projectsFilter.value.toLowerCase();
	if(e && e.which == KEY_ENTER && searchString) {
		var firstItem = document.querySelector("#projectsList li:not(.hidden)");
		setHash(firstItem.getAttribute('data-project_id')+"/untitled");
		return false;
	} else {
		console.log("filter projects '"+searchString+"'", projectsFilter, projects);
		
		for(var id in projects) {
      if (projects.hasOwnProperty(id)) {
        var project = projects[id];
        
        var li = document.querySelector("#projectsList li[data-project_id='"+id+"']");
        if(project.name.toLowerCase().search(searchString)!=-1) {
          li.classList.remove('hidden');
        } else {
          li.classList.add('hidden');
        }
      }
		}
	}
}	

function chooseProject() {
	document.getElementById("projectChooser").classList.remove("hidden");
	document.getElementById("projectArea").classList.add("hidden");
	
	$("#pageTitle").html("My projects");
	activeProject = null;
	document.tite = pageTitle;
	projectsFilter.focus();
}


function setFileToClean(uri) {
	console.log(uri, "is now clean");
	document.getElementById("btnSave").classList.add("disabled");
	var doc = xioDocs[activeProject.id][uri];
	doc.markClean();
	$("#fileList li.selected").removeClass("changed");
	$("#openedList li.selected").removeClass("changed");
}

function numberOfUnsavedFiles() {
	var counter = 0;
	for(var uri in xioDocs[activeProject.id]) {
		if(!xioDocs[activeProject.id][uri].isClean()) {
			counter++;
		}
	}
	return counter;
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

jQuery.fn.fadeOutAndRemove = function(speed){
    $(this).fadeOut(speed,function(){
        $(this).remove();
    });
};


function toQueryString(obj) {
    var parts = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
        }
    }
    return parts.join("&");
}






init();
