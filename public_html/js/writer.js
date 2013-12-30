

var snippets = {
	"html":		"<!doctype html>\n<html>\n\t<head>\n\t\t<title>Page Title</title>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" />\n\t</head>\n\t<body>\n\t\t\n\t</body>\n</html>",
	"css":		"<link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" />",
	"mobile":	"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1\" />",
	"com":		"/**********************************************************\n\n\n**********************************************************/",
	"phperror":	"ini_set('display_errors',1);\nini_set('error_reporting', E_ALL ^ E_NOTICE);",
	"xhr": "xhr = new XMLHttpRequest();"
};


function initWriter() {
	if(codeMirror) return;
	
	codeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
        matchBrackets: true,
		smartIndent: false,
		styleActiveLine: true,
        indentUnit: 4,
		theme: 'default',
        indentWithTabs: true,
		cursorScrollMargin: 75,
        highlightSelectionMatches: true,
		extraKeys: {
			"Tab"			: "tabWithAutoComplete",
			"Shift-Tab"		: "indentLess",
			"Ctrl-D" 		: "removeLines",
			"Cmd-D" 		: "removeLines",
			"Ctrl-N" 		: "newFile",
			"Cmd-N" 		: "newFile",
			"Ctrl-S" 		: "shortcutSave",
			"Cmd-S" 		: "shortcutSave",
			"Alt-Down" 		: function(editor) { CodeMirror.commands.moveRow(editor, false); },
			"Alt-Up" 		: function(editor) { CodeMirror.commands.moveRow(editor, true); },
			"Ctrl-Alt-Down" : function(editor) { CodeMirror.commands.duplicateRow(editor, false); },
			"Cmd-Alt-Down" 	: function(editor) { CodeMirror.commands.duplicateRow(editor, false); },
			"Ctrl-Alt-Up" 	: function(editor) { CodeMirror.commands.duplicateRow(editor, true); },
			"Cmd-Alt-Up" 	: function(editor) { CodeMirror.commands.duplicateRow(editor, true); },
			"Cmd-I" 		: "selectLines",
			"Ctrl-I" 		: "selectLines",			
			"Cmd-L" 		: "jump2Line",
			"Ctrl-L" 		: "jump2Line",			
			"Cmd-O" 		: "showAllFunctions",
			"Ctrl-O" 		: "showAllFunctions"
		}
	});
	
	
	
	
	console.groupCollapsed("CodeMirror" , CodeMirror.version, "loaded");
	console.log("Modes", CodeMirror.modes);
	console.log("Mimes", CodeMirror.mimeModes);
	console.groupEnd();
	
	codeMirror.on("change", function(cm, change) {
		if(activeFile) {
			console.log("CodeMirror Change", cm, change);
			fileChanged(activeFile);
		}
	});	
	
	codeMirror.on("scroll", function(cm) {
		//console.log("Scroll", cm.getScrollInfo());
	});
	
	/*
	codeMirror.on("focus", function() {
		document.getElementById("btnColorPicker").removeAttribute("disabled");
	});
	codeMirror.on("blur", function() {
		document.getElementById("btnColorPicker").disabled='disabled';
	});
	*/
	
	codeMirror.on("cursorActivity", function(cm) {
		//console.log("Cursor activity", cm);
		
		/*
		var cur = editor.getCursor();
		var c = editor.getSearchCursor(/[ \s:;]/i);
		
		matchStart = c.matches(true, cur);
		matchEnd = c.matches(false, cur);
		if(matchStart && matchEnd) {
			text = editor.getRange(matchStart.to, matchEnd.from).trim();
			if(text.match("^#[A-Fa-f0-9]{6}$") || text.match("^#[A-Fa-f0-9]{3}$")) {
				console.log("Color found:", text);
				return;
			}
		}
		console.log("hide picker");
		*/
	});

	
	/*
	$(codeMirror.getScrollerElement()).ColorPicker({
		flat:true,
		
		onSubmit: function(hsb, hex, rgb, el) {
			codeMirror.setSelection(selStart, selEnd);
			codeMirror.replaceSelection(hex);
			$(el).ColorPickerHide();
		}	
	});
	$(codeMirror.getScrollerElement()).ColorPickerHide();

	$(codeMirror.getScrollerElement()).bind("contextmenu", function(e) {
		selection = codeMirror.getSelection();
		if(selection.match("^#?[A-Fa-f0-9]{6}$")) {
			e.preventDefault();
			$(this).ColorPickerSetColor(selection.replace("#",""));
			selStart=codeMirror.getCursor(true);
			selEnd=codeMirror.getCursor(false);
			$(codeMirror.getScrollerElement()).ColorPickerShow();
		}		
	});
	*/
	
}



CodeMirror.commands.moveRow = function(editor, up) {
	CodeMirror.commands.selectLines(editor);
	var startLine = editor.getCursor("start").line;
	var endLine = editor.getCursor("end").line;	
	var nextRow = editor.getLine(endLine+1);
	var prevRow = editor.getLine(startLine-1);
	
	if(up && startLine>0) {
		editor.removeLine(startLine-1);	
		editor.setLine(endLine, prevRow + "\n" + nextRow);
	} else if(!up) {
		console.log(startLine);
		editor.removeLine(endLine+1);
		if(startLine==0) {
			pos = {line:0, ch:0};
			editor.replaceRange(nextRow+"\n",pos, pos);
		} else {
			editor.setLine(startLine-1, prevRow + "\n" + nextRow);
		}
	}
}


CodeMirror.commands.duplicateRow = function(editor, up) {	
	CodeMirror.commands.selectLines(editor);
	var startLine = editor.getCursor("start").line;
	var endLine = editor.getCursor("end").line;	
	var text = editor.getSelection();
	if(up) {
		var nextRow = editor.getLine(endLine+1);
		editor.setLine(endLine+1, text + "\n" + nextRow);
	} else {
		var prevRow = editor.getLine(startLine-1);
		editor.setLine(startLine-1, prevRow + "\n" + text);
	}
	
}




CodeMirror.commands.removeLines = function(editor) {
	editor.replaceSelection("");
	var pos = editor.getCursor();
	editor.removeLine(pos.line);
	editor.setCursor(pos);
}

CodeMirror.commands.selectLines = function(editor) {
	var posStart = editor.getCursor("start");
	var posEnd = editor.getCursor("end");	
	posStart.ch=0;
	posEnd.ch=editor.getLine(posEnd.line).length;	
	editor.setSelection(posStart, posEnd);	
}

CodeMirror.commands.tabWithAutoComplete = function(editor) {
	console.log("tabWithAutoComplete");
	var cur = editor.getCursor();
					
	var c = editor.getSearchCursor(/\s/);
	
	match = c.matches(true, cur);
	console.log("match", match);
	var start;
	if(match) {
		start = match.to;
	} else {
		start = {line:cur.line, ch:0};
	}
	text = editor.getRange(start, cur).trim(); 
	if(snippets[text]) {
		editor.replaceRange(snippets[text],start, cur);
	} else {
		CodeMirror.commands[editor.getSelection().length ? "indentMore" : "insertTab"](editor);
	}
}
CodeMirror.commands.shortcutSave = function(editor) {
	console.log("Ctrl/Cmd+s pressed, saving...");
	saveFile();
}
CodeMirror.commands.newFile = function(editor) {
	//Does not work in chrome...
	console.log("Ctrl/Cmd+n pressed, new file...");
	unloadFile();
}
CodeMirror.commands.jump2Line = function(editor, line) {
	if(line===undefined) {
		XioPop.prompt("Jump to line", "Enter the desired line number", "", function(lineNumber) {
			if(Number(lineNumber) > 0) {
				CodeMirror.commands.jump2Line(editor, Number(lineNumber)-1);
			}
		});
		return;
	}
	editor.setCursor(0, 0);
	editor.setCursor(line-20, 0);
	editor.setCursor(line, 0);
	codeMirror.focus();
}
CodeMirror.commands.rightTrimLines = function(editor, line) {
	
}


CodeMirror.commands.showAllFunctions = function(editor) {
	
	var functions = findFunctions();
	
	console.log(functions);
	
	var div = document.createElement("div");
	div.classList.add("filteredSelectList");
	
	
	var filter = document.createElement("input");
	filter.type="search";
	filter.addEventListener("keyup", function(e) {
		if(e && e.which == 13) {
			var first = list.querySelector("li");	
			if(!first) return;
			
			console.log("Choose the first", first);
			var line = Number(first.getAttribute("data-line"));
			XioPop.close();
			CodeMirror.commands.jump2Line(editor, line);
		} else {
			var searchString = e.target.value.toLowerCase();
			console.log("filter functions '"+searchString+"'");
			
			for(var id in functions) {
				var func = functions[id];
				console.log(id, func);
				
				var li = list.querySelector("li[data-id='"+id+"']");
				if(func.name.toLowerCase().search(searchString)!=-1) {
					li.classList.remove('hidden');
				} else {
					li.classList.add('hidden');
				}
			}
	}
	});
	
	
	var list = document.createElement("ul");
	list.classList.add("selectableList", "functions");
	list.addEventListener("click", function(e) {
		var target = e.target;
		if(target.nodeName==="LI") {
			var line = Number(target.getAttribute("data-line"));
			XioPop.close();
			CodeMirror.commands.jump2Line(editor, line);			
		}		
	});
	for(var i=0; i<functions.length; i++) {
		var f = functions[i];
		var item = document.createElement("li");
		item.textContent = f.name + " (" + f.args.join(", ") + ")";
		item.setAttribute("data-line", f.line); 
		item.setAttribute("data-id", i); 
		list.appendChild(item);
	}
	
	div.appendChild(filter);
	div.appendChild(list);
	XioPop.showElement(div);
	filter.focus();

}




var selStart, selEnd;



function selectTheme() {
	var input = document.getElementById("skinSelect");
	var theme = input.options[input.selectedIndex].innerHTML;
	codeMirror.setOption("theme", theme);
	console.log("Set theme to:", theme);
}


