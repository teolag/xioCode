function TabBar(tabList, codeEditor) {
	this.tabList = tabList;
	this.tabList.addEventListener("click", clickHandler, false);

	this.codeEditor = codeEditor;

	var me = this;

	function clickHandler(e) {
		var li=e.target;
		while(li.nodeName!=="LI") {
			if(li===this.tabList) return;
			li = li.parentElement;
		}
		var id = li.dataset.id;
		var file = File.getFileById(id);

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


TabBar.prototype.clear = function() {
	this.tabList.innerHTML = "";
};


TabBar.prototype.rename = function(file) {
	var filename = file.tab.querySelector("span.filename");
	filename.textContent = file.filename
	filename.title = file.uri;
};

TabBar.prototype.add = function(file) {

	var template = document.getElementById('tplCodeEditorTab').content;

	var li = template.querySelector("li");
	li.dataset.id = file.id;

	var filename = template.querySelector(".filename");
	filename.title = file.uri;
	filename.textContent = file.filename;

	var fragment = document.importNode(template, true);
	this.tabList.appendChild(fragment);

	var tab = this.tabList.querySelector("li[data-id='"+file.id+"']");
	file.tab = tab;
	this.updateState(file);
};

TabBar.prototype.updateState = function(file) {
	var tab = file.tab;

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