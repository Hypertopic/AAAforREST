/**
	Récupère les variables contenu dans l'URL
**/
function getUrlRequestParams() {
	qs = document.location.search.split("+").join(" ");

	var params = {}, tokens,
		re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])]
			= decodeURIComponent(tokens[2]);
	}

	return params;
}

/**
	Créer un nuage de tags
**/
function createTagCloud(element, tab) {
	var max = 0;
	for(var ipKey in tab) {
		if(ipKey !== "") {
			var currentItem = tab[ipKey];
			//Somme les valeurs contenus dans le sous tableau :
			var total = currentItem.reduce(function(i, u){return i + u.value;}, 0);

			if(total > max) {
				max = total;
			}
			tab[ipKey] = total;
		}
	}
	for(var ipKey in tab) {
		var currentItem = tab[ipKey];
		ftsize = 1 + (Math.log(currentItem) /  Math.log(max) * 2);
		$(element).append('<div style="float:left;margin:5px;"><a style="font-size:'+ ftsize +'em;" href="./user.html?key='+ ipKey + '">' + ipKey + '</a></div>');
	}
}