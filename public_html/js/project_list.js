var ProjectList = (function() {

	var projects;
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
	
	
	var display = function() {
		var projectsHTML=[];
		for(var id in projects) {
			if (projects.hasOwnProperty(id)) {
				var item = projects[id];
				projectsHTML.push("<li data-project_id='"+id+"'>");
				projectsHTML.push("<h3>"+item.name+"</h3>");
				projectsHTML.push("<div style='display: block;'>");
				if(item.description) projectsHTML.push("<p>"+item.description+"</p>");
				projectsHTML.push("<a href='#' data-do='rename'>Rename</a>");
				projectsHTML.push("<a href='#' data-do='delete'>Delete</a>");
				projectsHTML.push("</div>");
				projectsHTML.push("</li>");
			}
		}
		console.log("%i projects found", Object.keys(projects).length, projects);
		projectsList.innerHTML = projectsHTML.join("");
		filterProjects();
		readHash();
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
							findProjects();
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


			default:
			setHash(projectId+"/untitled");
		}	
	};
	
	function filterProjects(e) {
		var searchString = projectsFilter.value.toLowerCase();
		if(e && e.which == KEY_ENTER && searchString) {
			var firstItem = document.querySelector("#projectsList li:not(.hidden)");
			setHash(firstItem.getAttribute('data-project_id')+"/untitled");
			return false;
		} else {
			console.log("filter projects '"+searchString+"'", projectsFilter, projects);

			for(var id in projects) {
		  if (projects.hasOwnProperty(id)) {
			var project = projects[id];

			var li = document.querySelector("#projectsList li[data-project_id='"+id+"']");
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
	
	
	var clean = function() {
		projects = null;
		projectsList.innerHTML = "";
	};
	
	var isLoaded = function() {
		return projects!==null;
	};

	
	
	
	return {
		isLoaded: isLoaded,
		clean: clean,
		getProject: getProject,
		loadProjects: loadProjects
	};	
})();