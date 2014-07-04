
var xioDocs = {};


function closeDoc(projectId, uri) {
	closeDocs(projectId, [uri]);
}



function closeDocs(projectId, uris) {
	var openedUris = Object.keys(xioDocs[projectId]);
	var lastIndex = openedUris.indexOf(activeFile);
	var changeActive=false;
	
	for(var i=0; i<uris.length; i++) {
		delete xioDocs[projectId][uris[i]];
		if(activeFile===uris[i]) changeActive=true;
	}
	openedUris = Object.keys(xioDocs[projectId]);


	if(openedUris.length===0) {
		setHash(projectId);
		setActiveFile(projectId, null);	
	} else if(changeActive) {
		if(lastIndex===openedUris.length) lastIndex--;
		var newUri = openedUris[lastIndex];
		openFile(newUri);
	}
	
}





function setActiveFile(projectId, uri) {
	activeFile = uri;
	updateCleanStatus(uri);
	if(uri===null) {
		console.debug("hide codeEditor");
		activeCodeEditor.editor.getWrapperElement().style.display="none";
		document.getElementById("btnPreviewFile").classList.add("disabled");
		FileList.deselectAll();
	} else {
		console.debug("show codeEditor");
		activeCodeEditor.editor.getWrapperElement().style.display="block";
		document.getElementById("btnPreviewFile").classList.remove("disabled");
		activeCodeEditor.editor.refresh();
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
