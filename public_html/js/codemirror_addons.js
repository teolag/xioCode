var codemirrorSnippets = {
	"html":		"<!doctype html>\n<html>\n\t<head>\n\t\t<title>Page Title</title>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" />\n\t</head>\n\t<body>\n\t\t\n\t</body>\n</html>",
	"css":		"<link rel=\"stylesheet\" href=\"style.css\" type=\"text/css\" />",
	"mobile":	"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1\" />",
	"com":		"/**********************************************************\n\n\n**********************************************************/",
	"phperror":	"ini_set('display_errors',1);\nini_set('error_reporting', E_ALL ^ E_NOTICE);",
	"xhr": "xhr = new XMLHttpRequest();",
	"favicon": "<link rel=\"shortcut icon\" href=\"favicon.ico\" />"
};

var codemirrorDefaults = {
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
};







CodeMirror.commands.duplicateRowUp = function(editor) {
	CodeMirror.commands.duplicateLine(editor);
};

CodeMirror.commands.duplicateRowDown = function(editor) {
	CodeMirror.commands.duplicateRow(editor, false);
};

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
};

CodeMirror.commands.removeLines = function(editor) {
	var startLine = editor.getCursor("start").line;
	var endLine = editor.getCursor("end").line;
	var pos = editor.getCursor();
	editor.replaceRange("", {line:startLine,ch:0}, {line:endLine+1,ch:0});
	editor.setCursor(pos);
};

CodeMirror.commands.selectLines = function(editor) {
	var posStart = editor.getCursor("start");
	var posEnd = editor.getCursor("end");
	posStart.ch=0;
	posEnd.ch=editor.getLine(posEnd.line).length;
	editor.setSelection(posStart, posEnd);
};

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
	if(codemirrorSnippets[text]) {
		editor.replaceRange(codemirrorSnippets[text],start, cur);
	} else {
		//TODO: InsertSoftTab to use spaces
		CodeMirror.commands[editor.getSelection().length ? "indentMore" : "insertTab"](editor);
	}
};

CodeMirror.commands.shortcutSave = function(editor) {
	console.log("Ctrl/Cmd+s pressed, saving...");
	XioCode.getActiveCodeEditor().save();
};

CodeMirror.commands.newFile = function(editor) {
	//Does not work in chrome...
	console.log("Ctrl/Cmd+n pressed, new file...");
	unloadFile();
};

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
	editor.focus();
}


CodeMirror.commands.rightTrimLines = function(editor, line) {

};


CodeMirror.commands.showAllFunctions = function(editor) {
	var functions = findFunctions();

	console.log(functions);
	var div = document.createElement("div");
	div.classList.add("filteredSelectList");

	var filter = document.createElement("input");
	filter.value = editor.doc.getSelection();
	filter.type="search";
	filter.addEventListener("keyup", function(e) {
		if(e && e.which === 13) {
			var first = list.querySelector("li:not(.hidden)");
			if(!first) return;

			console.log("Choose the first", first);
			var line = Number(first.getAttribute("data-line"));
			XioPop.close();
			CodeMirror.commands.jump2Line(editor, line);
		} else {
			filterFunctions();
		}
	});
	
	
	var filterFunctions = function() {
		var searchString = filter.value.toLowerCase();
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
	};

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
	filterFunctions();
	filter.focus();
};