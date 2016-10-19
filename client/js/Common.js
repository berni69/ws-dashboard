String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	var s1 = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return target.replace(new RegExp(s1, 'g'), replacement);
};

String.prototype.processTemplate = function (values) {
	var target = this;
	var div = this;
	for (var property in values) {
		if (values.hasOwnProperty(property)) {
			div = div.replaceAll('{{' + property + '}}', values[property]);
		}
	}
	return div;
};