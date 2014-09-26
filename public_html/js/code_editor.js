(function() {

	var _ = self.CodeEditor = function(parentElement) {
		this.elem = parentElement;
		this.activeFile = null;
		this.activeProjectId = null;

		var tpl = document.getElementById("tplCodeEditorHeader").content;	
		parentElement.appendChild(document.importNode(tpl, true));

		this.tabList = parentElement.querySelector(".tabBar");
		this.tabBar = new TabBar(this.tabList, this);

		this.toolList = parentElement.querySelector(".toolbar");
		this.toolList.addEventListener("click", toolbarClickHandler.bind(this), false);
		this.btnSave = this.toolList.querySelector("li[data-action='save']");
		this.btnPreview = this.toolList.querySelector("li[data-action='preview']");
		this.btnNew = this.toolList.querySelector("li[data-action='new']");

		this.editor = new CodeMirror(parentElement, clone(codemirrorDefaults));
		this.editor.on("dragover", editorDragOver.bind(this));
		this.editor.on("drop", editorDrop.bind(this));
		this.editor.on("change", editorChange.bind(this));	
		this.editor.on("focus", editorFocus.bind(this));	
		
	};
		
	_.prototype = {	
	
		updateFileStatus: function(file) {
			var clean = file.doc.isClean() && file.state!==File.STATE_UNSAVED;
			var loading = file.state === File.STATE_LOADING || file.state === File.STATE_SAVING;
			
			if(clean) {
				file.tab.classList.remove("changed");
				FileList.setFileAsClean(file.uri);
			} else {
				file.tab.classList.add("changed");
				FileList.setFileAsDirty(file.uri);
			}
			
			if(loading) {
				file.tab.classList.add("loading");
			} else {
				file.tab.classList.remove("loading");
			}

			if(file === this.activeFile) {
				if(clean) {
					this.btnSave.classList.add("disabled");
				} else {
					this.btnSave.classList.remove("disabled");
				}
			}
		},
		
		
		setProjectId: function(pId) {
			if(this.activeProjectId === pId) return;
			
			this.activeProjectId = pId;
			this.clear();
			
			/*
			TODO!!! open file in only one codeEditor!!!
			*/
			
			var projectFiles = File.getProjectFiles(pId);
			for(var fileId in projectFiles) { 
				if (projectFiles.hasOwnProperty(fileId)) {
					var file = projectFiles[fileId];
					this.tabBar.add(file);
				}
			}
			
			
		},
		

		clear: function() {
			var doc = CodeMirror.Doc("");
			this.editor.swapDoc(doc);
			this.tabBar.clear();
			this.activeFile = null;
		},

		saveFile: function() {
			var file = this.activeFile;
			if(file.state===File.STATE_UNSAVED) {
				this.saveFileAs(file, false);				
			} else {
				file.save(this.editor.getValue(), this.saveFileCallback.bind(this));
				this.updateFileStatus(file);
			}
		},

		saveFileCallback: function(file) {
			this.updateFileStatus(file);
			if(Preview.doRefreshOnSave) {
				Preview.load(projectsURL + this.activeProjectId + "/" + file.uri);
				Preview.refresh();
			}
		},

		saveFileAs: function(file, overwrite) {
			console.log("Save As... ");
			var me = this;
			file.projectId = this.activeProjectId;
			XioPop.prompt("Save file as...", "Enter the filename", file.uri, function(newUri) {
				if(newUri) {					
					file.saveAs(newUri, me.editor.getValue(), false, me.saveFileAsCallback.bind(me));
					me.updateFileStatus(file);
				}
			});
		},

		saveFileAsCallback: function(file, response) {
			switch(response.status) {
				case STATUS_OK:
				console.log("file saved as ", file.uri);
				FileList.loadProjectFiles();
				this.updateFileStatus(file);
				this.tabBar.rename(file);
				break;

				case STATUS_FILE_COLLISION:
				var me = this;
				XioPop.confirm("File already exists", "Are you sure you want to overwrite "+response.uri+"?", function(answer) {
					if(answer) {
						file.saveAs(response.uri, me.editor.getValue(), true, me.saveFileAsCallback.bind(me));
						me.updateFileStatus(file);
					}
				});
				break;

				default:
				console.warn("handle callback", response);
			}
		},

		closeFile: function(file) {
			if(this.activeFile === file) {
				console.log("close active file", file);
				this.activeFile = null;
			} else {
				console.log("close file", file);
			}
			file.close();
		},
		
		newFile: function() {
			var file = new File();
			file.blank(this.activeProjectId);
			
			this.editor.swapDoc(file.doc);
			
			this.activeFile = file;
			this.tabBar.add(file);
			this.tabBar.select(file);
			this.updateFileStatus(file);
			this.editor.focus();
		},
		
		
		switchToFile: function(file) {
			this.editor.swapDoc(file.doc);
			this.activeFile = file;
			this.tabBar.select(file);
			this.updateFileStatus(file);
			this.editor.focus();
		},		
		
		openFile: function(uri) {
			var file = File.getFileByUri(this.activeProjectId, uri);
			if(file) {
				this.switchToFile(file);
			} else {
				file = new File();
				file.load(this.activeProjectId, uri, this.openFileCallback.bind(this));
				this.tabBar.add(file);
				this.editor.swapDoc(file.doc);
			}
			this.activeFile = file;
			this.tabBar.select(file);
			this.updateFileStatus(file);
			this.editor.focus();
		},
		

		openFileCallback: function(file) {
			if(this.activeFile === file) {
				var old = this.editor.swapDoc(file.doc);
			}

			this.tabBar.updateState(file);
			this.updateFileStatus(file);
		}
	};
	
	
	
	function toolbarClickHandler(e) {
		var li=e.target;
		if(li===this.toolList) return;
		while(li.parentElement!==this.toolList) {
			li = li.parentElement;
		}
		var action = li.dataset.action;
		switch(action) {
			case "new":
				this.newFile();
			break;

			case "save":
				this.saveFile();
			break;

			default:
			console.warn("toolbar action not implemented:", action);
		}
	}
	
	function editorDragOver(cm, e) {
		cm.setCursor(cm.coordsChar({left:e.x, top:e.y}));
		cm.focus();
	}

	function editorDrop(cm, e) {
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
	}

	function editorChange(cm, change) {
		if(this.activeFile) {
			this.updateFileStatus(this.activeFile);
		}
	}

	function editorFocus(cm, change) {
		XioCode.setActiveCodeEditor(this);
	}



}());