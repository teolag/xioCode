var ProjectList = (function() {

	var projects, projectOrder="name", projectOrderDir="asc", lastSearchString;
	var projectList, txtProjectFilter, btnNewProject, listProjectOrderBy;
	var tags, listTags;

	XI.listen("DOMContentLoaded", function(e) {
		console.log("Init ProjectList");
		projectList = document.getElementById('projectList');
		projectList.addEventListener("click", clickHandler, false);
		projectList.addEventListener("mouseover", hoverSelect, false);
		projectList.addEventListener("drop", dropHandler, false);
		projectList.addEventListener("dragover", dropHandler, false);
		projectList.addEventListener("dragleave", dropHandler, false);


		txtProjectFilter = document.getElementById('txtProjectFilter');
		txtProjectFilter.addEventListener("search", filterProjects);
		txtProjectFilter.addEventListener("keydown", keyDown);
		txtProjectFilter.addEventListener("keyup", filterProjects);

		btnNewProject = document.getElementById("btnNewProject");
		btnNewProject.addEventListener("click", addNewProject, false);

		listTags = document.getElementById("listProjectTags");

		listProjectOrderBy = document.getElementById("listProjectOrderBy");
		listProjectOrderBy.addEventListener("change", selectOrderBy, false);
	});

	var loadProjects = function() {
		Ajax.getJSON("/scripts/get_projects.php", null, function(json) {
			projects = json;
			console.log("%i projects loaded", Object.keys(projects).length);
			getUniqueTags();

			XI.fire('projectsLoaded');
		});
	};

	XI.listen(['projectsLoaded', 'DOMContentLoaded', 'orderProjects'], function(){
		printProjects();

		filterProjects();

		if(activeProject) {
            var pId = activeProject.id
            activeProject = projects[pId];
            activeProject.id = pId;
            document.title = pageTitle + " - " + activeProject.name;
            title.textContent = activeProject.name;
        }
	}, true);



	var selectOrderBy = function(e) {
		var option = e.target.selectedOptions[0];
		setOrderBy(option.dataset.order, option.dataset.order_dir);

		Ajax.post("/scripts/save_user_settings.php", {"projects_order_by":projectOrder, "projects_order_dir":projectOrderDir}, function(e) {
			console.log("User settings callback", e);
		});
	};

	var setOrderBy = function(column, dir) {
		if(projectOrder===column && projectOrderDir === dir) return;

		projectOrder = column;
		projectOrderDir = dir;

		var option = listProjectOrderBy.querySelector("option[data-order='"+projectOrder+"'][data-order_dir='"+projectOrderDir+"']");
		if(option) option.selected="true";

		XI.fire("orderProjects");
	};

	var getUniqueTags = function() {
		tags = [];
		for (var pId in projects) {
			if (projects.hasOwnProperty(pId)) {
				var t = projects[pId].tags;
				if(t) {
					t.forEach(function(tag, i) {
						if(tags.indexOf(tag)===-1) {
							tags.push(tag);
						}
					});
				}
			}
		}
	};


	var updateTagList = function() {
		listTags.innerHTML="";
		tags.forEach(function(tag, i) {
			var li = document.createElement("LI");
			li.textContent = tag;
			listTags.appendChild(li);
		});
	}


    var printProjects = function() {

		var sel = projectList.querySelector(".selected");

		var projectIds = Object.keys(projects);
		projectIds = sortProjects(projectIds, projectOrder);


        var ul = document.createElement("ul");
		projectIds.forEach(function(id, i) {
			var item = projects[id];

			var tpl = document.getElementById("tplProjectListItem").content;
			var li = tpl.querySelector("li");
			li.dataset.project_id = id;
			var name = tpl.querySelector(".name");
			name.textContent = item.name;
			var description = tpl.querySelector(".description");
			description.textContent = item.description||"";
			var project = document.importNode(tpl, true);
			ul.appendChild(project);
		});
		projectList.innerHTML="";
		projectList.appendChild(ul);


		if(sel) {
			var id = sel.dataset.project_id;
			projectList.querySelector("li[data-project_id="+id+"]").classList.add("selected");
		}

		lastSearchString="";

        updateTagList();
    };


	var clickHandler = function(e) {
		var target = e.target;
		var action;

		if(target.nodeName==="LI") {
			action = target.dataset.action;
			console.log("Do", action);
			e.preventDefault();
		}

		var p = target;
		while(!p.classList.contains("project")) {
			if(p===projectList) return;
			p = p.parentElement;
		}
		var projectId = p.dataset.project_id;

		switch(action) {

			case "delete":
			var project = projects[projectId];
			XioPop.confirm("Delete project?", "Are you sure you want to delete project '"+project.name+"'?", function(answer) {
				if(answer) {
					var formData = new FormData();
					formData.append("project_id", projectId);
					var xhr = new XMLHttpRequest();
					xhr.open('POST', "/scripts/delete_project.php", true);
					xhr.onload = function(e) {
						var xhr = e.target;
						if(xhr.status===200) {
							console.log("Project deleted");
							loadProjects();
						} else {
							console.err("Error deleting project", xhr);
						}
					};
					xhr.send(formData);
				} else {
					console.debug("Delete aborted");
				}
			});
			break;

			case "rename":
			XioPop.prompt("Rename project", "Enter a new name for the project", projects[projectId].name, function(newName) {
				if(newName) {
					var formData = new FormData();
					formData.append("new_name", newName);
					formData.append("project_id", projectId);
					var xhr = new XMLHttpRequest();
					xhr.open('POST', "/scripts/rename_project.php", true);
					xhr.onload = function(e) {
						var xhr = e.target;
						if(xhr.status===200) {
							console.log("Project renamed");
							findProjects();
						} else {
							console.err("Error renaming project", xhr);
						}
					};
					xhr.send(formData);
				}
			});
			break;

			case "config":
			ProjectConfig.open(projectId);
			break;

			case "run":
			previewProject(projectId);
			break;


			default:
			setHash(projectId);
		}
	};

	var hoverSelect = function(e) {
		var target = e.target;
		while(!target.classList.contains("project")) {
			if(target === projectList) return;
			target = target.parentElement;
		}
		deselectAll();
		target.classList.add("selected");
	};

	var deselectAll = function() {
		var selected = projectList.getElementsByClassName("selected");
		for(var i=0; i<selected.length; i++) {
			selected[i].classList.remove("selected");
		}
	};

	var keyDown = function(e) {
		if(e.which === KEY_ENTER) {
			var projectElement = projectList.querySelector(".selected");
			setHash(projectElement.getAttribute('data-project_id'));
			e.preventDefault();
		} else if(e.which === KEY_DOWN) {
			selectNextVisible();
			e.preventDefault();
		} else if(e.which === KEY_UP) {
			selectNextVisible(true);
			e.preventDefault();
		} else {
			filterProjects();
		}
	};


	function filterProjects(e) {
		if(!projects) return;

		var searchString = txtProjectFilter.value.toLowerCase();
		if(searchString===lastSearchString) return;
		lastSearchString=searchString;
		console.log("filter projects '"+searchString+"'", txtProjectFilter, projects);

		for(var id in projects) {
			if (projects.hasOwnProperty(id)) {
				var project = projects[id];

				var p = projectList.querySelector(".project[data-project_id='"+id+"']");
				if(project.name.toLowerCase().search(searchString)!=-1) {
					p.classList.remove('hidden');
				} else {
					p.classList.add('hidden');
				}
			}
		}
		var sel = projectList.querySelector(".selected");
		if(!sel || sel.classList.contains("hidden")) {
			var found = selectNextVisible(true);
			if(!found) selectNextVisible();
		}
	}

	function sortProjects(projectIds) {
		projectIds.sort(function(id1,id2) {
			var p1 = projects[id1];
			var p2 = projects[id2];

			switch(projectOrder) {
				case "name":
				var n1 = p1.name.toLowerCase();
				var n2 = p2.name.toLowerCase();
				if (n1 < n2) return -1;
				if (n1 > n2) return 1;
				return 0;

				case "created":
				var c1 = p1.created || 0;
				var c2 = p2.created || 0;
				return c2-c1;

				case "opened":
				var c1 = p1.last_opened || 0;
				var c2 = p2.last_opened || 0;
				return c2-c1;
			}
		});
		if(projectOrderDir==="desc") {
			projectIds.reverse();
		}
		return projectIds;
	}

	var selectNextVisible = function(rev){
		var sel = projectList.querySelector(".selected");
		if(sel) {
			var sib = rev? sel.previousElementSibling : sel.nextElementSibling;
			while(sib !== null) {
				if(!sib.classList.contains("hidden")) {
					deselectAll();
					sib.classList.add("selected");
					return true;
				}
				sib = rev? sib.previousElementSibling : sib.nextElementSibling;
			}
		} else {
			//Select first project
			sel = projectList.querySelector(".project");
			deselectAll();
			sel.classList.add("selected");
			return true;
		}
		return false;
	};

	var dropHandler = function(e) {
		switch(e.type) {

			case "dragover":
			projectList.classList.add("dropzone");
			e.preventDefault();
			break;

			case "dragleave":
			projectList.classList.remove("dropzone");
			break;

			case "drop":
			e.preventDefault();
			projectList.classList.remove("dropzone");
			var items = e.dataTransfer.items;
			handleDroppedItems(items);
			break;
		}

	};

	var addNewProject = function() {
		XioPop.prompt("Enter the project's name", "", "", function(projectName) {
			if(projectName) {
				var xhr = new XMLHttpRequest();
				xhr.open("get", "/scripts/new_project.php?projectName="+projectName, true);

				xhr.onload = function(e) {
					if(e.target.status===200) {
						loadProjects();
					}
				};
				xhr.send();
			}
		});
	};

	var getProject = function(id) {
		if(projects && projects.hasOwnProperty(id)) {
			return projects[id];
		}
		return false;
	};

	var clear = function() {
		projects = null;
		projectList.innerHTML = "";
	};

	var updateLastOpened = function(projectId) {
		Ajax.post2JSON("/scripts/project_config.php?action=updateLastOpened", {project_id: projectId}, function(json) {
			if(json.status===STATUS_OK) {
				if(projects && projects.hasOwnProperty(projectId)) {
					projects[projectId].last_opened = json.last_opened;
				}
			} else {
				console.warn("could not update last_opened");
			}
		});
	};

	var handleDroppedItems = function(items) {
		console.log("dropped items:", items);

		var rootEntries = [];
		for(var i=0; i<items.length; i++) {
			var item = items[i];
			console.log("root item"+i, item.kind);

			switch(item.kind) {
				case "file":
				var entry = item.webkitGetAsEntry();
				if(entry) rootEntries.push(entry);
				break;

				default:
				console.warn("Drop does not handle items of type:", item.kind);
				console.debug(item);
			}
		}

		if(rootEntries.length>0) {
			console.log("Vad vill du göra med dessa", rootEntries.length, "root items");


			var options = [
				{id:"OneProject", text:"Create one project including these items"},
				{id:"SplitProjects", text:"Split up into " + rootEntries.length + " separate projects"}
			];
			XioPop.choose("Drop action", rootEntries.length+" items was dropped, what do you want to do with them?", options, chooseCallback);

			function chooseCallback(answer) {
				console.log("Answer:", answer);
			}

		}

		function handleEntry(entry) {
			if(entry.isDirectory) {
				console.log("DIR FOUND:", entry.fullPath);
				handleDirectory(entry);
			} else {
				handleFile(entry);
			}
		}

		function handleDirectory(dir) {
			var directoryReader = dir.createReader();
			var readEntries = function() {
				directoryReader.readEntries (function(results) {
					if (!results.length) {
						console.log("done", dir.fullPath);
					} else {
						for(var i=0; i<results.length; i++) {
							handleEntry(results[i]);
						}
						readEntries();
					}
				}, errorHandler);
			};
			var errorHandler = function(e) {
				console.log("error:", e);
			}
			readEntries();
		}

		function handleFile(file) {
			console.log("FILE:", file.fullPath);
		}
	}




	return {
		clear: clear,
		setOrderBy: setOrderBy,
		getProject: getProject,
		loadProjects: loadProjects,
		updateLastOpened: updateLastOpened
	};
})();