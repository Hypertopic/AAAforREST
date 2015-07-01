function (doc) {
	if (doc.resource === 'log' && doc.params.method !== "GET") {
		emit(doc.params.target.split("/"), 1);
	}
}