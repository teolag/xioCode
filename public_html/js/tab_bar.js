function TabBar(tabList, codeEditor) {
	this.tabList = tabList;
	this.tabList.addEventListener("click", clickHandler, false);
	
	this.codeEditor = codeEditor;
	
	console.log("init tabbar", tabList);
	
	this.tabs = {};
	
	var me = this;
	
	function clickHandler(e) {
		var li=e.target;
		while(li.nodeName!=="LI") {
			if(li===this.tabList) return;
			li = li.parentElement;
		}
		var id = li.dataset.id;
		var file = File.getFileById(id);
		
		console.log("Click on tab", li, file);

		if(e.target.classList.contains("close") || e.which===2) {
			me.codeEditor.closeFile(file);
			return;
		}

		me.codeEditor.switchToFile(file);
	}
}


TabBar.prototype.select = function(file) {
	var tabs = this.tabList.children;

	for(var i=0; i<tabs.length; i++) {
		var tab = tabs[i];
		if (tab === file.tab) {
			tab.classList.add("selected");
		} else {
			tab.classList.remove("selected");
		}
	}
};



TabBar.prototype.setTabAsDirty = function(tab) {
	tab.classList.add("changed");
}

TabBar.prototype.setTabAsClean = function(tab) {
	tab.classList.remove("changed");
}


TabBar.prototype.closeTabs = function(uris) {
		console.log("TODO!  fix this");
		for(var i=0; i<uris.length; i++) {
		
		}
};


/*
TabBar.prototype.close = function(uri) {
	if(this.codeEditor.closeFile(uri)) {
		var tab = this.tabs[uri].tab;
		this.tabList.removeChild(tab);
		
		var openedUris = Object.keys(this.tabs);
		
		var lastIndex = openedUris.indexOf(this.codeEditor.uri);
		var changeActive=false;

		if(this.codeEditor.uri===uri) changeActive=true;
		delete this.tabs[uri];
		openedUris = Object.keys(this.tabs);
		
		if(openedUris.length===0) {
			this.codeEditor.newFile();		
		} else if(changeActive) {
			if(lastIndex===openedUris.length) lastIndex--;
			var newUri = openedUris[lastIndex];
			this.codeEditor.openFile(newUri);
		}		
	}
};
*/

TabBar.prototype.rename = function(file, newUri) {
	var tab = this.tabList.querySelector("li[data-id='"+file.id+"']");
	var filename = tab.querySelector("span.filename");
	filename.textContent = file.filename
	filename.title = file.uri;	
};

TabBar.prototype.add = function(file) {
	if(this.tabs.hasOwnProperty(file.uri)) return;
	
	var tab = document.createElement("LI");
	tab.dataset.id = file.id;
	this.tabList.appendChild(tab);

	console.log("add tab", file.uri);
	var filename = document.createElement("span");
	filename.textContent = file.filename;
	filename.title = file.uri;
	filename.classList.add("filename");

	var close = document.createElement("span");
	close.classList.add("icon-close", "close");

	tab.appendChild(filename);
	tab.appendChild(close);
	

	this.tabs[file.uri] = {
		"tab" : tab,
		"pos" : Object.keys(this.tabs).length
	};
	
	this.updateState(file);
	
	return tab;
};

TabBar.prototype.updateState = function(file) {
	console.log("update tab state", file);
	var tab = this.tabs[file.uri].tab;
	
	tab.classList.remove("loading");
	tab.classList.remove("saving");
	tab.classList.remove("changed");
	
	switch(file.state) {
		case this.codeEditor.FILE_STATE_LOADING:
		tab.classList.add("loading");
		break;
		
		case this.codeEditor.FILE_STATE_READY:
		break;
		
		case this.codeEditor.FILE_STATE_SAVING:
		tab.classList.add("saving");
		break;
		
		case this.codeEditor.FILE_STATE_UNSAVED:
		tab.classList.add("changed");
		break;
	}
	

};