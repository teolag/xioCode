var ProjectList = (function() {

	var projects, projectsArrayByName, projectsArrayByDate;
	var projectList, txtProjectFilter, btnNewProject;
	var tags, listTags;

	var init = function() {
		projectList = document.getElementById('projectList');
		projectList.addEventListener("click", clickHandler, false);
		projectList.addEventListener("mouseover", hoverSelect, false);
		
		txtProjectFilter = document.getElementById('txtProjectFilter');
		txtProjectFilter.addEventListener("search", filterProjects);
		txtProjectFilter.addEventListener("keydown", keyDown);
		txtProjectFilter.addEventListener("keyup", filterProjects);
		
		btnNewProject = document.getElementById("btnNewProject");
		btnNewProject.addEventListener("click", addNewProject, false);
		
		listTags = document.getElementById("listProjectTags");
		//listTags.addEventListener("click", addNewProject, false);
		
		
	};
	
	var loadProjects = function() {
		if(!projectList) init();
		
		Ajax.getJSON("/scripts/get_all_projects.php", null, 
			function(json) {
				projects = json;
				
				getUniqueTags();
				
				projectsArrayByName = Object.keys(projects);
				projectsArrayByDate = Object.keys(projects);
				
				projectsArrayByName.sort(function(a,b) {
					var n1 = projects[a].name;
					var n2 = projects[b].name;
				
					if (n1 < n2) return -1;
					if (n1 > n2) return 1;
					return 0;
				});
				projectsArrayByDate.sort(function(a,b) {
					var c1 = projects[a].created || 0;
					var c2 = projects[b].created || 0;
					return c2-c1;
				});
				
				display();
				updateTagList();
				console.log("%i projects found", Object.keys(projects).length, projects);
				filterProjects();
				
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
		tags.forEach(function(tag, i) {
			var li = document.createElement("LI");
			li.textContent = tag;
			listTags.appendChild(li);
		});
	}
	
	
	
	var display = function() {
		var projectsHTML=["<table>"];
		projectsArrayByName.forEach(function(id, i) {
			var item = projects[id];
			projectsHTML.push("<tr data-project_id='"+id+"'>");
			projectsHTML.push("<td class='name'>"+item.name+"</td>");
			projectsHTML.push("<td class='description'>"+(item.description? item.description : '')+"</td>");
			projectsHTML.push("<td class='functions'>");
			projectsHTML.push("<a href='#' data-do='config'>Config</a>");
			projectsHTML.push("<a href='#' data-do='rename'>Rename</a>");
			projectsHTML.push("<a href='#' data-do='delete'>Delete</a>");
			projectsHTML.push("<a href='#' data-do='preview'>Preview</a>");
			projectsHTML.push("</td>");
			projectsHTML.push("</tr>");
		});
		projectsHTML.push("</table>");
		projectList.innerHTML = projectsHTML.join("");
	};
	
	
	var clickHandler = function(e) {
		var target = e.target;
		var doo;

		if(target.nodeName==="A") {
			doo = target.dataset.do;
			console.log("Do", doo);
			e.preventDefault();
		}

		var tr = target;		
		while(tr.nodeName!=="TR") {
			if(tr===projectList) return;
			tr = tr.parentElement;
		}
		var projectId = tr.dataset.project_id;

		switch(doo) {

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
			setHash(projectId+"/"+UNSAVED_FILENAME);
		}	
	};
	
	
	var hoverSelect = function(e) {
		var target = e.target;
		while(target.nodeName !== "TR") {
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
			var projectElement = projectList.querySelector("tr.selected");
			setHash(projectElement.getAttribute('data-project_id')+"/"+UNSAVED_FILENAME);
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
		console.log("filter projects '"+searchString+"'", txtProjectFilter, projects);

		for(var id in projects) {
			if (projects.hasOwnProperty(id)) {
				var project = projects[id];

				var tr = projectList.querySelector("tr[data-project_id='"+id+"']");
				if(project.name.toLowerCase().search(searchString)!=-1) {
					tr.classList.remove('hidden');
				} else {
					tr.classList.add('hidden');
				}
				
			}
		}
		var sel = projectList.querySelector("tr.selected");
		if(!sel || sel.classList.contains("hidden")) {
			var found = selectNextVisible(true);
			if(!found) selectNextVisible();
		}		
	}
	
	var selectNextVisible = function(rev){
		var sel = projectList.querySelector("tr.selected");
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
			sel = projectList.querySelector("tr");
			deselectAll();
			sel.classList.add("selected");
			return true;
		}
		return false;
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

	
	
	
	return {
		isLoaded: isLoaded,
		clear: clear,
		getProject: getProject,
		loadProjects: loadProjects
	};	
})();