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
		list.addEventListener("mousedown", clickHandler, false);
		list.addEventListener("dragover", dragHandler, false);
		list.addEventListener("dragenter", dragHandler, false);
		list.addEventListener("dragleave", dragHandler, false);
		list.addEventListener("dragstart", dragHandler, false);
		list.addEventListener("dragend", dragHandler, false);
		
	},
	
	clickHandler = function(e) {
	
		if(e.type==="mousedown" && e.target.classList.contains("dragHandle")) {
			//e.target.parentElement.draggable="true";
		} else if(e.type==="click") {
	
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
				editType: true,
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
			console.log("enter", e);
			
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
			console.log("end", e);
			list.classList.remove("reordered");
			//e.target.removeAttribute("draggable");
			e.target.classList.remove("dragged");
			var items = list.children;
			var ids = [];
			for(var i=0; i<items.length; i++) {
				ids.push(items[i].dataset.id);
			}
			console.log("order", ids.join(","));
			var formData = new FormData(form);
			formData.append("project_id", projectId);
			formData.append("prio", ids);
			Ajax.postFormDataWithJsonResponse("/scripts/todo_handler.php", formData, prioritizeCallback);
			break;
			
			case "dragleave":
			e.preventDefault();
			console.log("leave", li);
			break;
		
			case "dragover":
			e.preventDefault();
			if(dragY !== e.pageY) {
				dragUp = dragY > e.pageY;
			}
			dragY = e.pageY;
			console.log("up", dragUp);
			
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
		
		console.log("sorted", sortedTodoIds);
		
		
		for(var i in sortedTodoIds) {
			var todoId = sortedTodoIds[i];
			console.log("Id:", todoId);
			var todo = todos[todoId];
			
			if(!todo.type) todo.type="feature";
			
			var li = document.createElement("LI");
			li.classList.add(todo.type)
			li.dataset.id = todoId;
			li.draggable="true";
			
			var dragHandle = document.createElement("DIV");
			dragHandle.classList.add("dragHandle");
			
			var title = document.createElement("DIV");
			title.textContent = todo.description;
			title.classList.add("title");
			
			//li.appendChild(dragHandle);
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
		
		if(settings.editType) {
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
		
		form.appendChild(title);
		form.appendChild(hiddenId);
		form.appendChild(hiddenType);
		form.appendChild(description);
		if(typeChanger) form.appendChild(typeChanger);
		form.appendChild(saveButton);
		
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





