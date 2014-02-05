var ProjectList = (function() {

	var projects, projectsArrayByName, projectsArrayByDate;
	var projectsList, projectsFilter, btnNewProject;

	var init = function() {
		projectsList = document.getElementById('projectsList');
		projectsList.addEventListener("click", clickHandler, false);
		
		projectsFilter = document.getElementById('projectsFilter');
		projectsFilter.addEventListener("search", filterProjects);
		projectsFilter.addEventListener("keyup", filterProjects);
		
		btnNewProject = document.getElementById("btnNewProject");
		btnNewProject.addEventListener("click", addNewProject, false);
	};
	
	var loadProjects = function() {
		if(!projectsList) init();
		
		Ajax.getJSON("/scripts/get_all_projects.php", null, 
			function(json) {
				projects = json;
				
				projectsArrayByName = Object.keys(projects);
				projectsArrayByDate = Object.keys(projects);
				
				projectsArrayByName.sort(function(a,b) {
					var n1 = projects[a].name;
					var n2 = projects[b].name;
				
					if (n1 < n2) return -1;
					if (n1 > n2) return 1;
					return 0;
				});
				console.log(projectsArrayByDate);
				projectsArrayByDate.sort(function(a,b) {
					var c1 = projects[a].created || 0;
					var c2 = projects[b].created || 0;
					return c2-c1;
				});
				console.log(projectsArrayByDate);
				
				display();
				console.log("%i projects found", Object.keys(projects).length, projects);
				filterProjects();
				readHash();
				
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
	
	
	
	var display = function() {
		var projectsHTML=[];
		projectsArrayByDate.forEach(function(id, i) {
			var item = projects[id];
			projectsHTML.push("<li data-project_id='"+id+"'>");
			projectsHTML.push("<h3>"+item.name+"</h3>");
			projectsHTML.push("<div style='display: block;'>");
			if(item.description) projectsHTML.push("<p>"+item.description+"</p>");
			projectsHTML.push("<a href='#' data-do='config'>Config</a>");
			projectsHTML.push("<a href='#' data-do='rename'>Rename</a>");
			projectsHTML.push("<a href='#' data-do='delete'>Delete</a>");
			projectsHTML.push("</div>");
			projectsHTML.push("</li>");
		});
		projectsList.innerHTML = projectsHTML.join("");
	};
	
	
	var clickHandler = function(e) {
		var target = e.target;
		var doo;

		if(target.nodeName==="A") {
			doo = target.dataset.do;
			console.log("Do", doo);
			e.preventDefault();
		}

		var li = target;		
		while(li.nodeName!=="LI") {
			if(li==projectsList) return;
			li = li.parentElement;
		}
		var projectId = li.dataset.project_id;

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
			openProjectConfig(projectId);
			break;


			default:
			setHash(projectId+"/"+UNSAVED_FILENAME);
		}	
	};
	
	function filterProjects(e) {
		var searchString = projectsFilter.value.toLowerCase();
		if(e && e.which == KEY_ENTER && searchString) {
			var firstItem = projectsList.querySelector("li:not(.hidden)");
			setHash(firstItem.getAttribute('data-project_id')+"/"+UNSAVED_FILENAME);
			return false;
		} else {
			console.log("filter projects '"+searchString+"'", projectsFilter, projects);

			for(var id in projects) {
				if (projects.hasOwnProperty(id)) {
					var project = projects[id];

					var li = projectsList.querySelector("li[data-project_id='"+id+"']");
					if(project.name.toLowerCase().search(searchString)!=-1) {
						li.classList.remove('hidden');
					} else {
						li.classList.add('hidden');
					}
				}
			}
		}
	}	

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
		if(projects[id]) {
			return projects[id];
		}
		return false;
	};
	
	
	var clear = function() {
		projects = null;
		projectsList.innerHTML = "";
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