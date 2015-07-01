function (doc) {
	if (doc.resource === 'log') {
		var d = new Date(doc.params.timestamp);
		var key = [doc.params.target, (doc.params.login || doc.params.from), d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate(), doc.params.method];
		var Gbkey = [doc.params.target, "", d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate(), doc.params.method];
		emit(key, 1);
		emit(Gbkey, 1);
	}
}