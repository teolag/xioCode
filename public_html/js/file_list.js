var FileList = (function() {

	var projectId;
	var files;
	var fileList, rightClickMenu;
	var openedFolders = [];

	var init = function() {
		rightClickMenu = document.getElementById("fileListRightClickMenu");
		rightClickMenu.addEventListener("click", rightClickClickHandler, false);
		fileList = document.getElementById("fileList");
		fileList.addEventListener("drop", dropFile, false);
		fileList.addEventListener("dragover", hoverFile, false);
		fileList.addEventListener("dragleave", hoverFile, false);
		fileList.addEventListener("dragstart", dragFile, false);
		fileList.addEventListener("contextmenu", clickHandler, false);
		fileList.addEventListener("click", clickHandler, false);
		fileList.addEventListener("dblclick", clickHandler, false);
	};


	var setProjectId = function(newProjectId) {
		if(!fileList) init();

		projectId = newProjectId;
		console.debug("FileList: ProjectId set to " + newProjectId);

		loadProjectFiles();
	};


	var loadProjectFiles = function() {
		Ajax.getJSON("/scripts/get_project_files.php", {project_id: projectId},
			function(items) {
				files = {};

				fileList.innerHTML = printFolder(items, "");

				for(var i=0; i<openedFolders.length; i++) {
					var li = fileList.querySelector("li[data-uri='"+openedFolders[i]+"']");
					if(li) {
						openFolder(li);
					}
				}
			}, function(e) {
				if(e.status===403) {
					console.log("Access denied. You must login again to load the files");
					showLogin();
				}
				console.error("Error loading file tree", e);
			}
		);
	};

	var printFolder = function(arr, path) {
		var htm = [];
		htm.push("<ul>");
		for(var i=0; i<arr.length; i++) {
			var title = "";
			var item = arr[i];
			var imagePreview="";
			if(item.type==="jpg" || item.type==="jpeg" || item.type==="gif" || item.type==="png" || item.type==="bmp" || item.type==="tif" || item.type==="tiff") {
				imagePreview=" imagePreview";
				title += item.width + " x " + item.height + "\n";
			}
			var uri = item.path + item.filename;
			files[uri] = item;



			var changed = "";
            /*
			if(xioDocs.hasOwnProperty(projectId) && xioDocs[projectId].hasOwnProperty(uri) && xioDocs[projectId][uri] && !xioDocs[projectId][uri].isClean()) {
				changed = " changed ";
			}
            */

			var hidden  = (item.filename==='xiocode.properties' || item.filename==='xiocode.todo')? ' hidden' : '';
			title += item.size? toHumanReadableFileSize(item.size,true) : (item.leafs? item.leafs.length + " items": "empty");
			htm.push("<li draggable='true' class='"+imagePreview + changed + hidden+"' data-uri='" + uri + "' data-type='"+item.type+"' data-mime='"+item.mime+"' title='"+title+"'>");
			htm.push("<span class='icon-"+item.icon+"'>"+item.filename+"</span>");
			if(item.leafs) {
				htm.push(printFolder(item.leafs, item.path));
			}
			htm.push("</li>");
		}
		htm.push("</ul>");
		return htm.join("");
	}

	var selectFile = function(uri) {
		deselectAll();

		console.log("Select: '" + uri + "' in fileList");
		var li = fileList.querySelector("li[data-uri='"+uri+"']");
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

	var deselectAll = function(uri) {
		var items = fileList.querySelectorAll("li");
		for(var i = 0; i<items.length; i++) {
			items[i].classList.remove("selected");
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

				if(file.type==='folder') {
					toggleFolder(target);
				} else if(e.type==="dblclick") {
					console.log("dblclick");
					if(['zip','tar','rar','psd','xsl','doc','xslx','docx'].indexOf(file.type)!=-1) {
						console.log("Download file...");
						window.location.href = "/scripts/file_handler.php?action=download&project_id="+projectId+"&uri="+uri;
					} else if(['jpg','png','pdf','gif','bmp'].indexOf(file.type)!=-1) {
						console.log("Open in new tab");
						window.open(projectsURL + projectId + "/" + uri);
					} else {
						XioCode.getActiveCodeEditor().openFile(uri);
					}
				} else {
					selectFile(uri);
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
		var folderIcon = li.querySelector("span");
		if(folderIcon.classList.contains("icon-folder-open")) {
			closeFolder(li);
		} else {
			openFolder(li);
		}
	}
	function openFolder(li) {
		var uri = li.dataset.uri;
		var index = openedFolders.indexOf(uri);
		if (index === -1) {
			openedFolders.push(uri);
		}

		var folderIcon = li.querySelector("span");
		var folderList = li.querySelector("ul");
		folderIcon.classList.add("icon-folder-open");
		folderIcon.classList.remove("icon-folder");
		folderList.style.display="block";
	}
	function closeFolder(li) {
		var uri = li.dataset.uri;
		var index = openedFolders.indexOf(uri);
		if (index > -1) {
			openedFolders.splice(index, 1);
		}

		var folderIcon = li.querySelector("span");
		var folderList = li.querySelector("ul");
		folderIcon.classList.remove("icon-folder-open");
		folderIcon.classList.add("icon-folder");
		folderList.style.display="none";
	}


	var showSpinner = function(uri) {
		var li = fileList.querySelector("li[data-uri='"+uri+"']");
		if(li) {
			var span = document.createElement("span");
			span.classList.add("spinner", "icon-spinner");
			li.appendChild(span);
		}
	};
	var hideSpinner = function(uri) {
		var spinner = fileList.querySelector("li[data-uri='"+uri+"'] span.spinner");
		if(spinner) spinner.parentElement.removeChild(spinner);
	};



	var setFileAsClean = function(uri) {
		var li = fileList.querySelector("li[data-uri='"+uri+"']");
		if(li) li.classList.remove("changed");
	};
	var setFileAsDirty = function(uri) {
		var li = fileList.querySelector("li[data-uri='"+uri+"']");
		if(li) li.classList.add("changed");
	};


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
				if(xhr.status === 200) {
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
		var target = e.target;
		while(target.nodeName !== "LI") {
			target = target.parentElement;
			if(target === fileList) return;
		}

		var uri = target.dataset.uri;
		var file = files[uri];

		var mime = "css/text"; //target.dataset.mime;
		var filePath = location.origin + "/scripts/file_handler.php?action=load_raw&project_id=" + projectId + "&uri=" + encodeURI(uri);
		var fileDetails = mime + ":" + file.filename + ":" + filePath;
		e.dataTransfer.setData("DownloadURL", fileDetails);
		e.dataTransfer.setData("uri", uri);
		e.stopPropagation();
	};

	var dropFile = function(e) {
		hoverFile(e);

		var target = e.target;
		while(target!==fileList) {
			if(target.nodeName === "LI" && target.dataset.type === "folder") break;
			target = target.parentElement;
		}

		if(target===fileList) {
			var folder = "";
		} else {
			var folder = target.dataset.uri+"/";
		}

		var fileDragged = e.dataTransfer.getData("uri");

		if(fileDragged) {
			// Move files
			var newUri = folder+files[fileDragged].filename;
			if(newUri === fileDragged) {
				console.log("drop to same place, abort");
			} else {
				Ajax.getJSON("/scripts/file_handler.php", {'action':'rename', 'project_id': projectId, 'uri': encodeURI(fileDragged), 'new_uri': encodeURI(newUri)},
					function(e) {
						FileList.loadProjectFiles();
					}
				);
			}
		} else {
			// Upload files
			var filesToUpload = e.target.files || e.dataTransfer.files;
			console.log("upload files:", filesToUpload);
			if(filesToUpload.length > 0) {
				uploadFiles(filesToUpload, folder, false);
				return;
			}
		}

	};

	var hoverFile = function(e) {
		e.preventDefault();

		var target = e.target;
		while(target!==fileList) {
			if(target.nodeName === "LI" && target.dataset.type === "folder") break;
			target = target.parentElement;
		}

		if(e.type === "dragover") {
			target.classList.add("dropTo");
		} else {
			target.classList.remove("dropTo");
		}
	};



	var rightClickClickHandler = function(e) {
		var target=e.target;
		var uri = rightClickMenu.dataset.uri;
		var path = (uri)? files[uri].path : "";
		var filename = (uri)? files[uri].filename : "";
		var isFolder = (uri)? files[uri].type==='folder' : false;
		switch(target.dataset.do) {

			case "newFolder":
			XioPop.prompt("New folder", "Enter the name of the folder", "", function(folderName) {
				if(folderName) {
					if(isFolder) path+=filename + "/";
					Ajax.get("/scripts/create_folder.php", {'project_id':projectId, 'uri':encodeURI(path + folderName)}, function() {
						FileList.loadProjectFiles();
					});
				}
			});
			break;

			case "newFile":
			if(isFolder) path+=filename + "/";
			createNewFile(path);
			break;

			case "saveAs":
			XioPop.prompt("Save as", "Enter the new name of the file/folder", filename, function(newName) {
				if(newName) {
					saveFileAs(newName, false);
				}
			});
			break;

			case "refresh":
			FileList.loadProjectFiles();
			break;

			case "delete":
			if(isFolder) {
				var title = "Delete folder";
				var question = "Are you sure you want to delete the folder '"+uri+"' and all of its content?";
			} else {
				var title = "Delete file";
				var question = "Are you sure you want to delete the file: '"+uri+"'?";
			}
			XioPop.confirm(title, question, function(answer) {
				if(answer) {
					Ajax.getJSON("/scripts/file_handler.php",  {'action':'delete', 'project_id':activeProject.id, 'uri':encodeURI(uri)}, function(json) {
						FileList.loadProjectFiles();

						for(var i=0; i<XioCode.getPanes().length; i++) {
							var pane = XioCode.getPanes()[i];
							if(pane.type === 10) {
								var file = File.getFileByUri(projectId, json.uri);
								if(file) file.close();
							}
						}

						/*
						var openedUris = Object.keys(xioDocs[activeProject.id]);
						var docsToClose = [];
						for(var i=0; i<openedUris.length; i++) {
							var openUri = openedUris[i];
							if(openUri===json.uri || openUri.substr(0,json.uri.length+1)===json.uri+"/") {
								docsToClose.push(openUri);
							}
						}
						closeDocs(activeProject.id, docsToClose);
						*/
					});
				}
			});
			break;

			case "rename":
			XioPop.prompt("Rename file", "Enter the new name of the file/folder", filename, function(newName) {
				if(newName) {
					renameFile(uri, path+newName);
				}
			});
			break;

			case "export":
			window.location.href = "/scripts/file_handler.php?action=download&project_id="+projectId+"&uri="+uri;
			break;

			case "upload":
			XioPop.alert("upload file...", "not implemented yet ");
			break;

		}
		hideFileListRightClickMenu();
	};


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

	var getFiles = function() {
		return files;
	}

	var hide = function() {
		fileList.style.display="none";
	}
	var show = function() {
		fileList.style.display="block";
	}




	return {
		loadProjectFiles: loadProjectFiles,
		setProjectId: setProjectId,
		clear: clear,
		showSpinner: showSpinner,
		hideSpinner: hideSpinner,
		getFiles: getFiles,
		setFileAsClean: setFileAsClean,
		setFileAsDirty: setFileAsDirty,
		hide: hide,
		show: show,
		selectFile: selectFile,
		deselectAll: deselectAll
	}

})();