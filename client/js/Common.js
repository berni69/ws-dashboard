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
String.prototype.hashCode = function () {
	var hash = 0, i, chr, len;
	if (this.length === 0) return hash;
	for (i = 0, len = this.length; i < len; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

function User(args) {
	if (typeof args === 'undefined') {
		this.idUsuario = '';
		this.userName = '';
		this.avatar = '';
		this.color = '';
	} else {
		this.idUsuario = args.idUsuario;
		this.avatar = args.avatar;
		this.color = args.color;
		this.userName = args.userName;
	}
};