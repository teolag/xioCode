function TabBar(parentElement) {
	this.tabList = document.createElement("OL");
	this.tabList.classList.add("tabBar");
	this.tabList.addEventListener("click", clickHandler, false);
	parentElement.appendChild(this.tabList);
	this.tabs = {};
	
	function clickHandler(e) {
		var target=e.target;
		while(target.nodeName!=="LI") {
			if(target===openedList) return;
			target = target.parentElement;
		}
		console.log("Click on tab", target, e.target, e);

		if(e.target.classList.contains("close") || e.which===2) {

			console.log("Close tab", target);
			var doc = xioDocs[activeProject.id][target.dataset.uri];
			if(doc && !doc.isClean()) {
				XioPop.confirm("Unsaved file", "This file has unsaved data, close anyway?", function(answer) {
					if(answer) closeDoc(activeProject.id, target.dataset.uri);
				});
			} else {
				closeDoc(activeProject.id, target.dataset.uri);
			}
			return;
		}

		openFile(target.dataset.uri);
	}
}


TabBar.prototype.select = function(uri) {
	for(var tabUri in this.tabs) {
		console.log(uri, tabUri);
		if (this.tabs.hasOwnProperty(tabUri)) {
			var tab = this.tabs[tabUri].tab;
			if(tabUri===uri) {
				tab.classList.add("selected");
			} else {
				tab.classList.remove("selected");
			}
		}
	}
};



TabBar.prototype.add = function(uri) {
	if(this.tabs.hasOwnProperty(uri)) return;
	
	var tab = document.createElement("LI");
	tab.dataset.uri = uri;
	this.tabList.appendChild(tab);

	var filename = document.createElement("span");
	filename.textContent = uri.replace(/^.*[\\\/]/, '');
	filename.title = uri;
	filename.classList.add("filename");

	var close = document.createElement("span");
	close.classList.add("icon-close", "close");

	tab.appendChild(filename);
	tab.appendChild(close);

	this.tabs[uri] = {
		"tab" : tab,
		"pos" : Object.keys(this.tabs).length
	};
};










var xioDocs = {};
var openedList = document.getElementById("openedList");

openedList.addEventListener("click", function(e) {
	

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
			if(!doc) li.classList.add("loading");
			else if(!doc.isClean()) li.classList.add("changed");

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
	redrawOpenedDocs(projectId);
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
