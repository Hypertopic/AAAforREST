function (doc) {
	if (doc.resource === 'log') {
		var d = new Date(doc.params.timestamp);
		emit([(doc.params.login || doc.params.from), d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate(), doc.params.method, doc.params.result], 1);
		emit(['', d.getFullYear()+'-' + (1+d.getMonth())+'-' + d.getDate(), doc.params.method, doc.params.result], 1);
	}
}