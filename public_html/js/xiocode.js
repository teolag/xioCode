var XioCode = (function(){
	var
	FILE_STATE_LOADING = 20,
	FILE_STATE_READY = 30,
	FILE_STATE_SAVING = 40,
	
	PANE_CODE_EDITOR = 10,
	PANE_TODO = 20,
	PANE_FILE_BROWSER = 30,
	
	
	
	openedFiles = {},
	activeProjectId = null,
	
	panes = [
		{
			name: "CodeEditor1",
			type:PANE_CODE_EDITOR, 
			codeEditor: new CodeEditor(document.getElementById("paneEditor1"))
		},
		{
			name: "CodeEditor2",
			type:PANE_CODE_EDITOR, 
			codeEditor: new CodeEditor(document.getElementById("paneEditor2"))
		}
	],

	activeCodeEditor = panes[0].codeEditor,
	
	
	getActiveProjectId = function() {
		return activeProjectId;
	},
	
	getActiveCodeEditor = function() {
		return activeCodeEditor;
	},
	
	
	closeFile = function(uri) {
		if(isFileOpened(uri)) {
			delete openedFiles[activeProjectId][uri];
			return true;
		}
	},
	
	openFile = function(uri) {
		if(isFileOpened(uri)) {
			var file = openedFiles[activeProjectId][uri];
			file.uri = uri;
			activeCodeEditor.open(file);
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
			loadDoc(uri);
		}
	},
	
	newFile = function() {
		var uri = UNSAVED_FILENAME+"22";
		var file = {
			"state": FILE_STATE_READY,
			"doc": CodeMirror.Doc("", getDocType()),
			"uri": uri
		};
		console.log("new file", activeProjectId, file.doc, file.doc.isClean());
		if(!openedFiles.hasOwnProperty(activeProjectId)) openedFiles[activeProjectId] = {};
		openedFiles[activeProjectId][uri] = file;
		activeCodeEditor.open(file);
		
	},
	
	loadDoc = function(uri) {
		if(uri===UNSAVED_FILENAME) {
			docLoaded(activeProjectId, uri, "");
			return;
		}

		var parameters = {
			action: "load",
			project_id: activeProjectId,
			uri: encodeURI(uri)
		};
		console.log("Loading '" + uri + "' from disk.");
		Ajax.getJSON("/scripts/file_handler.php", parameters, function(json) {
			if(json.status === STATUS_OK) {
				docLoaded(activeProjectId, uri, json.text);
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
			var old = activeCodeEditor.editor.swapDoc(doc);
		}
		openedFiles[projectId][uri].doc = doc;
		openedFiles[projectId][uri].state = FILE_STATE_READY;
	},
	

	
	openProject = function(projectId) {
		console.log("set active", projectId);
		activeProjectId = projectId;
	},
	
	isFileClean = function(uri) {
		if(isFileOpened(uri)) {
			var doc = openedFiles[activeProjectId][uri].doc;
			console.log("clean?", doc, doc.isClean());
			if(doc) {
				return doc.isClean();
			}
			return true;
		}
	},
	
	isFileOpened = function(uri) {
		return openedFiles.hasOwnProperty(activeProjectId) && openedFiles[activeProjectId].hasOwnProperty(uri);
	};
	
	
	return {
		getActiveProjectId: getActiveProjectId,
		getActiveCodeEditor: getActiveCodeEditor,
		isFileOpened: isFileOpened,
		isFileClean: isFileClean,
		newFile: newFile,
		openFile: openFile,
		closeFile: closeFile,
		openProject: openProject,
		panes: panes
	}
	
}());