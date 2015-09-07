var Todo = (function() {

	var btnAddFeature, btnAddBug,
	list, listDone, dragElem, dragUp, dragY,
	projectId, todos, pop,

	initTodo = function initTodo() {
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

		listDone = document.getElementById("listTodosDone");
		listDone.addEventListener("click", clickHandler, false);
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
				status: todo.status,
				created: todo.created,
				edited: todo.edited,
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
				//empty pixel as drag image
				var dragGhost = document.createElement("img");
				dragGhost.src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
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
				var formData = new FormData();
				formData.append("project_id", projectId);
				formData.append("prio", ids);
				Ajax.post2JSON("/scripts/todo_handler.php", formData, prioritizeCallback);
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
		projectId = pId;
		clear();
		Ajax.getJSON("/scripts/todo_handler.php", {project_id:projectId, action:"getAll"}, function(json) {
			todos = json.todos;
			XI.fire("todosLoaded");
		});
	},



	updateList = function() {
		list.innerHTML="";
		listDone.innerHTML="";

		var sortedTodoIds = Object.keys(todos).sort(function(a,b){
			return todos[a].prio-todos[b].prio;
		});

		for(var i in sortedTodoIds) {
			var todoId = sortedTodoIds[i];
			var todo = todos[todoId];
			var done = todo.status==="done";

			if(!todo.type) todo.type="feature";


			var li = document.createElement("LI");
			li.classList.add(todo.type)
			li.dataset.id = todoId;
			if(!done) li.draggable="true";

			var title = document.createElement("span");
			title.textContent = todo.description;
			title.classList.add("title");

			li.appendChild(title);
			if(done) {
				listDone.appendChild(li);
			} else {
				list.appendChild(li);
			}
		}
	},

	addFeature = function(e) {
		createTodoForm({
			type: "feature",
			title: "Add a new feature"
		});
	},

	addBug = function(e) {
		createTodoForm({
			type: "bug",
			title: "Add a new bug report"
		});
	},

	createTodoForm = function(settings) {
		var editMode = !!settings.todoId;


		var template = document.getElementById('tplTodoEdit').content;


		var hiddenId = template.querySelector("input[name=todo_id]");
		hiddenId.value = settings.todoId || "";

		var todoTimeCreated = template.querySelector("#todoTimeCreated");
		if(settings.created) todoTimeCreated.textContent = toHumanReadableDateTime(parseInt(settings.created));

		var todoTimeEdited = template.querySelector("#todoTimeEdited");
		if(settings.edited) todoTimeEdited.textContent = toHumanReadableDateTime(parseInt(settings.edited));

		var description = template.querySelector("textarea");
		description.textContent = settings.description || "";

		var title = template.querySelector("h3");
		title.textContent = settings.title;

		var radioTypeSelected = template.querySelector("input[name=type][value="+settings.type+"]");
		radioTypeSelected.checked="checked";

		if(!settings.status) settings.status="new";
		var radioStatusSelected = template.querySelector("input[name=status][value="+settings.status+"]");
		radioStatusSelected.checked="checked";

		pop = XioPop.showElement({element:document.importNode(template, true)});

		var form = document.getElementById("formTodo");
		form.addEventListener("submit", submitTodo, false);

		var btnDelete = form.querySelector("button.delete");
		btnDelete.dataset.todoId = settings.todoId;
		btnDelete.addEventListener("click", deleteTodo, false);

		description.focus();
	},

	submitTodo = function(e) {
		e.preventDefault();
		var formData = new FormData(e.target);
		formData.append("project_id", projectId);
		formData.append("ts", (new Date()).getTime());
		Ajax.post2JSON("/scripts/todo_handler.php", formData, submitCallback);
		closePop();
	},

	submitCallback = function(json) {
		switch(json.status) {
			case STATUS_OK:
			console.log("submit callback", json);
			todos[json.todo_id] = json.todo;
			updateList();
			break;

			case STATUS_FILE_COULD_NOT_UPDATE:
			XioPop.alert({title:"Permission denied", text:"You do not have sufficient permission to update project todo file"});
			break;

			default:
			XioPop.alert({title:"Error", text:"Unknown error while saving todo config"});
		}
	},

	deleteTodo = function(e) {
		var formData = new FormData();
		formData.append("project_id", projectId);
		formData.append("todo_id", e.target.dataset.todoId);
		Ajax.post2JSON("/scripts/todo_handler.php?action=delete", formData, deleteCallback);
		closePop();
	},

	deleteCallback = function(json) {
		console.log("delete callback", json);
		delete todos[json.todo_id];
		updateList();
	},

	clear = function() {
		list.innerHTML="";
		listDone.innerHTML="";
		todos = {};
	},

	closePop = function() {
		if(pop) {
			pop.close();
			pop=null;
		}
	};

	XI.listen("DOMContentLoaded", initTodo);
	XI.listen(["DOMContentLoaded","todosLoaded"], updateList, true);

	return {
		loadAll: loadAll,
		clear: clear
	};
}());





