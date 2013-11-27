"use strict";

var codeMirror;
var fileListWidth = 220;

var DEBUG_MODE_ON=true;

var projects = new Array();
var _USER;

var activeProject;
var activeFile;
var pageTitle;
var hoverTimer;

var files = new Array();

var oldHash=window.location.hash;



if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function(){};
}



init();	
$("#loginForm").submit(function() {
	var $form = $(this);
	$.ajax({
		url:"/scripts/gatekeeper_login.php",
		type:"POST",
		data:$form.serialize(),
		success: function(user, status, jqXHR) {
			if(user && user.username) {
				$("#login").fadeOut(130, function() {;
					_USER = user
					loginAccepted();
				});
			}
			else {
				console.warn("Incorrest login or password")
				$("#login")[0].className="";
				setTimeout(function(){
					$("#login")[0].className="shake";
				},1);
				$("#btnLogin").removeAttr("disabled");
				$form.children("input").val('');						
			}
		},
		error: function(user, status, jqXHR) {
			alert("error  " + user.status + "    " + status + "    " + jqXHR);
		},
		dataType:"json"
	});
	$("#btnLogin").attr("disabled","disabled");		
	return false;
});


document.getElementsByTagName("h1")[0].addEventListener("click", gotoProjectsPage, false);


function gotoProjectsPage() {
	setHash();
}



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


$("#btnNew").on("click", function() {
	var newFileName = prompt("Enter the filename");
	if(newFileName) {
		$.post("/scripts/save.php",  {'uri':encodeURI(newFileName), 'project_id':activeProject.id}, function() {
			reloadFileList();
			openFile(newFileName);
		});
	}
});

$("#btnSave").on("click", function() {
	saveFile();
});

$("#btnRevert").on("click", function() {
	revertFile();
});

$("#btnLogout").on("click", function() {
	window.location="/scripts/gatekeeper_logout.php";
});

$("#btnChangePassword").on("click", function() {
	var newPass = prompt("Enter new password");
	if(newPass) {
		$.post("/scripts/change_password.php", {'newPass':newPass}, function(data) {
			alert(data);		
		});
	}
});
	
$("#btnPreviewFile").on("click", function() {
	var path = projectsPath + activeProject.id +"/"+ activeFile;
	console.log("Preview:", projectsPath + activeProject.id +"/"+ activeFile);
	window.open(path, 'code_file_preview');
});
		
$("#btnPreviewProject").on("click", function() {	
	var url = activeProject.run_url;
	if(!url) {
		url = "/" + projectsPath + activeProject.id + "/";
	}	
	window.open(url, 'code_project_preview');
});

$("#btnProjectConfig").on("click", function() {
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
});

$("#btnExportZip").on("click", function() {
	window.location="/scripts/export_zip.php?path=" + activeProject.id + "/";
});

$("#btnExportAllZip").on("click", function() {
	var d = new Date();
	window.location="/scripts/export_zip.php?path=" + "&filename=Projects_"+d.toISOString().substring(0,10)+'.zip';
});


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
	if(e.which == 1) {
		if(file.type==='folder') {
			toggleFolder($(this));
		} else if(['jpg','png','pdf','gif','bmp'].indexOf(file.type)!=-1) {
			console.log("Open in new tab");
			window.open(projectsPath + activeProject.id + "/" + uri);
		} else {		
			console.log("Mime type text/* -> open in textarea");
			openFile(uri);
		}
	} else if(e.which==2) {
		alert("rightclick");
	}
	return false;
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

var fileList = document.getElementById("fileList");
fileList.addEventListener("drop", dropFile, false);
fileList.addEventListener("dragover", hoverFile, false);
fileList.addEventListener("dragleave", hoverFile, false);
	


function init() {
	pageTitle = document.title;
	console.log("Init " + pageTitle);	
	checkIfUserIsLoggedIn();	
}

function checkIfUserIsLoggedIn() {
	$.ajax({
		url:"/scripts/gatekeeper_get_current_user.php",
		success: function(user, status, jqXHR) {
			_USER=user;
			loginAccepted();
		},
		error: function(data, status, jqXHR) {
			console.log(data.responseText);
			$("#login").show();
		},
		dataType:"json"
	});
}

function checkAccess() {
	console.log(new Date().toTimeString().substr(0,5), "Access check");
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/scripts/gatekeeper_check_access.php");
	xhr.onload = function(e) {		
		if(xhr.status == 403) {
			location.reload();
		}
	}
	xhr.send();
}


function loginAccepted() {
	console.log("Login accepted");	
	console.log(_USER);
	$("#header").show();
	$("#username").html(_USER.username);
	
	//Access check every minute
	var checkAccessInterval = setInterval(checkAccess,60*1000);
	
	findProjects();
	initWriter();
	readHash(window.location.hash);	
	$(".door").addClass('open');
}

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
	var imgsrc = projectsPath + activeProject.id + "/" + uri;
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

/*
 * Get all projects from database
 * Async: false  AJAX request
*/
function findProjects() {
	console.groupCollapsed("Get projects");
	console.time("timing findProjects")
	var url = "/scripts/get_all_projects.php";
	console.log("Send ajax request to", url);
	$.ajax({
		url: url,
		success: function(data) {
			console.log("Incominig ajax response");
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
			console.log("%i projects found", data.length, data);
			$("#projects").html(projectsHTML.join(""));
			filterProjects();
		},
		async:false,
		dataType: "json"
	});
	console.timeEnd("timing findProjects") 
	console.groupEnd();
}

function openProject(id) {
	if(!projects) { 
		console.error("No projects loaded");
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

	//unloadFile();
	$("#choose_project").hide();
	$("#writer").show();
	$("#pageTitle").html(project.name);
	
	fixLayout();
	findFiles();
}

var openFile = function(uri) {
	setHash(activeProject.id + "/" + uri);
}

function loadFile(uri, forceLoadFromDisc) {		
	if(!files[uri]){
		console.warn("File not found: '" + uri + "'");
		return false;
	}
	
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
			
	
	var localStore = window.localStorage;
	var localSaved = localStore.getItem(activeProject.id +"/"+uri);
	selectInFileList(uri);
	if(!forceLoadFromDisc && localSaved) {
		activeFile = uri;
		codeMirror.setValue(localSaved);	
		codeMirror.setOption("mode", mode);
		$menuItem.children("div").fadeOutAndRemove();
		console.log("Loading '" + uri + "' from local storage. Display as '" + codeMirror.getOption("mode") + "'");
	} else {
		$.get("/scripts/load_file.php", {
			'project_id':activeProject.id,
			'uri':encodeURI(uri)
			}, function(data) {
				activeFile = uri;
				codeMirror.setValue(data);
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
	activeFile = null;
	codeMirror.setValue("");
}

function revertFile() {	
	if(confirm("Are you sure you want to revert your unsaved changes?")) {
		console.log("Revert file: '", activeFile, "'");
		loadFile(activeFile, true);		
	}
}

function saveFile() {
	codeMirror.save();
	var form = document.getElementById("writer");
	
	if(activeFile) {
		var $menuItem = $("li[data-uri='"+activeFile+"']");
		$menuItem.append("<img src='/images/ajax-loader.gif' class='file_spinner' />");
		console.log("Save file '"+ activeFile+"'...");
		
		var formData = new FormData(form);
		formData.append("uri", activeFile);
		formData.append("project_id", activeProject.id);
		
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "/scripts/save.php", true);
		
		xhr.send(formData);
		xhr.onload = function(e) {
			if(e.target.status===200) {
				fileNotChanged();
				console.log("File saved");
			} else {
				console.error("Error saving file", e);
			}
			$menuItem.children("img").fadeOutAndRemove();
		};		
	}
	else {	
		console.log("Save As...  this should not happen I think");
	}
}

function findFiles() {
	files = [];
	console.groupCollapsed("Load project files");
	console.log(activeProject);
	var path = "";
	console.log("Ajax: get all files in:", path);
	$.ajax({
		url: "/scripts/build_file_tree.php",
		data: {'project_id':activeProject.id},
		success: function(data) {
			console.log("Files found:", data);
			$('#fileList').html(print_folder(data, path));
			console.groupEnd();
		},
		async: false,
		dataType: "json"
	});
}

function reloadFileList() {

	//Save filelist state
	var openFolders = [];
	$.each($("#fileList li[data-type=folder] span.open"), function(i, open) {
		openFolders.push($(open).parent().data("uri"));
	});
	
	//Find files and build tree
	findFiles();
	
	//reopen all opened folders
	if(openFolders.length>0) {
		console.log("Reopen folders", openFolders);
		$.each(openFolders, function(i, elem) {		
			toggleFolder($("#fileList li[data-uri='"+elem+"']"));
		});
	}
	
	//reselect opened file
	selectInFileList(activeFile);
	
}


function print_folder(arr, path) {
	var localStore = window.localStorage;
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
	$("#fileList li").removeClass("selected");
	$('#fileList li[data-uri="'+uri+'"]').addClass("selected");
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
		console.log("uri:", uri);
	
		if(!activeProject || (activeProject && project_id!=activeProject.id)) {
			console.log("Open project", project_id);
			openProject(project_id);
		}
		
		if(uri) {
			if(uri=="new") {
				unloadFile();
			} else {			
				loadFile(uri);
			}
		} else if(!!files['index.php']) {
			console.log("no file selected, view index.php");
			loadFile('index.php');
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
	var localStore = window.localStorage;
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
	var localStore = window.localStorage;  
    localStore.removeItem(activeProject.id+"/"+activeFile);	
}

function numberOfUnsavedFiles() {
	return $("#fileList li.changed").length;
} 




function toggleFolder($this) {
	var $folderIcon = $this.children("span.fileIcon");
	if($folderIcon.hasClass("open")) {
		$folderIcon.removeClass("open");
		$this.children("ul").hide();
	} else {
		$folderIcon.addClass("open");
		$this.children("ul").show();
	}
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


var clone = (function(){ 
  return function (obj) { Clone.prototype=obj; return new Clone() };
  function Clone(){}
}());

jQuery.fn.fadeOutAndRemove = function(speed){
    $(this).fadeOut(speed,function(){
        $(this).remove();
    })
}
