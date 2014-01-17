var xioDocs = {};
var openedList = document.getElementById("openedList");

openedList.addEventListener("click", function(e) {
	var target=e.target;
	while(target.nodeName!=="LI") {
		if(target==openedList) return;
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




function redrawOpenedDocs() {	
	var html="";
	var oFiles = xioDocs[activeProject.id];
	console.log("oFiles", oFiles);
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
			filename.textContent = property;
			filename.classList.add("filename");
			
			var close = document.createElement("span");
			close.classList.add("el-icon-remove-sign", "close");
			
			li.appendChild(filename);
			li.appendChild(close);
					
			openedList.appendChild(li);
		}
	}
	
}

function closeDoc(projectId, uri) {
	var oFiles = xioDocs[projectId];
	delete oFiles[uri];
	redrawOpenedDocs();
	for(var oUri in oFiles);
	console.log("oUri",oUri);
	if(oUri && activeFile===oUri) {
		openFile(oUri);
	} else if(oUri===undefined) {
		console.log("Open empty");
		openFile();
	} 
}



function getOrCreateDoc(projectId, uri) {
	console.log("getOrCreateDoc", uri);
	if(xioDocs.hasOwnProperty(projectId) && xioDocs[projectId].hasOwnProperty(uri)) {
		var doc = xioDocs[projectId][uri];
		console.log("swap to doc", doc);
		codeMirror.swapDoc(doc);
		setActiveFile(uri);
		codeMirror.focus();
		redrawOpenedDocs();
		console.log("Doc", doc);
	} else {
		loadDoc(projectId, uri);	
	}
}

function loadDoc(projectId, uri) {		
	if(uri=="untitled") {
		docLoaded(projectId, uri, "");
		return;
	}
	
	var xhr = new XMLHttpRequest();
	xhr.open("get", "/scripts/load_file.php?project_id="+projectId+"&uri="+encodeURI(uri), true);
	console.log("Loading '" + uri + "' from disk.");
	
	xhr.onload = function(e) {
		docLoaded(projectId, uri, e.target.responseText);
	};
	
	xhr.send();
	
}

function docLoaded(projectId, uri, data) {
	var mode = getDocType(uri);
	var doc = CodeMirror.Doc(data, mode);
	var old = codeMirror.swapDoc(doc);
	if(!xioDocs.hasOwnProperty(projectId)) xioDocs[projectId] = {};
	xioDocs[projectId][uri] = doc;
	setActiveFile(uri);
	codeMirror.focus();
	redrawOpenedDocs();
}


function setActiveFile(uri) {
	var doc = xioDocs[activeProject.id][uri];
	activeFile = uri;
	console.log("Is file clean?", doc.isClean());
	if(doc.isClean()) {
		document.getElementById("btnSave").classList.add("disabled");
	} else {
		document.getElementById("btnSave").classList.remove("disabled");
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
		default: 					return "text/plain";
	}
}
