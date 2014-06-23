var XioCode = (function(){
	
	var openedFiles = {},
	activeProjectId = null,
	activeCodeEditor = new CodeEditor(document.getElementById("xioDoc")),
	
	FILE_STATE_LOADING = 20,
	FILE_STATE_READY = 30,
	FILE_STATE_SAVING = 40,
	
	
	openFile = function(uri) {
		if(isFileOpened(uri)) {
			var file = openedFiles[activeProjectId][uri];
			file.uri = uri;
			activeCodeEditor.open(file);
			this.uri = uri;
			activeCodeEditor.editor.focus();
		} else {
			var file = {
				"state": FILE_STATE_LOADING,
				"doc": null,
				"uri": uri
			};		
		
			if(!openedFiles.hasOwnProperty(activeProjectId)) openedFiles[activeProjectId] = {};
			openedFiles[activeProjectId][uri] = file;
			activeCodeEditor.open(file);
			loadDoc(activeProjectId, uri);
		}
	},
	
	loadDoc = function(projectId, uri) {
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
				console.warn("Error " + json.status + ": " + json.message);
			}
		});
	},

	docLoaded = function(projectId, uri, data) {
		var mode = getDocType(uri);
		var doc = CodeMirror.Doc(data, mode);
		console.log("Doc loaded, treat as", mode);
		if(activeFile === uri) {
			var old = XioCode.activeCodeEditor.editor.swapDoc(doc);
		}
		openedFiles[projectId][uri].doc = doc;
	},

	
	openProject = function(projectId) {
		activeProjectId = projectId;
	},
	
	
	isFileOpened = function(uri) {
		return openedFiles.hasOwnProperty(activeProjectId) && openedFiles[activeProjectId].hasOwnProperty(uri);
	};
	
	
	return {
		isFileOpened: isFileOpened,
		openFile: openFile,
		openProject: openProject,
		activeCodeEditor: activeCodeEditor
	}
	
}());



function CodeEditor(parentElement) {
	this.uri = null;

	
	this.tabBar = new TabBar(parentElement);	
	this.editor = new CodeMirror(parentElement, codemirrorDefaults);
	
	this.editor.on("dragover", function(cm, e) {
		cm.setCursor(cm.coordsChar({left:e.x, top:e.y}));
		cm.focus();
	});
	
	this.editor.on("drop", function(cm, e) {
		var uri = e.dataTransfer.getData("uri");
		if(uri) {
			var replace = uri;
			switch(true) {
				case uri.match(/css$/)!==null:
				replace = '<link rel="stylesheet" href="'+uri+'" type="text/css" />';
				break;

				case uri.match(/js$/)!==null:
				replace = '<script src="'+uri+'"></script>';
				break;

				case uri.match(/php$/)!==null:
				replace = 'require "'+uri+'";';
				break;
			}
			console.log("Drop on cm", uri);
			cm.replaceSelection(replace);
			e.preventDefault();
		}
	});

	this.editor.on("change", function(cm, change) {
		if(activeFile) {
			//console.log("CodeMirror Change", cm, change);
			updateCleanStatus(activeFile);
		}
	});
	
}


CodeEditor.prototype.open = function(file) {
	if(file.doc) this.editor.swapDoc(file.doc);
			

	this.tabBar.add(file.uri);
	this.tabBar.select(file.uri);
};

