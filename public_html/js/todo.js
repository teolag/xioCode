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
	list, form, 
	projectId, todos,
	
	init = function() {
		btnAddFeature = document.getElementById("btnAddFeature");
		btnAddFeature.addEventListener("click", addFeature, false);
		
		btnAddBug = document.getElementById("btnAddBug");
		btnAddBug.addEventListener("click", addBug, false);
		
		list = document.getElementById("listTodos");
		list.addEventListener("click", clickHandler, false);
	},
	
	clickHandler = function(e) {
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
		for(var todoId in todos) {
			var todo = todos[todoId];
			
			if(!todo.type) todo.type="feature";
			
			var li = document.createElement("LI");
			li.classList.add(todo.type)
			li.dataset.id = todoId;
			
			var dragHandle = document.createElement("DIV");
			dragHandle.classList.add("dragHandle");
			
			var title = document.createElement("DIV");
			title.textContent = todo.description;
			title.classList.add("title");
			
			li.appendChild(dragHandle);
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
	
	createTodoForm = function(settings) {
		form = document.createElement("FORM");
		form.id = "formTodo";
		form.addEventListener("submit", submitTodo, false);
		
		var hiddenId = document.createElement("INPUT");
		hiddenId.type = "hidden";
		hiddenId.name = "todo_id";
		hiddenId.value = settings.todoId;
		
		var hiddenType = document.createElement("INPUT");
		hiddenType.type = "hidden";
		hiddenType.name = "type";
		hiddenType.value = settings.type;
		
		var title = document.createElement("h3");
		title.textContent = settings.title;
		
		var description = document.createElement("TEXTAREA");
		description.name = "description";
		description.value = settings.description;
		
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
	},
	
	addBug = function(e) {
	
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





