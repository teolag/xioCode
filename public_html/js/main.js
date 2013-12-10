"use strict";

var codeMirror;
var fileListWidth = 220;

var DEBUG_MODE_ON=true;
var ACCESS_CHECK_INTERVAL=5*60*1000; //Every 5 minutes

var projects = new Array();
var files;

var activeProject;
var activeFile;
var checkAccessInterval;
var pageTitle;
var hoverTimer;
var fileToBeLoaded;
var localStore = window.localStorage;
	


var oldHash=window.location.hash;



if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function(){};
}

var projectList = document.getElementById("projects");


var fileList = document.getElementById("fileList");
fileList.addEventListener("drop", dropFile, false);
fileList.addEventListener("dragover", hoverFile, false);
fileList.addEventListener("dragleave", hoverFile, false);


var loginBox = document.getElementById("login");
var loginForm = document.getElementById("loginForm");
var loginButton = document.getElementById("btnLogin");


loginForm.addEventListener("submit", function(e) {
	e.preventDefault();
	if(!loginForm.elements['code_username'].value || !loginForm.elements['code_password'].value) {
		return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("post", "/scripts/gatekeeper_login.php", true);
	xhr.onload = loginCallback;
	xhr.send(new FormData(loginForm));
}, false);


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
}






document.querySelector("#header h1").addEventListener("click", function() {
	setHash();
}, false);


$("#btnNewProject").on("click", function() {
	var projectName = prompt("Enter the projects name");
	if(projectName) {
		$.get("/scripts/new_project.php", {'projectName':projectName}, function(data) {
			findProjects();
		});
	}	
});


/***************** PROJECT FILTER ***************************************************************/
var projectFilter = document.getElementById('projectFilter');
projectFilter.addEventListener("search", filterProjects);
projectFilter.addEventListener("keyup", filterProjects);

$("#projects").on("click", "li", function() {
	setHash(this.getAttribute("data-project_id")+"/");
});

$("#projects").on("click", ".lblDeleteProject", function(e) {
	var $li = $(this).closest('li');
	var projectId = $li.data("project_id");
	var project = projects[projectId];
	if(confirm("Are you sure you want to delete project '"+project.name+"'?")) {
		$.post("/scripts/delete_project.php", {'project_id':projectId}, function(data) {
			findProjects();
		});
	}
	e.stopPropagation();
});

$("#projects").on("click", ".lblRenameProject", function(e) {
	var $li = $(this).closest('li');
	var projectId = $li.data("project_id");
	var projectName = $li.data("name");
	var newName = prompt("Rename project", projectName);		
	if(newName) {
		$.post("/scripts/rename_project.php", {'new_name':newName, 'project_id':projectId}, function(data) {
			findProjects();
		});			
	}
	e.stopPropagation();
});




/***************** TOOLBAR **********************************************************************/

var toolbar = document.getElementById("toolbar");
toolbar.addEventListener("click", function(e) {
	if(e.button!==0) return false;
	
	var target = e.target;
	while(target.nodeName!=="LI") {
		if(target==toolbar) return;
		target = target.parentElement;
	}
	if(target.classList.contains("disabled")) return;
	
	switch(target.id) {
	
		case "btnNew":
		createNewFile();
		break;
		
		case "btnSave":
			if(activeFile==="unsavedFile") {
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
		
		case "btnRevert":
		revertFile();
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

}, false);



/***************** USER MENU **********************************************************************/

$("#btnExportAllZip").on("click", function() {
	var d = new Date();
	window.location="/scripts/export_zip.php?path=" + "&filename=Projects_"+d.toISOString().substring(0,10)+'.zip';
});

$("#btnChangePassword").on("click", function() {
	var newPass = prompt("Enter new password");
	if(newPass) {
		$.post("/scripts/change_password.php", {'newPass':newPass}, function(data) {
			alert(data);		
		});
	}
});

document.getElementById("btnLogout").addEventListener("click", logout, false);




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
			return;
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
		
$(window).resize(function() {
	fixLayout();
});	

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
	projectList.innerHTML="";
	fileList.innerHTML="";
	projects = new Array();
	files = new Array();
	activeProject = null;
	activeFile = null;
	codeMirror.setValue("");
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
});

function fixLayout() {
	var h = $(window).height();
	var w = $(window).width();
	
	if(codeMirror) {
		codeMirror.setSize(w-fileListWidth-40, h-112);
		codeMirror.refresh();
	}
	
	$("#fileList").css ({
		"width":fileListWidth,
		"height":h-64
	});
}

function showImagePreview(uri) {
	var imgsrc = projectsURL + activeProject.id + "/" + uri;
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
	$.ajax({
		url: url,
		success: function(data) {
			projects=data;
			console.log(projects);
			var projectsHTML=[];
			$.each(projects, function(id, item) {
				projectsHTML.push("<li data-project_id='"+id+"'>");
				projectsHTML.push("<h3>"+item.name+"</h3>");
				projectsHTML.push("<div style='display: block;'>");
				if(item.description) projectsHTML.push("<p>"+item.description+"</p>");
				projectsHTML.push("<a href='#' class='lblRenameProject'>Rename</a>");
				projectsHTML.push("<a href='#' class='lblDeleteProject'>Delete</a>");
				projectsHTML.push("</div>");
				projectsHTML.push("</li>");
			});
			console.log("%i projects found", Object.keys(projects).length, data);
			projectList.innerHTML = projectsHTML.join("");
			filterProjects();
			readHash(window.location.hash);
		},
		async: true,
		dataType: "json"
	});
	
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

	$("#choose_project").hide();
	$("#writer").show();
	$("#pageTitle").html(project.name);
	
	fixLayout();
	
	files = null;
	fileList.innerHTML = "";
	getProjectFiles();
}

function openFile(uri) {
	setHash(activeProject.id + "/" + uri);
}



function loadFile(uri, forceLoadFromDisc) {

	if(files==null) {
		console.log("Filelist not loaded.  Wait for it...");
		fileToBeLoaded = uri;
		return false;
	} else if(!files[uri]){
		console.warn("File not found: '" + uri + "'");
		return false;
	}
	
	activeFile = null;

	var mode, modefile;
	switch(files[uri].type) {
		case "php": 			mode="application/x-httpd-php"; 	modefile="php/php.js"; break;
		case "js": 				mode="text/javascript"; 			modefile="javascript/javascript.js"; break;
		case "html": case "htm":mode="text/html"; 					modefile="htmlmixed/htmlmixed"; break;
		case "css": 			mode="text/css"; 					modefile="css/css.js"; break;
		case "xml": case "svg": mode="application/xml"; 			modefile="xml/xml.js"; break;
		default: 				mode="text/plain";
	}
		
	var $menuItem = $("li[data-uri='"+uri+"']");
	$menuItem.append("<div class='file_loader'></div>");
	
	var localSaved = localStore.getItem(activeProject.id +"/"+uri);
	selectInFileList(uri);
	if(!forceLoadFromDisc && localSaved) {
		codeMirror.setValue(localSaved);	
		activeFile = uri;
		fileChanged();
		codeMirror.setOption("mode", mode);
		$menuItem.children("div").fadeOutAndRemove();
		console.log("Loading '" + uri + "' from local storage. Display as '" + codeMirror.getOption("mode") + "'");
	} else {
		$.get("/scripts/load_file.php", {
			'project_id':activeProject.id,
			'uri':encodeURI(uri)
			}, function(data) {
				codeMirror.setValue(data);
				activeFile = uri;
				fileNotChanged();
				codeMirror.setOption("mode", mode);
				$menuItem.children("div").fadeOutAndRemove();
				console.log("Loading file '" + uri + "'. Display as '" + codeMirror.getOption("mode") + "'");			
			}
		);	
	}	
}

function unloadFile() {
	$("#fileList li").removeClass("selected");
	activeFile = "unsavedFile";
	var localSaved = localStore.getItem(activeProject.id+"/"+activeFile);
	if(localSaved) {
		codeMirror.setValue(localSaved);
	} else {
		codeMirror.setValue("");
	}
	codeMirror.focus();
}

function revertFile() {	
	if(confirm("Are you sure you want to revert your unsaved changes?")) {
		console.log("Revert file: '", activeFile, "'");
		loadFile(activeFile, true);		
	}
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
		activeFile = json.uri;
		console.log("file saved as ", activeFile);
		reloadFileList();
		openFile(activeFile);
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
	var form = document.getElementById("writer");
	
	var formData = new FormData(form);
	formData.append("uri", activeFile);
	formData.append("project_id", activeProject.id);

	console.log("Save file '"+ activeFile+"'...");
	
	var $menuItem = $("li[data-uri='"+activeFile+"']");
	$menuItem.append("<img src='/images/ajax-loader.gif' class='file_spinner' />");
	
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/scripts/save.php", true);	
	xhr.onload = function(e) {
		if(e.target.status===200) {
			fileNotChanged();
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
	var form = document.getElementById("writer");
	
	var formData = new FormData(form);
	formData.append("uri", newFileName);
	formData.append("project_id", activeProject.id);
	formData.append("do", "saveAs");
	if(overwrite) formData.append("overwrite", true);
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/scripts/file_handler.php", true);
	xhr.onload = function(e) {
		var json = validateCallback(e);
		if(!json) return false;	
		
		switch(json.status) {
			case STATUS_OK:
			if(activeFile==="unsavedFile") {
				localStore.removeItem(activeProject.id+"/"+activeFile);	
			}			
			activeFile = json.uri;
			console.log("file saved as ", activeFile);
			reloadFileList();
			openFile(activeFile);
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
		
			console.log("Files:", e.target.responseText);
			try{
				var items = JSON.parse(e.target.responseText);
			} catch(e) {
				console.error("Error parsing json response", e);
				return false;
			}
			
			files = [];
			fileList.innerHTML = print_folder(items, "");
			
			if(fileToBeLoaded) {
				loadFile(fileToBeLoaded);
				fileToBeLoaded = null;
			}			
		} else {
			console.error("Error loading file tree", e);
		}
	}
	xhr.send();	
}





function reloadFileList() {

	//Save filelist state
	var openFolders = [];
	$.each($("#fileList li[data-type=folder] span.open"), function(i, open) {
		openFolders.push($(open).parent().data("uri"));
	});
	
	//Find files and build tree
	getProjectFiles();
	
	//reopen all opened folders
	if(openFolders.length>0) {
		console.log("Reopen folders", openFolders);
		$.each(openFolders, function(i, elem) {
			var li = fileList.querySelector("li[data-uri='"+elem+"']");
			toggleFolder(li);
		});
	}
	
	//reselect opened file
	selectInFileList(activeFile);
	
}


function print_folder(arr, path) {
	var htm = [];
	htm.push("<ul>");
	$.each(arr, function(i, item) {
		var imagePreview="";
		if(item.type=="jpg" || item.type=="jpeg" || item.type=="gif" || item.type=="png" || item.type=="bmp" || item.type=="tif" || item.type=="tiff") {
			imagePreview=" imagePreview";
		}
		files[item.path + item.filename] = item;
		var localSaved = localStore.getItem(activeProject.id+"/"+item.path+item.filename);
		var changed = (localSaved)? ' changed' : '';
		var hidden  = (item.filename=='xiocode.properties')? ' hidden' : '';
		htm.push("<li draggable='true' class='"+imagePreview + changed + hidden+"' data-uri='" + item.path + item.filename + "' data-type='"+item.type+"' data-mime='"+item.mime+"'>");
		htm.push("<span class='fileIcon "+item.type+"'></span>");
		htm.push("<span class='fileName'>"+item.filename+"</span>");
		if(item.leafs) {
			htm.push(print_folder(item.leafs, item.path));
		}
		htm.push("</li>");		
	});
	htm.push("</ul>");
	return htm.join("");
}

function selectInFileList(uri) {
	console.log("Select: '" + uri + "' in fileList");
	var items = fileList.querySelectorAll("li");
	for(var i = 0; i<items.length; i++) {
		items[i].classList.remove("selected");
	}
	var li = fileList.querySelector("li[data-uri='"+uri+"']");
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
			console.log("load it");
			loadFile(uri);
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
	if(e && e.which == 13) {
		var firstItem = document.querySelector("#projects li:not(.hidden)");
		setHash(firstItem.getAttribute('data-project_id')+"/");
		return false;
	} else {
		var searchString = projectFilter.value.toLowerCase();
		console.log("filter projects '"+searchString+"'", projectFilter, projects);
		
		for(var id in projects) {
			var project = projects[id];
			console.log(id, project);
			
			var li = document.querySelector("#projects li[data-project_id='"+id+"']");
			if(project.name.toLowerCase().search(searchString)!=-1) {
				li.classList.remove('hidden');
			} else {
				li.classList.add('hidden');
			}
		}
	}
}	

function chooseProject() {
	$("#choose_project").show();
	$("#writer").hide();
	$("#pageTitle").html("Choose project");
	activeProject = null;
	document.tite = pageTitle;
	projectFilter.focus();
}


function fileChanged() {
	localStore.setItem(activeProject.id+"/"+activeFile, codeMirror.getValue());
	console.log("Save to local storage", activeFile);
	$("#fileList li.selected").addClass("changed");
	$("#btnSave").removeClass("disabled");
	$("#btnRevert").removeClass("disabled");
}
function fileNotChanged() {
	console.log(activeFile, "is now clean");
	$("#btnSave").addClass("disabled");
	$("#btnRevert").addClass("disabled");
	$("#fileList li.selected").removeClass("changed");
	localStore.removeItem(activeProject.id+"/"+activeFile);	
}

function numberOfUnsavedFiles() {
	return $("#fileList li.changed").length;
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
	var folderIcon = li.querySelector("span.fileIcon");
	var folderList = li.querySelector("ul");
	folderIcon.classList.add("open");
	folderList.style.display="block";
}
function closeFolder(li) {
	console.log("Close folder", li);
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
