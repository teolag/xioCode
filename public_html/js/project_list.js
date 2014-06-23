var ProjectList = (function() {

	var projects, projectOrder="name", projectOrderDir="asc", lastSearchString;
	var projectList, txtProjectFilter, btnNewProject, listProjectOrderBy;
	var tags, listTags;

	var init = function() {
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
	};

	var loadProjects = function() {
		if(!projectList) init();

		Ajax.getJSON("/scripts/get_projects.php", null, 
			function(json) {
				projects = json;
				console.log("%i projects found", Object.keys(projects).length, projects);
		
				getUniqueTags();

				display();

				if(activeProject) {
					var pId = activeProject.id
					activeProject = projects[pId];
					activeProject.id = pId;
					document.title = pageTitle + " - " + activeProject.name;
					title.textContent = activeProject.name;
				}
			}
		);
	};
	
	
	var selectOrderBy = function(e) {
		var option = e.target.selectedOptions[0];
		setOrderBy(option.dataset.order, option.dataset.order_dir);
		
		Ajax.post("/scripts/save_user_settings.php", {"projects_order_by":projectOrder, "projects_order_dir":projectOrderDir}, function(e) {
			console.log("User settings callback", e);
		});		
	};
	
	var loadListOrder = function(column, dir) {
		var option = listProjectOrderBy.querySelector("option[data-order='"+column+"'][data-order_dir='"+dir+"']");
		console.log("load order option", option);
		if(option) {
			option.selected="true";
		}
		setOrderBy(column, dir);	
	};
	
	var setOrderBy = function(column, dir) {
		projectOrder = column;
		projectOrderDir = dir;
		display();
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


	var display = function() {
		if(!projects) return;
	
		var sel = projectList.querySelector(".selected");
	
		var projectIds = Object.keys(projects);
		projectIds = sortProjects(projectIds, projectOrder);
	
		var projectsHTML=["<ul>"];
		projectIds.forEach(function(id, i) {
			var item = projects[id];
			projectsHTML.push("<li data-project_id='"+id+"' class='project'>");
			projectsHTML.push("<div class='name'>"+item.name+"</div>");
			projectsHTML.push("<div class='description'>"+ (item.description||"") +"</div>");
			projectsHTML.push("<div class='functions'>");
			projectsHTML.push("<a href='#' data-action='config' class='icon icon-cog'></a>");
			projectsHTML.push("<a href='#' data-action='preview' class='icon icon-preview'></a>");
			projectsHTML.push("</div>");
			projectsHTML.push("</li>");
		});
		projectsHTML.push("</ul>");
		projectList.innerHTML = projectsHTML.join("");
		
		if(sel) {
			var id = sel.dataset.project_id;
			projectList.querySelector("li[data-project_id="+id+"]").classList.add("selected");
		}
		
		updateTagList();
		filterProjects();
	};

	
	var clickHandler = function(e) {
		var target = e.target;
		var action;

		if(target.nodeName==="A") {
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

			case "preview":
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
	}

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
	};

	var selectNextVisible = function(rev){
		var sel = projectList.querySelector(".selected");
		if(sel) {
			var sib = rev? sel.previousSibling : sel.nextSibling;
			while(sib !== null) {
				if(!sib.classList.contains("hidden")) {
					deselectAll();
					sib.classList.add("selected");
					return true;
				}
				sib = rev? sib.previousSibling : sib.nextSibling;
			}
		} else {
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
			var filesToUpload = e.target.files || e.dataTransfer.files;
			console.log("upload files:", filesToUpload);
			
			break;
		}
		
	};

	var addNewProject = function() {
		XioPop.prompt("Enter the projects name", "", "", function(projectName) {
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

	var isLoaded = function() {
		return projects!==null;
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


	return {
		isLoaded: isLoaded,
		clear: clear,
		getProject: getProject,
		loadProjects: loadProjects,
		loadListOrder: loadListOrder,
		display: display,
		updateLastOpened: updateLastOpened
	};
})();