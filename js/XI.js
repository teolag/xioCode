var XI = (function() {
	var debug = true;

	var actions = {},
	listeners = [],
	debug=false,

	fire = function(action) {
		if(debug) {
			var exists = actions[action]!==undefined;
			console.debug("XI.fire '"+ action + "'" + (exists? " again":""));
		}
		actions[action] = true;
		testAll(action);
	},

	reset = function(action) {
		delete actions[action];
		if(debug) console.debug("XI.reset", action);
	},

	testAll = function(firedAction) {
		for(var i=0; i<listeners.length; i++) {
			if(test(listeners[i], firedAction)) {
				var listener = listeners[i];

				if(debug) {
					var name = listener.callback.name;
					if(!name) name = "Anonymous function";
					else name = "function '" + name + "'";
					console.debug("All conditions met for " + name, listener.conditions);
				}

				listener.callback();
				if(!listener.keep) {
					listeners.splice(i,1);
					i--;
				}
			}
		}
	},

	listen = function(conditions, callback, keep) {
		if(!Array.isArray(conditions)) {
			conditions = [conditions];
		}
		var listener = {conditions:conditions, callback:callback, keep:keep};
		if(debug) console.debug("Add listener for", conditions, callback.name);

		if(test(listener)) {
			if(debug) console.debug("All conditions was already met for " + callback.name, conditions);
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
		if(firedAction && conds.indexOf(firedAction)===-1) return false

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