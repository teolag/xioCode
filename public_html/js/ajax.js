var Ajax = (function() {
	var xhr,

	get = function(url, parameters, successCallback, errorCallback) {
		if(parameters && Object.keys(parameters).length>0) {
			url = url + "?" + obj2querystring(parameters);
		}
		xhr = new XMLHttpRequest();
		xhr.open("get", url, true);
		xhr.onload = function(e) {
			if(e.target.status===200) {
				if(successCallback) successCallback(e.target);
			} else {
				if(errorCallback) errorCallback(e.target);
			}
		};
		xhr.send();
	},
	
	getJSON = function(url, parameters, successCallback, errorCallback) {
		if(parameters && Object.keys(parameters).length>0) {
			url = url + "?" + obj2querystring(parameters);
		}
		xhr = new XMLHttpRequest();
		xhr.responseType='json';
		xhr.open("get", url, true);
		xhr.onload = function(e) {
			if(e.target.status===200) {
				if(successCallback) successCallback(e.target.response);
			} else {
				if(errorCallback) errorCallback(e.target);
			}
		};
		xhr.send();	
		
	},

	post = function(url, parameters, successCallback, errorCallback) {
		var sendData;
		if(parameters && Object.keys(parameters).length>0) {
			sendData = obj2querystring(parameters);
		}
		
		xhr = new XMLHttpRequest();
		xhr.open("post", url, true);		
		xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xhr.onload = function(e) {
			if(e.target.status===200) {
				if(successCallback) successCallback(e.target);
			} else {
				if(errorCallback) errorCallback(e.target);
			}
		};
		xhr.send(sendData);
	},
	
	postForm = function(url, form, successCallback, errorCallback) {
		var formData = new FormData(form);
		var xhr = new XMLHttpRequest();
		xhr.open("post", url, true);
		xhr.onload = function(e) {
			if(e.target.status===200) {
				if(successCallback) successCallback(e.target);
			} else {
				if(errorCallback) errorCallback(e.target);
			}
		};
		xhr.send(formData);
	},
	
	
	postFormDataWithJsonResponse = function(url, formData, successCallback, errorCallback) {
		var xhr = new XMLHttpRequest();
		xhr.responseType='json';
		xhr.open("post", url, true);
		xhr.onload = function(e) {
			if(e.target.status===200) {
				if(successCallback) successCallback(e.target.response);
			} else {
				if(errorCallback) errorCallback(e.target);
			}
		};
		xhr.send(formData);	
	},
	
	
	
	obj2querystring = function(obj) {
		var parts = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
			}
		}
		return parts.join("&");
	};

	return {
		get: get,
		getJSON: getJSON,
		post: post,
		postForm: postForm,
		postFormDataWithJsonResponse: postFormDataWithJsonResponse
	};
})();