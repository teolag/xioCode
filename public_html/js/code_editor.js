function CodeEditor(parentElement) {
	this.uri = null;
	this.elem = parentElement;
	
	var tpl = document.getElementById("tplCodeEditorHeader").content;	
	parentElement.appendChild(document.importNode(tpl, true));
	
	this.tabList = parentElement.querySelector(".tabBar");
	this.tabBar = new TabBar(this.tabList, this);
	
	
	this.toolList = parentElement.querySelector(".toolbar");
	this.toolList.addEventListener("click", toolbarClickHandler, false);
	
	var that = this;
	
	function toolbarClickHandler(e) {
		var li=e.target;
		while(li.parentElement!==that.toolList) {
			li = li.parentElement;
		}
		var action = li.dataset.action;
		switch(action) {
			case "save":
				console.log("Do save");
			break;
			
			default:
			console.warn("toolbar action not implemented:", action);
		
		}
	}
		
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


CodeEditor.prototype.clear = function() {
	var doc = CodeMirror.Doc("");
	this.editor.swapDoc(doc);
	this.tabList.innerHTML = "";
	this.uri = "";
	

}

CodeEditor.prototype.open = function(file) {
	if(file.doc) this.editor.swapDoc(file.doc);
			
	this.uri = file.uri;
	this.tabBar.add(file.uri);
	this.tabBar.select(file.uri);
};

