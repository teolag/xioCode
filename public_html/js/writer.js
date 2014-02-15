
var codeMirror;
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
		//theme: 'neat',
		//theme: 'ambiance',
        indentWithTabs: true,
		//cursorScrollMargin: 75,
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
			"Alt-Down" 		: "moveRowDown",
			"Alt-Up" 		: "moveRowUp",
			"Ctrl-Alt-Down" : "duplicateRowDown",
			"Cmd-Alt-Down" 	: "duplicateRowDown",
			"Ctrl-Alt-Up" 	: "duplicateRowUp",
			"Cmd-Alt-Up" 	: "duplicateRowUp",
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
	
	codeMirror.on("dragover", function(cm, e) {
		cm.setCursor(cm.coordsChar({left:e.x, top:e.y}));
		cm.focus();
		
	});
	codeMirror.on("drop", function(cm, e) {
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
	
	codeMirror.on("change", function(cm, change) {
		if(activeFile) {
			//console.log("CodeMirror Change", cm, change);
			updateCleanStatus(activeFile);
		}
	});	
	
	
	
}

CodeMirror.commands.moveRowUp = function(editor) {
	CodeMirror.commands.moveRow(editor, true);
}
CodeMirror.commands.moveRowDown = function(editor) {
	CodeMirror.commands.moveRow(editor, false);
}
CodeMirror.commands.moveRow = function(editor, up) {
	var start = editor.getCursor("start");
	var end = editor.getCursor("end");	
	var nextRow = editor.getLine(end.line+1);
	var prevRow = editor.getLine(start.line-1);
	
	if(up && start.line>0) {
		editor.replaceRange("", {line:start.line-1, ch:0}, {line:start.line, ch:0});
		if(end.line===editor.doc.lastLine()) {
			editor.replaceRange("\n"+prevRow, {line:end.line});
			editor.setSelection({line:start.line-1, ch:start.ch}, {line:end.line-1, ch:end.ch});
		} else {
			editor.replaceRange(prevRow + "\n", {line:end.line, ch:0});
		}
	} else if(!up) {
		if(end.line===editor.doc.lastLine()-1) {
			editor.replaceRange("", {line:end.line}, {line:end.line+1});
		} else if(end.line!==editor.doc.lastLine()) {
			editor.replaceRange("", {line:end.line+1, ch:0}, {line:end.line+2, ch:0});
		}
		editor.replaceRange(nextRow+"\n",{line:start.line, ch:0});
	}
}


CodeMirror.commands.duplicateRowUp = function(editor) {
	CodeMirror.commands.duplicateRow(editor, true);
}
CodeMirror.commands.duplicateRowDown = function(editor) {
	CodeMirror.commands.duplicateRow(editor, false);
}
CodeMirror.commands.duplicateRow = function(editor, up) {	
	var start = editor.getCursor("start");
	var end = editor.getCursor("end");	
	var text = editor.getRange({line:start.line, ch:0}, {line:end.line});
	if(up) {
		if(end.line===editor.doc.lastLine()) {
			editor.replaceRange("\n"+text, {line:end.line});
			editor.setSelection(start, end);
		} else {
			editor.replaceRange(text + "\n", {line:end.line+1, ch:0});
		}
	} else {
		if(start.line===0) {
			editor.replaceRange(text+"\n", {line:0, ch:0});
		} else {
			editor.replaceRange("\n"+text, {line:start.line-1});
		}
	}
}




CodeMirror.commands.removeLines = function(editor) {
	var startLine = editor.getCursor("start").line;
	var endLine = editor.getCursor("end").line;	
	var pos = editor.getCursor();	
	editor.replaceRange("", {line:startLine,ch:0}, {line:endLine+1,ch:0});
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
	editor.setCursor(line+100, 0);
	editor.setCursor(line-10, 0);
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


