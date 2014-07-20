var Preview = (function() {
	
	var
	container, frame,
	visible=false,
	refreshOnSave=true,
	
	init = function() {
		console.log("init preview");
		container = document.getElementById("preview");
		frame = document.getElementById("previewFrame");
	
		window.addEventListener("resize", fixLayout, false);
		
		hide();
	},
	
	
	show = function() {
		visible=true;
		container.style.display = "flex";
		fixLayout();
	},
	
	hide = function() {
		visible=false;
		container.style.display = "none";
	},
	
	load = function(url) {
		frame.src=url;
	},
	
	refresh = function() {
		if(!visible) return;
		console.log("Refresh preview", frame.src);
		if(frame.src!=="blank") {
			frame.src = frame.src;
		}
	},
	
	isVisible = function() {
		return visible;
	},
	
	doRefreshOnSave = function() {
		return refreshOnSave;
	},
	
	fixLayout = function() {
		if(!visible) return;
	
		frame.style.height=(container.offsetHeight-15)+"px";
	};
	
	
	return {
		init: init,
		fixLayout: fixLayout,
		show: show,
		hide: hide,
		load: load,
		refresh: refresh,
		isVisible: isVisible,
		doRefreshOnSave: doRefreshOnSave
	}
}());