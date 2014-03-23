/*
BUGS
	STATUSES
	- new
	- started
	- done

	PRIO
	- critical
	- annoying

FEATURES
	STATUSES
	- new
	- started
	- done

	PRIO
  	- awesome!
	- nice to have
	- we'll see
*/



var Todo = (function() {

	var btnAddFeature, btnAddBug, 
	list, form, dragElem, dragUp, dragY,
	projectId, todos,
	
	init = function() {
		btnAddFeature = document.getElementById("btnAddFeature");
		btnAddFeature.addEventListener("click", addFeature, false);
		
		btnAddBug = document.getElementById("btnAddBug");
		btnAddBug.addEventListener("click", addBug, false);
		
		list = document.getElementById("listTodos");
		list.addEventListener("click", clickHandler, false);
		list.addEventListener("dragover", dragHandler, false);
		list.addEventListener("dragenter", dragHandler, false);
		list.addEventListener("dragleave", dragHandler, false);
		list.addEventListener("dragstart", dragHandler, false);
		list.addEventListener("dragend", dragHandler, false);
		
	},
	
	clickHandler = function(e) {
	
		if(e.type==="click") {
	
			var li = e.target;
			while(li.nodeName!=="LI") {
				if(li===list) return;
				li=li.parentElement;
			}

			var todoId = li.dataset.id;
			var todo = todos[todoId];
			console.log("clicked on", todoId);
			createTodoForm({
				todoId: todoId,
				type: todo.type,
				title: "Edit " + todo.type + ": " + todoId,
				description: todo.description
			});
		}
	},
	
	dragHandler = function(e) {
	
		if(e.type==="dragenter" || e.type==="dragleave") {
			var li = e.target;
			while(li.nodeName!=="LI") {
				if(li===list) return;
				li=li.parentElement;
			}
		}
		
		switch(e.type) {
			case "dragenter":
			e.preventDefault();
			
			list.insertBefore(dragElem, dragUp ? li : li.nextSibling);			
			break;
			
			case "dragstart":
			dragElem = e.target;
			dragElem.classList.add("dragged");
			list.classList.add("reordered");
			var dragGhost = document.createElement("DIV");
			document.body.appendChild(dragGhost);
			e.dataTransfer.setDragImage(dragGhost, -10, -10);
			break;
			
			case "dragend":
			list.classList.remove("reordered");
			e.target.classList.remove("dragged");
			var items = list.children;
			var ids = [];
			for(var i=0; i<items.length; i++) {
				ids.push(items[i].dataset.id);
			}
			var formData = new FormData(form);
			formData.append("project_id", projectId);
			formData.append("prio", ids);
			Ajax.postFormDataWithJsonResponse("/scripts/todo_handler.php", formData, prioritizeCallback);
			break;
			
			case "dragleave":
			e.preventDefault();
			break;
		
			case "dragover":
			e.preventDefault();
			if(dragY !== e.pageY) {
				dragUp = dragY > e.pageY;
			}
			dragY = e.pageY;
			break;
		}
	},
	
	prioritizeCallback = function(json) {
		console.log("prio", json);
	},
	
	loadAll = function(pId) {
		clear();
		projectId = pId;
		Ajax.getJSON("/scripts/todo_handler.php", {project_id:projectId, action:"getAll"}, loadAllCallback);		
	},
	
	loadAllCallback = function(json) {
		console.log("Todos loaded", json);
		todos = json.todos;
		updateList();
	},
	
	updateList = function() {
		list.innerHTML="";
		
		var sortedTodoIds = Object.keys(todos).sort(function(a,b){
			return todos[a].prio-todos[b].prio;
		});
		
		for(var i in sortedTodoIds) {
			var todoId = sortedTodoIds[i];
			var todo = todos[todoId];
			
			if(!todo.type) todo.type="feature";
			
			var li = document.createElement("LI");
			li.classList.add(todo.type)
			li.dataset.id = todoId;
			li.draggable="true";
			
			var title = document.createElement("span");
			title.textContent = todo.description;
			title.classList.add("title");
			
			li.appendChild(title);
			list.appendChild(li);
		}
	},
	
	addFeature = function(e) {
		console.log("addFeature");
		createTodoForm({
			type: "feature",
			title: "Add a new feature"
		});
	},
	
	addBug = function(e) {
		console.log("addBug");
		createTodoForm({
			type: "bug",
			title: "Add a new bug report"
		});
	},
	
	createTodoForm = function(settings) {
		var editMode = !!settings.todoId;
	
		form = document.createElement("FORM");
		form.id = "formTodo";
		form.addEventListener("submit", submitTodo, false);
		
		var hiddenId = document.createElement("INPUT");
		hiddenId.type = "hidden";
		hiddenId.name = "todo_id";
		hiddenId.value = settings.todoId || "";
		
		var hiddenType = document.createElement("INPUT");
		hiddenType.type = "hidden";
		hiddenType.name = "type";
		hiddenType.value = settings.type;
		
		var title = document.createElement("h3");
		title.textContent = settings.title;
		
		var description = document.createElement("TEXTAREA");
		description.name = "description";
		description.value = settings.description || "";
		
		if(editMode) {
			var typeChanger = document.createElement("div");
			typeChanger.classList.add(settings.type);
			typeChanger.textContent="toggle type";
			typeChanger.addEventListener("click", function(e) {
				if(hiddenType.value==="feature") {
					hiddenType.value = "bug";
					typeChanger.classList.add("bug");
					typeChanger.classList.remove("feature");
				} else {
					hiddenType.value = "feature";
					typeChanger.classList.add("feature");
					typeChanger.classList.remove("bug");
				}
			}, false);
		}
		
		var saveButton = document.createElement("BUTTON");
		saveButton.type="submit";
		saveButton.textContent="Save";
		
		if(editMode) {
			var deleteButton = document.createElement("BUTTON");
			deleteButton.type="button";
			deleteButton.textContent="Delete";
			deleteButton.dataset.todoId = settings.todoId;
			deleteButton.addEventListener("click", deleteTodo, false);
		}
		
		form.appendChild(title);
		form.appendChild(hiddenId);
		form.appendChild(hiddenType);
		form.appendChild(description);
		if(editMode) form.appendChild(typeChanger);
		form.appendChild(saveButton);
		if(editMode) form.appendChild(deleteButton);
		
		XioPop.showElement(form);
		description.focus();
	},
	
	submitTodo = function(e) {
		e.preventDefault();
		var formData = new FormData(form);
		formData.append("project_id", projectId);
		Ajax.postFormDataWithJsonResponse("/scripts/todo_handler.php", formData, submitCallback);
		XioPop.close();
	},
	
	submitCallback = function(json) {
		console.log("submit callback", json);
		todos[json.todo_id] = json.todo;
		updateList();
	},
	
	deleteTodo = function(e) {
		var formData = new FormData();
		formData.append("project_id", projectId);
		formData.append("todo_id", e.target.dataset.todoId);
		Ajax.postFormDataWithJsonResponse("/scripts/todo_handler.php?action=delete", formData, deleteCallback);
		XioPop.close();
	},
	
	deleteCallback = function(json) {
		console.log("delete callback", json);
		delete todos[json.todo_id];
		updateList();
	},
	
	clear = function() {
		list.innerHTML = "";
		todos = {};
	};
	
	return {
		init: init,
		loadAll: loadAll,
		clear: clear
	};
}());





