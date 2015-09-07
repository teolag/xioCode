var XI = (function() {
	var debug = true;

	var actions = {},
	listeners = [],
	debug=false,

	fire = function(action) {
		if(debug) console.log("Fire "+action);
		actions[action] = true;
		if(debug) console.debug("XI.fire", action);
		testAll(action);
	},

	reset = function(action) {
		delete actions[action];
		if(debug) console.debug("XI.reset", action);
	},

	testAll = function(firedAction) {
		var i = listeners.length;
		while(i--) {
			if(test(listeners[i], firedAction)) {
				var name = listeners[i].callback.name;
				if(!name) name = "Anonymous function";
				else name = "function '" + name + "'";

				if(debug) console.debug("All conditions met for " + name);
				listeners[i].callback();
				if(!listeners[i].keep) {
					listeners.splice(i,1);
				}
			}
		}
	},

	listen = function(conditions, callback, keep) {
		if(!Array.isArray(conditions)) {
			conditions = [conditions];
		}
		var listener = {conditions:conditions, callback:callback, keep:keep};

		if(test(listener)) {
			listener.callback();
			return true;
		} else {
			listeners.push(listener);
			return listener;
		}
	},

	stopListen = function(listener) {
		var i=listeners.indexOf(listener);
		if(i !== -1) {
			listeners.splice(i,1);
		}
	},

	test = function(listener, firedAction) {
		var conds = listener.conditions;
		if(conds.indexOf(firedAction)===-1) return false

		for(var i=0; i<conds.length; i++) {
			var condition = conds[i];
			if(!actions.hasOwnProperty(condition)) {
				//if tested listener condition is not fired
				return false;
			}
		}
		// all condition must have been fired
		return true;
	},

	enableDebug = function() {
		debug=true;
	};

	return {
		listen: listen,
		stopListen: stopListen,
		fire: fire,
		reset: reset,
		enableDebug: enableDebug
	}
}());