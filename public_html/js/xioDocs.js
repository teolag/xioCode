var xioDocs = {};
var openedList = document.getElementById("openedList");

openedList.addEventListener("click", function(e) {
	var target=e.target;
	while(target.nodeName!=="LI") {
		if(target==openedList) return;
		target = target.parentElement;
	}
	openFile(target.dataset.uri);
	console.log("Click on tab", target);
	
}, false);




function redrawOpenedDocs() {	
	var html="";
	var oFiles = xioDocs[activeProject.id];
	console.log("oFiles", oFiles);
			
	for (var property in oFiles) {
		if (oFiles.hasOwnProperty(property)) {
			var doc = oFiles[property];
			var active = activeFile===property;
			var classes = [];
			if(active) classes.push("selected");			
			if(!doc.isClean()) classes.push("changed");
					
			html+="<li data-uri='"+property+"' class='"+classes.join(" ")+"'>"+ property +"</li>";
		}
	}
	
	openedList.innerHTML=html;
	
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
	xhr.open("get", "/scripts/load_file.php?project_id="+activeProject.id+"&uri="+encodeURI(uri), true);
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
