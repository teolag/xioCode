var OAuth2 = (function(){

	var token, expire,

	authorized = function(data) {
		console.log("authorized:", data);


	},

	getTokenCallback = function(data) {
		console.log("getTokenCallback", data);
	},

	getUserInfo = function() {

	},

	isAuthorized = function() {

	};


	return {
		authorized: authorized,
		getUserInfo: getUserInfo,
		isAuthorized: isAuthorized
	}
}());