var XI = (function() {
	var debug = true;

	var actions = {},
	listeners = [],

	fire = function(action) {
		if(debug) console.log("Fire "+action);
		actions[action] = true;
		testAll(action);
	},

	reset = function(action) {
		delete actions[action];
	},

	testAll = function(firedAction) {
		var i = listeners.length;
		while(i--) {
			if(test(listeners[i],firedAction)) {
				if(debug) console.log("All actions fired for", listeners[i]);
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

		var ready = true;
		for(var i=0; i<conds.length; i++) {
			var condition = conds[i];
			if(!actions.hasOwnProperty(condition)) {
				ready = false;
				break;
			}
		}
		return ready;
	};

	return {
		listen: listen,
		stopListen: stopListen,
		fire: fire,
		reset: reset
	}
}());