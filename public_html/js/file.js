(function() {
	// PRIVATE VARIABLES
	var idNumber = 0;
	var files = {};
	var unsavedName = "untitled";
	var unsavedNumber = 1;

	// CONSTRUCTOR
	var _ = self.File = function() {
		this.id = idNumber++;
		this.uri = null;
		this.projectId = null;
		this.doc = null;
		this.state = _.STATE_EMPTY;
		this.filename = null;
		this.tab = null; //Set by tabBar...
		files[this.id] = this;
	}

	// STATIC VARIABLES
	_.STATE_EMPTY = 0;
	_.STATE_LOADING = 20;
	_.STATE_READY = 30;
	_.STATE_SAVING = 40;
	_.STATE_DIRTY = 50;
	_.STATE_UNSAVED = 60;


	// PUBLIC METHODS
	_.prototype = {

		blank: function(projectId) {
			this.filename = unsavedName;// + "_" + unsavedNumber++;
			this.projectId = projectId;
			this.uri = this.filename;
			this.doc = CodeMirror.Doc("", "");
		},

		load: function(projectId, uri, callback) {
			this.state = _.STATE_LOADING;
			this.uri = uri;
			this.filename = getFilename(uri);
			this.projectId = projectId;
			this.doc = CodeMirror.Doc("", "");

			var parameters = {action:"load", project_id:projectId,	uri:encodeURI(uri)};
			Ajax.getJSON("/scripts/file_handler.php", parameters, loadCallback.bind(this, callback));
		},

		save: function(code, callback) {
			this.state = _.STATE_SAVING;
			var formData = new FormData();
			formData.append("uri", this.uri);
			formData.append("project_id", this.projectId);
			formData.append("code", code);
			formData.append("action", "save");
			console.log("Save file '"+ this.uri+"'...");
			Ajax.post2JSON("/scripts/file_handler.php", formData, saveCallback.bind(this, callback));
		},

		saveAs: function(newUri, code, overwrite, callback) {
			this.state = _.STATE_SAVING;
			var formData = new FormData();
			formData.append("uri", newUri);
			formData.append("project_id", this.projectId);
			formData.append("code", code);
			formData.append("action", "saveAs");
			if(overwrite) formData.append("overwrite", true);

			Ajax.post2JSON("/scripts/file_handler.php", formData, saveAsCallback.bind(this, callback));
		},

		close: function() {
			this.tab.parentElement.removeChild(this.tab);
			this.doc.markClean();
			delete files[this.id];
		},

		rename: function(newUri) {
			this.uri = newUri;
			this.filename = getFilename(newUri);
			XioCode.getActiveCodeEditor().tabBar.rename(this);
		}
	};


	// STATIC METHODS
	_.getFileById = function(id) {
		if(files.hasOwnProperty(id)) {
			return files[id];
		}
	};

	_.getFileByUri = function(projectId, uri) {
		for(var fileId in files) {
			if (files.hasOwnProperty(fileId)) {
				var file = files[fileId];
				if(file.projectId === projectId && file.uri === uri) {
					return file;
				}
			}
		}
	};

	_.getProjectFiles = function(projectId) {
		var projectFiles = {};
		for(var fileId in files) {
			if (files.hasOwnProperty(fileId)) {
				var file = files[fileId];
				if(file.projectId === projectId) {
					projectFiles[fileId] = file;
				}
			}
		}
		return projectFiles;
	};

	_.countDirtyFiles = function() {
		var counter=0;
		for(var fileId in files) {
			if (files.hasOwnProperty(fileId)) {
				var file = files[fileId];
				if(!file.doc.isClean()) {
					counter++;
				}
			}
		}
		return counter;
	};

	// PRIVATE METHODS
	var getFilename = function(uri) {
		return uri.replace(/^.*[\\\/]/, '');
	};

	var saveCallback = function(callback, response) {
		if(response.status !== STATUS_OK) {
			console.warn("Error " + response.status + ": " + response.message);
			return;
		}

		this.doc.markClean();
		this.state = _.STATE_READY;
		if(callback) callback(this);
	};

	var saveAsCallback = function(callback, response) {
		if(response.status === STATUS_OK) {
			this.doc.markClean();
			this.state = _.STATE_READY;
			this.uri = response.uri;
			this.filename = getFilename(response.uri);
			this.projectId = response.projectId;
		}

		if(callback) callback(this, response);
	};

	var loadCallback = function(callback, response) {
		if(response.status !== STATUS_OK) {
			console.warn("Error " + response.status + ": " + response.message);
			return;
		}

		this.doc = CodeMirror.Doc(response.text, getMimeByUri(response.uri));
		this.state = _.STATE_READY;

		if(callback) callback(this);
	}

}())
