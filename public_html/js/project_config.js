var ProjectConfig = (function() {
	var form, btnCancel, confTags, listTags,

	open = function(projectId) {
		XioPop.load("/scripts/project_config.php?project_id="+projectId, display);
	},

	display = function(e) {
		form = document.getElementById("frmProjectConfig");
		form.addEventListener("submit", onSubmit, false);
		btnCancel = document.getElementById("btnConfigCancel");
		btnCancel.addEventListener("click", close, false);
		confTags = document.getElementById("confTags");
		confTags.addEventListener("keypress", tagHandler, false);

		listTags = document.getElementById("listTags");
		listTags.addEventListener("click", tagHandler, false);
		displayTags();
	},

	onSubmit = function(e) {
		e.preventDefault();
		console.log("Save project configurations...");
		Ajax.postForm("/scripts/project_config.php?do=save", form, onSaveSuccess, onSaveError);
	},

	onSaveSuccess = function(xhr) {
		console.log("Project configurations saved!");
		close();
		ProjectList.loadProjects();
	},

	onSaveError = function(e) {
		console.err("Error saving config", e);
	},

	tagHandler = function(e) {
		if(e.type === "keypress" && e.keyCode === KEY_ENTER) {
			e.preventDefault();
			var text = e.target.value.trim();
			if(text) {
				console.log("add tag");
				var input = document.createElement("input");
				input.type="hidden";
				input.value=text;
				input.name="config[tags][]";
				form.appendChild(input);
				displayTags();
				e.target.value="";
			}
		} else if(e.type === "click" && e.target.nodeName==="LI") {
			console.log("input[value='"+e.target.textContent+"']");
			form.removeChild(form.querySelector("input[value='"+e.target.textContent+"']"));
			displayTags();
		}
	},

	displayTags = function() {
		var tags = form.querySelectorAll("input[name='config[tags][]']");
		listTags.innerHTML = "";
		if(tags) {
			console.log("taggar", tags);
			for(var i=0; i<tags.length; i++) {
				var tag = tags[i].value;
				var li = document.createElement("LI");
				li.textContent = tag;
				listTags.appendChild(li);
			}
		}
	}

	close = function(e) {
		XioPop.close();
	};



	return {
		open: open
	};
})();