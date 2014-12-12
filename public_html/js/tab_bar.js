function TabBar(tabList, codeEditor) {
	this.tabList = tabList;
	this.codeEditor = codeEditor;
	this.tabs = [];
}


TabBar.prototype.select = function(tabToSelect) {
	for(var i=0; i<this.tabs.length; i++) {
		var tab = this.tabs[i];
		if (tab === tabToSelect) {
			tab.select();
		} else {
			tab.deselect();
		}
	}
};


TabBar.prototype.add = function(file) {
	var tab = new Tab(this, file);
	this.tabs.push(tab);
	file.setTab(tab);
};


TabBar.prototype.remove = function(tab) {
	for(var i=0; i<this.tabs.length; i++) {
		if(this.tabs[i]===tab) {
			this.tabs.splice(i,1);
		}
	}
	tab.remove();
};


TabBar.prototype.clear = function() {
	this.tabList.innerHTML = "";
	this.tabs.length = 0;
};