var codeEditor;

function initWriter() {
	if(codeEditor) return;

	codeEditor = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
        matchBrackets: true,
		autoCloseTags: true,
		autoCloseBrackets: true,
		styleActiveLine: true,
        indentUnit: 4,
        indentWithTabs: false,
		smartIndent: true,
		theme: 'xio',
        highlightSelectionMatches: {showToken: /\w/},
		extraKeys: {
			"Tab"			: "tabWithAutoComplete",
			"Shift-Tab"		: "indentLess",
			"Ctrl-D" 		: "removeLines",
			"Cmd-D" 		: "removeLines",
			"Ctrl-N" 		: "newFile",
			"Cmd-N" 		: "newFile",
			"Ctrl-S" 		: "shortcutSave",
			"Cmd-S" 		: "shortcutSave",
			"Alt-Up"		: "swapLineUp",
  			"Alt-Down"		: "swapLineDown",  
			"Ctrl-Alt-Down" : "duplicateRowDown",
			"Cmd-Alt-Down" 	: "duplicateRowDown",
			"Ctrl-Alt-Up" 	: "duplicateRowUp",
			"Cmd-Alt-Up" 	: "duplicateRowUp",
			"Cmd-I" 		: "selectLines",
			"Ctrl-I" 		: "selectLines",
			"Cmd-L" 		: "jump2Line",
			"Ctrl-L" 		: "jump2Line",
			"Cmd-O" 		: "showAllFunctions",
			"Ctrl-O" 		: "showAllFunctions",
			"Ctrl-Q"		: "toggleComment",
			"Cmd-Q"			: "toggleComment"
		}
	});


	console.groupCollapsed("CodeMirror" , CodeMirror.version, "loaded");
	console.log("Modes", CodeMirror.modes);
	console.log("Mimes", CodeMirror.mimeModes);
	console.groupEnd();

	codeEditor.on("dragover", function(cm, e) {
		cm.setCursor(cm.coordsChar({left:e.x, top:e.y}));
		cm.focus();
	});
	
	codeEditor.on("drop", function(cm, e) {
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

	codeEditor.on("change", function(cm, change) {
		if(activeFile) {
			//console.log("CodeMirror Change", cm, change);
			updateCleanStatus(activeFile);
		}
	});
};


