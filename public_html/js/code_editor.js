function CodeEditor(parentElement) {
	this.uri = null;
	this.elem = parentElement;
	this.openedFiles = {};
	this.unsavedNumber=1;
	
	
	this.FILE_STATE_LOADING = 20;
	this.FILE_STATE_READY = 30;
	this.FILE_STATE_SAVING = 40;
	
	
	var tpl = document.getElementById("tplCodeEditorHeader").content;	
	parentElement.appendChild(document.importNode(tpl, true));
	
	this.tabList = parentElement.querySelector(".tabBar");
	this.tabBar = new TabBar(this.tabList, this);
	
	
	this.toolList = parentElement.querySelector(".toolbar");
	this.toolList.addEventListener("click", toolbarClickHandler, false);
	this.btnSave = this.toolList.querySelector("li[data-action='save']");
	this.btnPreview = this.toolList.querySelector("li[data-action='preview']");
	this.btnNew = this.toolList.querySelector("li[data-action='new']");
	
	var that = this;
	
	function toolbarClickHandler(e) {
		var li=e.target;
		if(li===that.toolList) return;
		while(li.parentElement!==that.toolList) {
			li = li.parentElement;
		}
		var action = li.dataset.action;
		switch(action) {
			case "new":
				that.newFile();
			break;
			
			case "save":
				that.save();
			break;
			
			default:
			console.warn("toolbar action not implemented:", action);
		
		}
	}
		
	this.editor = new CodeMirror(parentElement, clone(codemirrorDefaults));
		
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
		if(that.uri) {
			//console.log("CodeMirror Change", cm, change);
			that.updateCleanStatus(that.uri);
		}
	});	
	
	this.editor.on("focus", function(cm, change) {
		XioCode.setActiveCodeEditor(that);
	});	
}

CodeEditor.prototype.updateCleanStatus = function(uri) {
	console.log("updateCleanStatus");
	if(this.isFileOpened(uri)) {
		if(this.isFileClean(uri)) {
			this.tabBar.setTabAsClean(uri);
			FileList.setFileAsClean(uri);
			console.log("Clean!!");
		} else {
			this.tabBar.setTabAsDirty(uri);
			FileList.setFileAsDirty(uri);
			console.log("Dirty...");
		}
		
		if(uri === this.uri) {
			if(this.isFileClean(uri)) {
				this.btnSave.classList.add("disabled");
			} else {
				this.btnSave.classList.remove("disabled");
			}
		}
		
	}
};


CodeEditor.prototype.clear = function() {
	var doc = CodeMirror.Doc("");
	this.editor.swapDoc(doc);
	this.tabList.innerHTML = "";
	this.uri = "";
};



CodeEditor.prototype.save = function() {
	var me = this;
	if(this.uri.substr(0,UNSAVED_FILENAME.length)===UNSAVED_FILENAME) {
		console.log("Save As...  ");
		XioPop.prompt("Save file as...", "Enter the filename", "", function(answer) {
			if(answer) {
				me.saveAs(answer);
			}
		});
		return;
	} else if(!this.uri || this.isFileClean(this.uri)) {
		return;
	}
	
	var formData = new FormData();
	formData.append("uri", this.uri);
	formData.append("project_id", activeProject.id);
	formData.append("code", this.editor.getValue());
	formData.append("action", "save");

	console.log("Save file '"+ this.uri+"'...");

	Ajax.post2JSON("/scripts/file_handler.php", formData, this.saveSuccess.bind(this));

};

CodeEditor.prototype.saveSuccess = function(json) {
	switch(json.status) {
		case STATUS_OK:
		console.log("file saved as ", json.uri, json);
		
		if(this.isFileOpened(this.uri)) {
			var file = this.openedFiles[XioCode.getActiveProjectId()][this.uri];
			file.doc.markClean();
		}
		
		this.updateCleanStatus(json.uri);
		if(Preview.doRefreshOnSave) {
			//Preview.load(projectsURL + XioCode.getActiveProjectId() + "/" + json.uri);
			Preview.refresh();
		}
		break;
		
		case STATUS_FILE_COULD_NOT_UPDATE:
		XioPop.alert("Error saving file", "Could not write to file. Permission denied<br>" + json.uri + " " + json.owner + " " + json.group + " " + json.permissions);
		console.log(json);
		break;

		default:
		console.warn("handle callback", json);
	}
};



CodeEditor.prototype.saveAs = function(newFileName, overwrite) {
	var formData = new FormData();
	formData.append("uri", newFileName);
	formData.append("project_id", XioCode.getActiveProjectId());
	formData.append("code", this.editor.getValue());
	formData.append("action", "saveAs");
	if(overwrite) formData.append("overwrite", true);

	Ajax.post2JSON("/scripts/file_handler.php", formData, this.saveAsSuccess.bind(this));	
};

CodeEditor.prototype.saveAsSuccess = function(json) {
	switch(json.status) {
		case STATUS_OK:
		oldUri = this.uri;
		
		console.log("file saved as ", json.uri);
		FileList.loadProjectFiles();
		
		if(oldUri.substr(0,UNSAVED_FILENAME.length)===UNSAVED_FILENAME) {
			console.log("döp im den gamla", oldUri);
			this.tabBar.rename(oldUri, json.uri);
			this.openedFiles[XioCode.getActiveProjectId()][json.uri] = this.openedFiles[XioCode.getActiveProjectId()][oldUri];
			delete this.openedFiles[XioCode.getActiveProjectId()][oldUri];
			var file = this.openedFiles[XioCode.getActiveProjectId()][json.uri];
			file.doc.markClean();
			this.openFile(json.uri);
			
		}
		break;

		case STATUS_FILE_COLLISION:
		var me = this;
		XioPop.confirm("File already exists", "Are you sure you want to overwrite "+json.uri+"?", function(answer) {
			if(answer) {
				me.saveAs(newFileName, true);
			}
		});
		break;

		default:
		console.warn("handle callback", json);
	}
};




CodeEditor.prototype.closeFile = function(uri) {
	if(this.isFileOpened(uri)) {
		delete this.openedFiles[XioCode.getActiveProjectId()][uri];
		return true;
	}
};


CodeEditor.prototype.openFile = function(uri) {
	if(this.isFileOpened(uri)) {
		var file = this.openedFiles[XioCode.getActiveProjectId()][uri];
		file.uri = uri;
		if(file.doc) this.editor.swapDoc(file.doc);
			
		this.uri = uri;
		this.updateCleanStatus(uri);
		this.tabBar.select(uri);
		this.editor.focus();
	} else {
		var file = {
			"state": this.FILE_STATE_LOADING,
			"doc": null,
			"uri": uri
		};

		if(!this.openedFiles.hasOwnProperty(XioCode.getActiveProjectId())) this.openedFiles[XioCode.getActiveProjectId()] = {};
		this.openedFiles[XioCode.getActiveProjectId()][uri] = file;
		this.uri = uri;
		this.tabBar.add(file.uri);
		this.tabBar.select(file.uri);
		this.updateCleanStatus(uri);
		this.loadDoc(uri);
	}
};

CodeEditor.prototype.newFile = function() {
	var uri = UNSAVED_FILENAME+" "+this.unsavedNumber++;
	var file = {
		"state": this.FILE_STATE_READY,
		"doc": CodeMirror.Doc("", getDocType()),
		"uri": uri
	};
	console.log("new file", XioCode.getActiveProjectId(), file.doc, file.doc.isClean());
	if(!this.openedFiles.hasOwnProperty(XioCode.getActiveProjectId())) this.openedFiles[XioCode.getActiveProjectId()] = {};
	this.openedFiles[XioCode.getActiveProjectId()][uri] = file;
	this.tabBar.add(file.uri);
	this.openFile(uri);

};

CodeEditor.prototype.loadDoc = function(uri) {
	if(uri===UNSAVED_FILENAME) {
		this.docLoaded(XioCode.getActiveProjectId(), uri, "");
		return;
	}

	var parameters = {
		action: "load",
		project_id: XioCode.getActiveProjectId(),
		uri: encodeURI(uri)
	};
	console.log("Loading '" + uri + "' from disk.");
	var that = this;
	Ajax.getJSON("/scripts/file_handler.php", parameters, function(json) {
		if(json.status === STATUS_OK) {
			that.docLoaded(XioCode.getActiveProjectId(), uri, json.text);
		} else {
			console.warn("Error " + json.status + ": " + json.message);
		}
	});
};

CodeEditor.prototype.docLoaded = function(projectId, uri, data) {
	var mode = getDocType(uri);
	var doc = CodeMirror.Doc(data, mode);
	console.log("Doc loaded, treat as", mode);
	if(this.uri === uri) {
		var old = this.editor.swapDoc(doc);
	}
	this.openedFiles[projectId][uri].doc = doc;
	this.openedFiles[projectId][uri].state = this.FILE_STATE_READY;
	this.updateCleanStatus(uri);
};

CodeEditor.prototype.isFileOpened = function(uri) {
	return this.openedFiles.hasOwnProperty(XioCode.getActiveProjectId()) && this.openedFiles[XioCode.getActiveProjectId()].hasOwnProperty(uri);
};


CodeEditor.prototype.isFileClean = function(uri) {
	if(this.isFileOpened(uri)) {
		var doc = this.openedFiles[XioCode.getActiveProjectId()][uri].doc;
		if(doc) {
			return doc.isClean();
		}
		return true;
	}
};