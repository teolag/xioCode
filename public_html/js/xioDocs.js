var xioDocs = {};



function getOrCreateDoc(uri) {
	console.log("getOrCreateDoc", uri);
	if(xioDocs.hasOwnProperty(uri)) {
		var doc = xioDocs[uri];
		console.log("swap to doc", doc);
		activeFile = uri;
		codeMirror.swapDoc(doc);
		codeMirror.focus();
	} else {
		loadDoc(uri);	
	}
}

function loadDoc(uri, forceLoadFromDisc) {		
	var localSaved = localStore.getItem(activeProject.id +"/"+uri);
	if(!forceLoadFromDisc && localSaved) {
		docLoaded(uri, localSaved);
		fileChanged(uri);
		console.log("Loading '" + uri + "' from local storage. Display as '" + codeMirror.getOption("mode") + "'");
	} else {
		var xhr = new XMLHttpRequest();
		xhr.open("get", "/scripts/load_file.php?project_id="+activeProject.id+"&uri="+encodeURI(uri), true);
		console.log("Loading '" + uri + "' from disk.");
		
		xhr.onload = function(e) {
			fileNotChanged(uri);
			docLoaded(uri, e.target.responseText);
		};
		
		xhr.send();
	}
}

function docLoaded(uri, data) {
	var mode = getDocType(uri);
	var doc = CodeMirror.Doc(data, mode);
	var old = codeMirror.swapDoc(doc);
	codeMirror.focus();
	xioDocs[uri] = doc;
	activeFile = uri;
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
