var XioCode = (function(){
	var
	FILE_STATE_LOADING = 20,
	FILE_STATE_READY = 30,
	FILE_STATE_SAVING = 40,

	PANE_CODE_EDITOR = 10,
	PANE_TODO = 20,
	PANE_FILE_BROWSER = 30,

	activeProjectId = null,
	activeCodeEditor = null,
	workspaceInitiated = false,

	panes = {},
	projects = {},


	initWorkspace = function() {
		if(workspaceInitiated) return;

		panes = [
			{
				name: "CodeEditor1",
				type:PANE_CODE_EDITOR,
				codeEditor: new CodeEditor(document.getElementById("paneEditor1"))
			}
			/*,
			{
				name: "CodeEditor2",
				type:PANE_CODE_EDITOR,
				codeEditor: new CodeEditor(document.getElementById("paneEditor2"))
			}*/
		];
		activeCodeEditor = panes[0].codeEditor;
		workspaceInitiated = true;
	},


	getActiveProjectId = function() {
		return activeProjectId;
	},

	getPanes = function() {
		return panes;
	},

	getActiveCodeEditor = function() {
		return activeCodeEditor;
	},

	setActiveCodeEditor = function(ce) {
		activeCodeEditor = ce;
	},

	setHeader = (function(text) {
		var title = document.getElementById("pageTitle");

		return function(text) {
			title.textContent = text;
		}
	}()),

	getProjects = function() {
		return projects;
	},
	getProject = function(projectId) {
		return projects[projectId];
	},

	loadProjects = function() {
		Ajax.getJSON("/api/get_my_projects", null, function(data) {
			projects = data.projects;
			console.log("%i projects loaded", Object.keys(projects).length, projects);
			XI.fire('projectsLoaded');
		});
	},

	openProject = function(projectId) {
		activeProjectId = projectId;
		initWorkspace();
	};


	return {
		getActiveProjectId: getActiveProjectId,
		getActiveCodeEditor: getActiveCodeEditor,
		setActiveCodeEditor: setActiveCodeEditor,
		setHeader: setHeader,
		loadProjects: loadProjects,
		getProjects: getProjects,
		getProject: getProject,
		openProject: openProject,
		getPanes: getPanes
	};
}());



(function() {
	var h1 = document.querySelector("#header h1");
	h1.addEventListener("click", headerClick, false);
	function headerClick() {
		setHash();
	}
}());