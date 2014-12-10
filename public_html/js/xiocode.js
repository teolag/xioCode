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






	openProject = function(projectId) {
		activeProjectId = projectId;
		initWorkspace();
	};






	return {
		getActiveProjectId: getActiveProjectId,
		getActiveCodeEditor: getActiveCodeEditor,
		setActiveCodeEditor: setActiveCodeEditor,

		openProject: openProject,
		getPanes: getPanes
	}

}());