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
			var onDisc = file.state!==File.STATE_UNSAVED;
			var clean = file.doc.isClean() && onDisc;
			var loading = file.state === File.STATE_LOADING || file.state === File.STATE_SAVING;

			if(clean) {
				FileList.setFileAsClean(file.uri);
			} else {
				FileList.setFileAsDirty(file.uri);
			}

			file.tab.updateState();

			if(file === this.activeFile) {
				if(onDisc) {
					this.btnPreview.classList.remove("disabled");
				} else {
					this.btnPreview.classList.add("disabled");
				}

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
			var fileCount = Object.keys(projectFiles).length;
			if(fileCount>0) {
				var switchTo = null;
				for(var fileId in projectFiles) {
					if (projectFiles.hasOwnProperty(fileId)) {
						var file = projectFiles[fileId];
						this.tabBar.add(file);
						if(!switchTo) switchTo = file;
					}
				}
				if(switchTo) this.switchToFile(file);
			} else {
				console.log("Project has no files opened, HIDE!")
				this.btnSave.classList.add("disabled");
				this.btnPreview.classList.add("disabled");
				this.editor.setOption("readOnly", true);
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
			if(!file) return;
			if(file.state===File.STATE_UNSAVED || file.state===File.STATE_EMPTY) {
				this.saveFileAs(file, false);
			} else {
                this.editor.execCommand("removeTrailingSpaces");
				file.save(this.editor.getValue(), this.saveFileCallback.bind(this));
				this.updateFileStatus(file);
			}
		},

		saveFileCallback: function(file) {
			this.updateFileStatus(file);
			if(Preview.doRefreshOnSave()) {
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
					me.editor.execCommand("removeTrailingSpaces");
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
				this.calculateFileMode(file.uri);

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

		calculateFileMode: function(uri) {
			if(uri) {
				var mime = getMimeByUri(response.uri);
				this.editor.setOption("mode", mime);
			}
		},

		newFile: function() {
			var file = new File(this);
			file.blank(this.activeProjectId);
			this.tabBar.add(file);
			this.switchToFile(file);
		},


		switchToFile: function(file) {
			this.editor.swapDoc(file.doc);
			this.activeFile = file;
			this.tabBar.select(file.tab);
			this.updateFileStatus(file);
			this.editor.focus();
		},

		switchToNext: function() {
			var tabs = this.tabList.children;
			console.log("active tab", this.activeFile.tab);
			var switchToId = null;
			for(var i=0; i<tabs.length; i++) {
				var tab = tabs[i];
				var fileId = parseInt(tab.dataset.id);
				if(fileId===this.activeFile.id) {
					if(switchToId===null) {
						console.log("next", tabs[i+1], tabs[i]);
						switchToId=parseInt(tabs[i+1].dataset.id);
					}
					break;
				} else {
					switchToId = fileId;
				}
			}
			var file = File.getFileById(switchToId);
			this.switchToFile(file);
		},

		openFile: function(uri) {
			var file = File.getFileByUri(this.activeProjectId, uri);
			if(file) {
				this.editor.setOption("readOnly", false);
			} else {
				file = new File(this);
				file.load(this.activeProjectId, uri, this.openFileCallback.bind(this));
				this.tabBar.add(file);
			}

			this.switchToFile(file);
		},


		openFileCallback: function(file) {
			if(this.activeFile === file) {
				var old = this.editor.swapDoc(file.doc);
				this.editor.setOption("readOnly", false);
			}
			this.updateFileStatus(file);
		},


		closeFile: function(file) {
			this.tabBar.remove(file.tab);

			if(this.activeFile === file) {
				console.log("close active file", file);

				if(this.tabList.children.length===0) {
					console.log("last file closed, HIDE!!!");
					this.btnSave.classList.add("disabled");
					this.btnPreview.classList.add("disabled");
					this.clear();
					this.editor.setOption("readOnly", true);
				} else {
					this.switchToNext();
				}
			} else {
				console.log("close file", file);
			}
			this.editor.focus();
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
			case "save":
				this.saveFile();
			break;

			case "preview":
				var path = projectsURL + activeProject.id +"/"+ this.activeFile.uri;
				console.log("Preview:", path);

				if(Preview.isVisible()) {
					Preview.load(path);
				} else {
					window.open(path, 'code_file_preview');
				}
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