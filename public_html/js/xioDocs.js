var xioDocs = {};
var openedList = document.getElementById("openedList");

openedList.addEventListener("click", function(e) {
	var target=e.target;
	while(target.nodeName!=="LI") {
		if(target===openedList) return;
		target = target.parentElement;
	}
	console.log("Click on tab", target, e.target, e);

	if(e.target.classList.contains("close") || e.which===2) {

		console.log("Close tab", target);
		var doc = xioDocs[activeProject.id][target.dataset.uri];
		if(!doc.isClean()) {
			XioPop.confirm("Unsaved file", "This file has unsaved data, close anyway?", function(answer) {
				if(answer) closeDoc(activeProject.id, target.dataset.uri);;
			});
		} else {
			closeDoc(activeProject.id, target.dataset.uri);
		}
		return;
	}

	openFile(target.dataset.uri);

}, false);




function redrawOpenedDocs(projectId) {
	var html="";
	var oFiles = xioDocs[projectId];
	openedList.innerHTML="";
	
	for (var property in oFiles) {
		if (oFiles.hasOwnProperty(property)) {
			var doc = oFiles[property];
			var active = activeFile===property;
			var classes = [];

			var li = document.createElement("LI");
			li.dataset.uri=property;

			if(active) li.classList.add("selected");
			if(!doc.isClean()) li.classList.add("changed");

			var filename = document.createElement("span");
			filename.textContent = property.replace(/^.*[\\\/]/, '');
			filename.title = property;
			filename.classList.add("filename");

			var close = document.createElement("span");
			close.classList.add("icon-close", "close");

			li.appendChild(filename);
			li.appendChild(close);

			openedList.appendChild(li);
		}
	}

}

function closeDoc(projectId, uri) {
	var oFiles = xioDocs[projectId];
	delete oFiles[uri];
	redrawOpenedDocs(projectId);
	for(var oUri in oFiles);
	console.log("oUri",oUri);
	if(oUri && activeFile!==oUri) {
		openFile(oUri);
	} else if(oUri===undefined) {
		console.log("All docs closed");
		setHash(projectId);
		setActiveFile(projectId, null);
	}
}



function getOrCreateDoc(projectId, uri) {
	if(xioDocs.hasOwnProperty(projectId) && xioDocs[projectId].hasOwnProperty(uri)) {
		var doc = xioDocs[projectId][uri];
		codeMirror.swapDoc(doc);
		setActiveFile(projectId, uri);
		codeMirror.focus();
		redrawOpenedDocs(projectId);
	} else {
		loadDoc(projectId, uri);
	}
}

function loadDoc(projectId, uri) {
	if(uri===UNSAVED_FILENAME) {
		docLoaded(projectId, uri, "");
		return;
	}
	
	var parameters = {
		action: "load",
		project_id: projectId,
		uri: encodeURI(uri)
	};
	console.log("Loading '" + uri + "' from disk.");
	Ajax.getJSON("/scripts/file_handler.php", parameters, function(json) {
		if(json.status === STATUS_OK) {
			docLoaded(projectId, uri, json.text);
		} else {
			console.error("Error: " + json.status + " " + json.message);
		}
	});
}

function docLoaded(projectId, uri, data) {
	var mode = getDocType(uri);
	var doc = CodeMirror.Doc(data, mode);
	console.log("Doc loaded, treat as", mode);
	var old = codeMirror.swapDoc(doc);
	if(!xioDocs.hasOwnProperty(projectId)) xioDocs[projectId] = {};
	xioDocs[projectId][uri] = doc;
	codeMirror.focus();
	setActiveFile(projectId, uri);
	redrawOpenedDocs(projectId);
}


function setActiveFile(projectId, uri) {
	activeFile = uri;
	updateCleanStatus(uri);
	if(uri===null) {
		console.debug("hide codeMirror");
		codeMirror.getWrapperElement().style.display="none";
		document.getElementById("btnPreviewFile").classList.add("disabled");
		FileList.deselectAll();
	} else {
		console.debug("show codeMirror");
		codeMirror.getWrapperElement().style.display="block";
		document.getElementById("btnPreviewFile").classList.remove("disabled");
		codeMirror.refresh();
		var doc = xioDocs[projectId][uri];
	}
}






function getDocType(uri) {
	var re = /(?:\.([^.]+))?$/;
	var ext = re.exec(uri);

	switch(ext[1]) {
		case "php": 				return "application/x-httpd-php"; 	break;
		case "js": 					return "text/javascript"; 			break;
		case "html": case "htm":	return "text/html"; 				break;
		case "css": 				return "text/css"; 					break;
		case "xml": case "svg": 	return "application/xml"; 			break;
		case "sql": 				return "text/x-mysql";	 			break;
		default: 					return "text/plain";
	}
}
