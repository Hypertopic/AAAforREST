function (doc) {
	if (doc.resource === 'log' && doc.params.method.toUpperCase() !== "GET") {
		var d = new Date(doc.params.timestamp);
		emit([(doc.params.login || doc.params.from), d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate()], 1);
		emit(['', d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate()], 1);
	}
}