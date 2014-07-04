function TabBar(tabList, codeEditor) {
	this.tabList = tabList;
	this.tabList.addEventListener("click", clickHandler, false);
	
	this.codeEditor = codeEditor;
	
	console.log("init tabbar", tabList);
	
	this.tabs = {};
	
	var that = this;
	
	function clickHandler(e) {
		var li=e.target;
		while(li.nodeName!=="LI") {
			if(li===this.tabList) return;
			li = li.parentElement;
		}
		var uri = li.dataset.uri;
		
		console.log("Click on tab", li);

		if(e.target.classList.contains("close") || e.which===2) {

			console.log("Close tab", li);
			if(!XioCode.isFileClean(uri)) {
				XioPop.confirm("Unsaved file", "This file has unsaved data, close anyway?", function(answer) {
					if(answer) that.close(uri);
				});
			} else {
				that.close(uri);
			}
			return;
		}

		openFile(uri);
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




TabBar.prototype.closeTabs = function(uris) {
		for(var i=0; i<uris.length; i++) {
		
		}
};


TabBar.prototype.close = function(uri) {
	if(XioCode.closeFile(uri)) {
		var tab = this.tabs[uri].tab;
		this.tabList.removeChild(tab);
		
		
		var openedUris = Object.keys(this.tabs);
		console.log("Opened", openedUris, uri);
		
		var lastIndex = openedUris.indexOf(this.codeEditor.uri);
		var changeActive=false;

		console.log("muuuuuuuu", this.codeEditor.uri, uri);
		if(this.codeEditor.uri===uri) changeActive=true;
		delete this.tabs[uri];
		openedUris = Object.keys(this.tabs);

		console.log("change active", changeActive, openedUris, lastIndex);

		
		if(openedUris.length===0) {
			console.log("all tabs closed");
			setHash(XioCode.getActiveProjectId());
		} else if(changeActive) {
			if(lastIndex===openedUris.length) lastIndex--;
			var newUri = openedUris[lastIndex];
			openFile(newUri);
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