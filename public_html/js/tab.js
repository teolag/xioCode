(function() {

	var filename;
	var template = document.getElementById('tplCodeEditorTab').content;


	var _ = self.Tab = function(parent, file) {

		this.parent = parent;
		this.file = file;
		this.file.tab = this;


		var li = template.querySelector("li");
		li.dataset.id = file.id;

		filename = template.querySelector(".filename");
		this.updateFromFile();

		var fragment = document.importNode(template, true);
		this.parent.tabList.appendChild(fragment);

		this.elem = this.parent.tabList.querySelector("li[data-id='"+file.id+"']");
		this.elem.addEventListener("click", this.clickHandler.bind(this), false);
		filename = this.elem.querySelector(".filename");

		this.updateState();

	}


	_.prototype = {

		remove: function() {
			this.parent.tabList.removeChild(this.elem);
		},

		select: function() {
			this.elem.classList.add("selected");
		},

		deselect: function() {
			this.elem.classList.remove("selected");
		},

		updateFromFile: function() {
			filename.textContent = this.file.filename
			filename.title = this.file.uri;
		},

		updateState: function() {
			var classes = this.elem.classList;
			classes.remove("loading");
			classes.remove("saving");


			if(this.file.doc.isClean()) {
				classes.remove("changed");
			} else {
				classes.add("changed");
			}

			switch(this.file.state) {
				case this.elem.FILE_STATE_LOADING:
				classes.add("loading");
				break;

				case this.elem.FILE_STATE_READY:
				break;

				case this.elem.FILE_STATE_SAVING:
				classes.add("saving");
				break;
			}
		},

		clickHandler: function(e) {
			console.log("tabClick", e);
			if(e.target.nodeName==="svg" || e.target.nodeName==="use" || e.which===2) {
				this.file.close();
				return;
			}
			this.parent.codeEditor.switchToFile(this.file);
		}


	};


}())