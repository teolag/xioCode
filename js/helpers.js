function toHumanReadableFileSize(bytes, si) {
	var unit = si ? 1000 : 1024;
    if (bytes < unit) return bytes + " bytes";
    var exp = Math.floor(Math.log(bytes) / Math.log(unit));
    var pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");
	var val = bytes/Math.pow(unit, exp);
    return val.toFixed(1) + " " + pre + "B";
}


function toHumanReadableDateTime(ts) {
	if(!ts) return "";
	var ts = new Date(ts);
	var now = new Date();
	var time = ts.toTimeString().substr(0,5);
	var date = ts.toISOString().substr(0,10);

	var diff = ts - now;
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	if(diff<24*60*60*1000 && now.getDate()===ts.getDate()) {
		return "Today " + time;
	} else if(diff<2*24*60*60*1000 && yesterday.getDate()===ts.getDate()) {
		return "Yesterday " + time;
	}
	return date + " " + time;
}


function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}