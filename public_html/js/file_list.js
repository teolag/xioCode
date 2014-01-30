var FileList = (function() {

	var projectId, activeFile;
	var files;
	var fileList, rightClickMenu;

	var init = function() {
		rightClickMenu = document.getElementById("fileListRightClickMenu");
		fileList = document.getElementById("fileList");
		fileList.addEventListener("drop", dropFile, false);
		fileList.addEventListener("dragover", hoverFile, false);
		fileList.addEventListener("dragleave", hoverFile, false);
		fileList.addEventListener("dragstart", dragFile, false);
		fileList.addEventListener("contextmenu", clickHandler, false);
		fileList.addEventListener("click", clickHandler, false);
	};


	var setProjectId = function(newProjectId) {
		if(!fileList) init();
	
		projectId = newProjectId;
		console.debug("FileList: ProjectId set to " + newProjectId);
		
		loadProjectFiles();
	};
	
	
	var setActiveFile = function(newActiveFile) {
		console.debug("FileList: ActiveFile set to " + newActiveFile);
		activeFile = newActiveFile;
		
		selectActiveFile();
	};
	
	

	var loadProjectFiles = function() {
		var xhr = new XMLHttpRequest();
		xhr.open("get", "/scripts/build_file_tree.php?project_id="+projectId, true);
		xhr.onload = function(e) {
			if(e.target.status===200) {

		  		var items;
				try{
					items = JSON.parse(e.target.responseText);
				} catch(err) {
					console.error("Error parsing json response", err);
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


				if(activeFile) selectActiveFile();
			} else {
				console.error("Error loading file tree", e);
			}
		};
		xhr.send();	
	};
	
	var printFolder = function(arr, path) {
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
			if(xioDocs.hasOwnProperty(projectId) && xioDocs[projectId].hasOwnProperty(uri) && !xioDocs[projectId][uri].isClean()) {
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
	
	var selectActiveFile = function() {
		if(!activeFile) return;
		if(!files) {
			console.log("Can not select", activeFile, "in fileList. Files not loaded");
			return;
		} 

		var items = fileList.querySelectorAll("li");
		for(var i = 0; i<items.length; i++) {
			items[i].classList.remove("selected");
		}
		if(activeFile==="untitled") return;
		console.log("Select: '" + activeFile + "' in fileList");
				
		var li = fileList.querySelector("li[data-uri='"+activeFile+"']");
		if(li) {
			li.classList.add("selected");

			//Open all parent folders
			var parent = li.parentElement;
			while(parent!=fileList) {
				if(parent.nodeName==="LI") {
					openFolder(parent);
				}		
				parent = parent.parentElement;
			}
		}
	};

	var clear = function() {
		if(!fileList) init();
		files = null;
		fileList.innerHTML = "Loading...";
	};
	
	
	var clickHandler = function(e) {		
		var target = e.target;
		while(target.nodeName !== "LI" && target !== fileList) {
			target = target.parentElement;
		}
		
		hideFileListRightClickMenu();
		
		if(e.button===0) {			
			if(target!==fileList) {
				var uri = target.dataset.uri;			
				var file = files[uri];
				
				console.log("Clicked on item", file);		
				if(uri === activeFile) {
					console.log("Already open");
					e.preventDefault();
				} else if(file.type==='folder') {
					toggleFolder(target);
				} else if(['jpg','png','pdf','gif','bmp'].indexOf(file.type)!=-1) {
					console.log("Open in new tab");
					window.open(projectsURL + projectId + "/" + uri);
				} else {		
					console.log("Mime type text/* -> open in textarea");
					openFile(uri);
				}
				e.stopPropagation();
			}			
		} else if(e.button===2) {		
			if(e.ctrlKey || e.altKey) return true;

			if(target===fileList) {
				showRootRightClickMenu("", e);
			} else {
				var uri = target.dataset.uri;
				target.classList.add("rightClicked");
				showFileListRightClickMenu(uri, e);
			}
			e.preventDefault();
		}
	};
	
	
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
	
	
	function uploadFiles(filesToUpload, folder, overwrite) {
		console.log("start upload:", filesToUpload, "to", folder);

		var uploadData = new FormData();			
		uploadData.append('path', folder);
		uploadData.append('project_id', activeProject.id);
		var fileUploadCount = 0;
	  	var xhr;

		for (var i=0; i<filesToUpload.length; ++i) {
		var file = filesToUpload[i];
			var checkData = new FormData();
			checkData.append('file', folder + file.name);
			checkData.append('project_id', activeProject.id);
			xhr = new XMLHttpRequest();
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
			xhr = new XMLHttpRequest();
			xhr.open('POST', "/scripts/file_upload.php", true);
			xhr.onload = function(e) {		
				if(xhr.status == 200) {
					FileList.loadProjectFiles();				
				} else {
					console.log("Error uploading file:");
					console.log(filesToUpload);
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
	

	

	var dragFile = function(e) {
		console.log("Drag start", e);
		
		var target = e.target;
		while(target.nodeName !== "LI") {
			target = target.parentElement;
			if(target === fileList) return;
		}
		
		var uri = target.dataset.uri;
		var file = files[uri];
		
		var mime = "css/text"; //$(this).data("mime");
		var filePath = location.origin + "/scripts/load_file.php?project_id=" + projectId + "&uri=" + encodeURI(uri);
		var fileDetails = mime + ":" + file.filename + ":" + filePath;
		console.log("fileDetails", fileDetails, e);
		e.dataTransfer.setData("DownloadURL", fileDetails);
		e.dataTransfer.setData("uri", uri);
		e.stopPropagation();
	};
	
	var dropFile = function(e) {
		hoverFile(e);
		console.log("drop in fileList", e);
		
		// Upload files
		var filesToUpload = e.target.files || e.dataTransfer.files;
		if(filesToUpload.length > 0) {
			uploadFiles(filesToUpload, folder, false);
			return;
		}
		
		// Move files
		var target = e.target;
		while(target!==fileList) {
			if(target.nodeName === "LI" && target.dataset.type === "folder") break;
			target = target.parentElement;
		}		
		
		if(target===fileList) {
			var folder = "";	
		} else {
			var folder = target.dataset.uri;
		}
		
		var fileDragged = e.dataTransfer.getData("uri");
		
		
		if(folder+files[fileDragged].filename === fileDragged) {
			console.log("drop to same place, abort");
		} else {
			var xhr = new XMLHttpRequest();
			var params = {
				'project_id': projectId,
				'uri': encodeURI(fileDragged),
				'toFolder': encodeURI(folder)+"/"	
			};

			xhr.open("get", "/scripts/move_file.php?"+toQueryString(params), true);
			xhr.onload = function(e) {
				FileList.loadProjectFiles();
			};
			xhr.send();
		}
		
	};

	var hoverFile = function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		var target = e.target;
		while(target!==fileList) {
			if(target.nodeName === "LI" && target.dataset.type === "folder") break;
			target = target.parentElement;
		}

		if(e.type == "dragover") {
			target.classList.add("dropTo");
		} else {
			target.classList.remove("dropTo");
		}
	};

	/*
	$("#fileList").on("mouseover", "li.imagePreview", function(e) {
		hoverTimer = setTimeout('showImagePreview("' + $(this).data("uri") + '")', 500);
	});

	$("#fileList").on("mousemove", "li.imagePreview", function(e) {
		$("#imagePreview").css({top:e.pageY, left:e.pageX+20});
	});

	$("#fileList").on("mouseout", "li.imagePreview", function() {
		clearTimeout(hoverTimer);
		$("#imagePreview").hide();
	});
	*/
	
	
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
						FileList.loadProjectFiles();
					});
				}
			break;

			case "newFile":
				var newFileName = prompt("Enter the filename");
				if(newFileName) {
					if(uri && files[uri].type=='folder') path+=filename + "/";
					$.post("/scripts/save.php",  {'project_id':activeProject.id, 'uri':encodeURI(path + newFileName)}, function() {
						FileList.loadProjectFiles();
						openFile(path + newFileName);
					});
				}			
			break;

			case "refresh":
				FileList.loadProjectFiles();
			break;

			case "delete":
		  var answer;
				if(files[uri].type=='folder') { 
					answer = confirm("Are you sure you want to delete the folder and all its content?\n"+uri+"?");
					if(answer) {
						$.get("/scripts/delete_folder.php",  {'project_id':activeProject.id, 'uri':encodeURI(uri)}, function() {
							FileList.loadProjectFiles();
						});
					}
				} else {
					answer = confirm("Are you sure you want to delete the file: '"+uri+"'?");
					if(answer) {
						$.get("/scripts/delete_file.php",  {'project_id':activeProject.id, 'uri':encodeURI(uri)}, function() {
							FileList.loadProjectFiles();
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
						FileList.loadProjectFiles();
					});
				}
			break;

			case "upload":
				XioPop.alert("upload file...", "not implemented yet ");
			break;

		}
		hideFileListRightClickMenu();
	});
	
	function showFileListRightClickMenu(uri, e) {
		rightClickMenu.classList.remove("hidden");
		var top = e.pageY;
		if(top+rightClickMenu.offsetHeight+10 > window.innerHeight) {
			top = window.innerHeight - rightClickMenu.offsetHeight - 10;
		}
		rightClickMenu.dataset.uri = uri;
		rightClickMenu.style.top = top + "px";
		rightClickMenu.style.left = e.pageX + "px";
	}

	function showRootRightClickMenu(uri, e) {
		showFileListRightClickMenu(uri, e);
		rightClickMenu.classList.add("root");
	}

	function hideFileListRightClickMenu() {
		rightClickMenu.classList.add("hidden");
		rightClickMenu.classList.remove("root");
		
		var elements = fileList.getElementsByClassName("rightClicked");
		for(var i=0; i<elements.length; i++) {
			elements[i].classList.remove("rightClicked");
		}		
	}



	return {
		loadProjectFiles: loadProjectFiles,
		setProjectId: setProjectId,
		setActiveFile: setActiveFile,
		clear: clear
	}

})();