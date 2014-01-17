"use strict";

var codeMirror;
var fileListWidth = 220;

var DEBUG_MODE_ON=true;
var ACCESS_CHECK_INTERVAL=5*60*1000; //Every 5 minutes

var KEY_ENTER = 13;

var projects = new Array();
var files;

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
				}
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
				}
				xhr.send(formData);				
			}
		});
		break;
	
		
		default:
		setHash(projectId+"/");
	
	}
	
	
});


var fileList = document.getElementById("fileList");
fileList.addEventListener("drop", dropFile, false);
fileList.addEventListener("dragover", hoverFile, false);
fileList.addEventListener("dragleave", hoverFile, false);


var loginBox = document.getElementById("login");
var loginForm = document.getElementById("loginForm");
var loginButton = document.getElementById("btnLogin");
loginForm.addEventListener("submit", loginRequest, false);


function loginRequest(e) {
	e.preventDefault();
	if(!loginForm.elements['code_username'].value || 
		!loginForm.elements['code_password'].value) {
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
		_USER = user
		var userLogin = new CustomEvent("userLogin");
		dispatchEvent(userLogin);
	}
	else {
		console.warn("Incorrect login or password")
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
toolbar.addEventListener("click", toolbar, false);


function toolbarHandler(e) {
	if(e.button!==0) return false;

	var target = e.target;
	/*
	while(target.nodeName!=="LI") {
		//if(target==) return;
		target = target.parentElement;
	}
	*/
	if(target.classList.contains("disabled")) return;

	switch(target.id) {

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
				}
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
				}
				xhr.send(formData);
			}
		});		
		break;
	}
});





/***************** FILE LIST **********************************************************************/

$("#fileList").on("contextmenu",function(e){
	var $target = $(e.target);
	if(e.ctrlKey || e.altKey) return true;
	
	if($target.is("span") || $target.is("li")) {
		if($target.is("span")) $target = $target.parent();
		var uri = $target.data("uri");			
		showFileListRightClickMenu(uri, e);
		return false;
	} else {
		showRootRightClickMenu("", e);
		return false;
	}		
}); 

$("#fileList").on("click", function(e) {
	hideFileListRightClickMenu();
});
	
$("#fileList").on("click", "li", function(e) {
	hideFileListRightClickMenu();
	
	var uri = $(this).data("uri");
	var file = files[uri];
	
	console.log("Clicked on item", file);		
	if(uri && e.which == 1) {
		if(uri === activeFile) {
			console.log("Already open");
			e.preventDefault();
		} else if(file.type==='folder') {
			toggleFolder(this);
		} else if(['jpg','png','pdf','gif','bmp'].indexOf(file.type)!=-1) {
			console.log("Open in new tab");
			window.open(projectsURL + activeProject.id + "/" + uri);
		} else {		
			console.log("Mime type text/* -> open in textarea");
			openFile(uri);
		}
		e.stopPropagation();
	} else if(e.which==2) {
		alert("rightclick");
	}	
});

$("#fileList").on("dragstart", "li", function(e){
	console.log("Drag start", this, e);
	var mime = $(this).data("mime");
	var filename = $(this).children(".fileName").html();
	var filePath = location.origin + "/scripts/load_file.php?project_id=" + activeProject.id + "&uri=" + encodeURI($(this).data("uri"));
	var fileDetails = mime + ":" + filename + ":" + filePath;
	console.log("fileDetails", fileDetails);
	e.originalEvent.dataTransfer.setData("DownloadURL", fileDetails);
	$("#fileList").data("dragItem", $(this));
	e.stopPropagation();
});
		
$("#fileList").on("mouseover", "li.imagePreview", function(e) {
	hoverTimer = setTimeout('showImagePreview("' + $(this).data("uri") + '")', 500);
});

$("#fileList").on("mousemove", "li.imagePreview", function(e) {
	$("#imagePreview").css({top:e.pageY, left:e.pageX+20});
});

$("#fileList").on("mouseout", "li.imagePreview", function() {
	clearTimeout(hoverTimer)
	$("#imagePreview").hide();
});

$("#fileListRightClickMenu li").on("click", function() {
	var uri = $(this).parent().parent().data("uri");
	var path = (uri)? files[uri].path : "";
	var filename = (uri)? files[uri].filename : "";
	switch($(this).data("do")) {
		
		case "newFolder":
			var folderName = prompt("Enter the name of the folder");
			if(folderName) {
				if(uri && files[uri].type=='folder') path+=filename + "/";
				$.get("/scripts/create_folder.php",  {'project_id':activeProject.id, 'uri':encodeURI(path + folderName)}, function() {
					reloadFileList();
				});
			}
		break;
		
		case "newFile":
			var newFileName = prompt("Enter the filename");
			if(newFileName) {
				if(uri && files[uri].type=='folder') path+=filename + "/";
				$.post("/scripts/save.php",  {'project_id':activeProject.id, 'uri':encodeURI(path + newFileName)}, function() {
					reloadFileList();
					openFile(path + newFileName);
				});
			}			
		break;
		
		case "refresh":
			reloadFileList();			
		break;
		
		case "delete":
			if(files[uri].type=='folder') { 
				var answer = confirm("Are you sure you want to delete the folder and all its content?\n"+uri+"?");
				if(answer) {
					$.get("/scripts/delete_folder.php",  {'project_id':activeProject.id, 'uri':encodeURI(uri)}, function() {
						reloadFileList();
					});
				}
			} else {
				var answer = confirm("Are you sure you want to delete the file: '"+uri+"'?");
				if(answer) {
					$.get("/scripts/delete_file.php",  {'project_id':activeProject.id, 'uri':encodeURI(uri)}, function() {
						reloadFileList();
					});
				}
			}
		break;
		
		case "rename":
			var new_name = prompt("Enter the new name of the file/folder", filename);
			if(new_name) {
				$.get("/scripts/rename.php",  {'project_id':activeProject.id, 'from':encodeURI(uri), 'to':encodeURI(path + new_name)}, function() {
					if(activeFile==uri) activeFile=path+new_name;
					console.log(uri, "renamed to", path+new_name);
					reloadFileList();
				});
			}
		break;
		
		case "upload":
			XioPop.alert("upload file...", "not implemented yet ");
		break;
		
	}
	hideFileListRightClickMenu();
});
		
window.onresize = function(e) {
	fixLayout();
}	

window.onhashchange = function(e) {
	var newHash = window.location.hash;
	if(oldHash!=newHash) readHash(newHash);
}

window.onbeforeunload = function (evt) {
	var n = numberOfUnsavedFiles()
	if(n>0) {
		return "You have "+n+" unsaved files. Are you sure you want to navigate away from this page";
	}
}



function init() {
	pageTitle = document.title;
	console.log("Init " + pageTitle);
	
	if(_USER && _USER.username) {
		var userLogin = new CustomEvent("userLogin");
		dispatchEvent(userLogin);
	}
	
}


function logout() {
	document.body.classList.remove("authorized");
	projectsList.innerHTML="";
	fileList.innerHTML="";
	openedList.innerHTML="";
	projects = new Array();
	files = new Array();
	var doc = CodeMirror.Doc("");
	var old = codeMirror.swapDoc(doc);
	activeProject = null;
	activeFile = null;
	xioDocs = {};
	loginForm.elements['code_username'].focus();	
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
	}
	xhr.send();
}



addEventListener("userLogin", function(e) {
	console.log("Login accepted");	
	console.log(_USER);
	
	document.body.classList.add("authorized");
	
	
	$("#username").html(_USER.username);
	
	//Access check every minute
	checkAccessInterval = setInterval(checkAccess, ACCESS_CHECK_INTERVAL);
	
	findProjects();
	initWriter();
	fixLayout();
});

function fixLayout() {
	var height = document.getElementById("xioDoc").offsetHeight - document.getElementById("xioDocTop").offsetHeight;
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
		console.log("readystate change", e.target.readyState, e.target);
	};
	xhr.onload = function(e) {
		if(e.target.status===200) {
			console.log("Projects callback", e.target);
			projects=e.target.response;
			console.log(projects);
			var projectsHTML=[];
			for(var id in projects) {
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
			console.log("%i projects found", Object.keys(projects).length, e.target.response);
			projectsList.innerHTML = projectsHTML.join("");
			filterProjects();
			readHash(window.location.hash);
		}
	};
	xhr.send();
	readHash(window.location.hash);
}

function openProject(id) {
	if(!projects || projects.length===0) { 
		console.log("No projects loaded yet");
		return false;
	}

	var project = projects[id];
	if(project===undefined) {
		console.log("project id not found, return to base...");
		setHash(" ");
		return;
	}
	activeProject = project;
	activeProject.id = id;
	document.title = pageTitle + " - " + project.name;

	$("#projectChooser").hide();
	$("#projectArea").show();
	$("#pageTitle").html(project.name);
	
	
	files = null;
	fileList.innerHTML = "";
	getProjectFiles();
	redrawOpenedDocs();
}

function openFile(uri) {
	if(!uri) uri="";
	setHash(activeProject.id + "/" + uri);
}




function unloadFile() {
	$("#fileList li").removeClass("selected");
	openFile("untitled")
	//getOrCreateDoc(activeProject.id, "untitled")
	//setActiveFile("untitled");
	codeMirror.focus();
	
}



function createNewFile() {
	XioPop.prompt("Enter the new filename", "", "", function(newFileName) {
		if(newFileName===false) {
			console.debug("abort file creation");
			return;
		} else if(newFileName.trim()=="") {
			console.debug("not a valid filename");
			XioPop.alert("Invalid filename", "You must enter a valid filename, try again", function() {
				createNewFile()
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
		reloadFileList();
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
			reloadFileList();
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
	}
	
	xhr.send(formData);

}




function getProjectFiles() {
	var xhr = new XMLHttpRequest();
	xhr.open("get", "/scripts/build_file_tree.php?project_id="+activeProject.id, true);
	xhr.onload = function(e) {
		if(e.target.status===200) {
		
			try{
				var items = JSON.parse(e.target.responseText);
			} catch(e) {
				console.error("Error parsing json response", e);
				return false;
			}
			
			files = {};
			fileList.innerHTML = printFolder(items, "");
			
			console.log("File list loaded");
			
			for(var i=0; i<openedFolders.length; i++) {
				var li = fileList.querySelector("li[data-uri='"+openedFolders[i]+"']");
				if(li) {
					openFolder(li);				
				}
			}
			
			
			if(activeFile) selectInFileList(activeFile);
		} else {
			console.error("Error loading file tree", e);
		}
	}
	xhr.send();	
}





function reloadFileList() {
	
	getProjectFiles();
	
	//reselect opened file
	selectInFileList(activeFile);
	
}


function printFolder(arr, path) {
	var htm = [];
	htm.push("<ul>");
	$.each(arr, function(i, item) {
		var imagePreview="";
		if(item.type=="jpg" || item.type=="jpeg" || item.type=="gif" || item.type=="png" || item.type=="bmp" || item.type=="tif" || item.type=="tiff") {
			imagePreview=" imagePreview";
		}
		var uri = item.path + item.filename;
		files[uri] = item;
		
		
		var changed = "";
		if(xioDocs.hasOwnProperty(activeProject.id) && xioDocs[activeProject.id].hasOwnProperty(uri) && !xioDocs[activeProject.id][uri].isClean()) {
			changed = " changed ";
		}
		
		var hidden  = (item.filename=='xiocode.properties')? ' hidden' : '';
		var title = item.size? toHumanReadableFileSize(item.size,true) : (item.leafs? item.leafs.length + " items": "empty");
		htm.push("<li draggable='true' class='"+imagePreview + changed + hidden+"' data-uri='" + uri + "' data-type='"+item.type+"' data-mime='"+item.mime+"' title='"+title+"'>");
		htm.push("<span class='fileIcon "+item.type+"'></span>");
		htm.push("<span class='fileName'>"+item.filename+"</span>");
		if(item.leafs) {
			htm.push(printFolder(item.leafs, item.path));
		}
		htm.push("</li>");		
	});
	htm.push("</ul>");
	return htm.join("");
}

function selectInFileList(uri) {
	if(!files) {
		console.log("Can not select", uri, "in fileList. Files not loaded");
		return;
	} 

	console.log("Select: '" + uri + "' in fileList");
	var items = fileList.querySelectorAll("li");
	for(var i = 0; i<items.length; i++) {
		items[i].classList.remove("selected");
	}
	var li = fileList.querySelector("li[data-uri='"+uri+"']");
	if(li) {
		li.classList.add("selected");
		
		//Open all parent folders
		var parent = li.parentElement;
		while(parent!=fileList) {
			if(parent.nodeName==="LI") {
				console.log(parent);
				openFolder(parent);
			}		
			parent = parent.parentElement;
		}
	}
	
}

function showFileListRightClickMenu(uri, e) {
	$("#fileListRightClickMenu")
		.data('uri', uri)
		.css({left:e.pageX, top:e.pageY})
		.show()
		.find("li").show()
	;
}

function showRootRightClickMenu(uri, e) {
	$("#fileListRightClickMenu")
		.data('uri', uri)
		.css({left:e.pageX, top:e.pageY})
		.show()
		.find("li:not(.rootItem)").hide()
	;
}

function hideFileListRightClickMenu() {
	$("#fileListRightClickMenu").hide();
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
	var match;
	if(match = hash.match(/^#([^\/]*)\/?(.*)$/)) {
		var project_id = match[1];
		var uri = match[2];
		
		console.log("project_id:", project_id);
	
		if(!activeProject || (activeProject && project_id!=activeProject.id)) {
			console.log("Open project", project_id);
			files=null;
			openProject(project_id);
		}
		
		console.log("uri:", uri);
		if(uri) {
			getOrCreateDoc(project_id, uri);
			selectInFileList(uri);
		} else {
			unloadFile();
		}
	} else {
		console.log("Show projects page");
		chooseProject();
	}	
	oldHash=hash;
}


function filterProjects(e) {
	var searchString = projectsFilter.value.toLowerCase();
	if(e && e.which == KEY_ENTER && searchString) {
		var firstItem = document.querySelector("#projectsList li:not(.hidden)");
		setHash(firstItem.getAttribute('data-project_id')+"/");
		return false;
	} else {
		console.log("filter projects '"+searchString+"'", projectsFilter, projects);
		
		for(var id in projects) {
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

function chooseProject() {
	$("#projectChooser").show();
	$("#projectArea").hide();
	$("#pageTitle").html("Choose project");
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




function toggleFolder(li) {
	var folderIcon = li.querySelector("span.fileIcon");
	if(folderIcon.classList.contains("open")) {
		closeFolder(li);
	} else {
		openFolder(li);
	}
}
function openFolder(li) {
	console.log("Open folder", li);
	var uri = li.dataset.uri;
	var index = openedFolders.indexOf(uri);
	if (index === -1) {
		openedFolders.push(uri);
	}
	
	var folderIcon = li.querySelector("span.fileIcon");
	var folderList = li.querySelector("ul");
	folderIcon.classList.add("open");
	folderList.style.display="block";
}
function closeFolder(li) {
	console.log("Close folder", li);
	var uri = li.dataset.uri;
	var index = openedFolders.indexOf(uri);
	if (index > -1) {
		openedFolders.splice(index, 1);
	}
	
	var folderIcon = li.querySelector("span.fileIcon");
	var folderList = li.querySelector("ul");
	folderIcon.classList.remove("open");
	folderList.style.display="none";
}





function uploadFiles(files, folder, overwrite) {
	console.log("start upload:", files, "to", folder);

	var uploadData = new FormData();			
	uploadData.append('path', folder);
	uploadData.append('project_id', activeProject.id);
	var fileUploadCount = 0;
	
	for (var i = 0, file; file = files[i]; ++i) {
		var checkData = new FormData();
		checkData.append('file', folder + file.name);
		checkData.append('project_id', activeProject.id);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', "/scripts/check_collision.php", false);
		xhr.send(checkData);		
		if(xhr.status === 409) {
			if(!confirm(xhr.responseText + ", Do you want to overwrite the file?")) {
				continue;
			}
		} else if(xhr.status !== 202) {
			continue;
		}
		uploadData.append(file.name, file);
		fileUploadCount++;
	}
	
	if(fileUploadCount>0) {	
		var xhr = new XMLHttpRequest();
		xhr.open('POST', "/scripts/file_upload.php", true);
		xhr.onload = function(e) {		
			if(xhr.status == 200) {
				reloadFileList();					
			} else {
				console.log("Error uploading file:");
				console.log(files);
			}		
		};
		
		xhr.upload.onprogress = function(e) {
			/*
			console.log(e);
			if (e.lengthComputable) {
			  progressBar.value = (e.loaded / e.total) * 100;
			  progressBar.textContent = progressBar.value; // Fallback for unsupported browsers.
			}
			*/
		};				
		xhr.send(uploadData);
	}
}




function dropFile(e) {
	hoverFile(e);
	console.log(e);
	
	var folder="";
	if($(e.target).closest("li[data-type=folder]").length) {
		var folder = $(e.target).closest("li[data-type=folder]").data("uri") + "/";
		var $newParent = $(e.target).closest("li[data-type=folder]").children("ul");
	} else {
		var folder="";
		var $newParent = $("#fileList");
	}
	
	console.log("drop to folder /" + folder);	
	
	var $dragItem = $("#fileList").data("dragItem");
	if($dragItem) {
		if($newParent[0]===$dragItem.parent()[0]) {
			console.log("drop to same place, abort");
			return;
		}
		$.get("/scripts/move_file.php",  {'project_id':activeProject.id, 'uri':encodeURI($dragItem.data('uri')), 'toFolder':encodeURI(folder)}, function() {
			reloadFileList();
			return;
		});
	} 
	
	var files = e.target.files || e.dataTransfer.files;
	if(files.length > 0) {
		uploadFiles(files, folder, false);
	}
	
}

function hoverFile(e) {
	e.stopPropagation();
	e.preventDefault();
	
	var $target = $(e.target).closest("li[data-type=folder]");
	if(!$target.length) $target = $("#fileList");
	
	if(e.type == "dragover") {
		$target.addClass("dropTo");
	} else {
		$target.removeClass("dropTo")
	}
}



function findFunctions() {
	console.log("Finding functions");
	
	var text = codeMirror.getValue();
	
	var doc = codeMirror.getDoc();
	
	
	var re = new RegExp("function\\s+([A-Z0-9_]+)\\s*\\(([^\\)]*)\\)", "gmi");
	
	var hit;
	var functions = [];
	while(hit = re.exec(text)) {
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
  return function (obj) { Clone.prototype=obj; return new Clone() };
  function Clone(){}
}());

jQuery.fn.fadeOutAndRemove = function(speed){
    $(this).fadeOut(speed,function(){
        $(this).remove();
    })
}













init();
