var XioCode = (function(){
	var
	FILE_STATE_LOADING = 20,
	FILE_STATE_READY = 30,
	FILE_STATE_SAVING = 40,
	
	PANE_CODE_EDITOR = 10,
	PANE_TODO = 20,
	PANE_FILE_BROWSER = 30,
	
	
	
	openedFiles = {},
	activeProjectId = null,
	
	panes = [
		{
			name: "CodeEditor1",
			type:PANE_CODE_EDITOR, 
			codeEditor: new CodeEditor(document.getElementById("paneEditor1"))
		},
		{
			name: "CodeEditor2",
			type:PANE_CODE_EDITOR, 
			codeEditor: new CodeEditor(document.getElementById("paneEditor2"))
		}
	],

	activeCodeEditor = panes[0].codeEditor,
	
	
	getActiveProjectId = function() {
		return activeProjectId;
	},
	
	getActiveCodeEditor = function() {
		return activeCodeEditor;
	},
	
	setActiveCodeEditor = function(ce) {
		activeCodeEditor = ce;
	},
	
	
	
	

	
	openProject = function(projectId) {
		console.log("set active", projectId);
		activeProjectId = projectId;
	};
	
	
	
	
	
	
	return {
		getActiveProjectId: getActiveProjectId,
		getActiveCodeEditor: getActiveCodeEditor,
		setActiveCodeEditor: setActiveCodeEditor,
		
		openProject: openProject,
		panes: panes
	}
	
}());