//Configuration :

var conf = require('./conf');
var databaseName = conf.database.name || 'aaaforrest';
var databaseUrl = conf.database.url || 'http://localhost:5984';
var fileList = conf.files

//Constants :
var bulkSize = 1000;
var timeBetweenFile = 45000;
var timeBetweenRequest = 15;

//Filesystem Node API :
var fs = require("fs");
//CSV Stream:
var csvStream = require('csv-stream');
//CouchDB :
var nano = require('nano')(databaseUrl);
//Console log :
var console = require('console');


var csvStreamOptions = {
    delimiter : '\t',
    endLine : '\n',
	columns: ['timestamp', 'from', 'method', 'target', 'result']
}

var itemList = [];

function insert(db, tab, key) {
	console.log((key / tab.length * 100) + '%');
	var endKey = key + bulkSize;
	if(tab.length < endKey) {
		endKey = tab.length + 1;
	}
	db.bulk({docs:tab.slice(key, endKey)});
	if(endKey < tab.length) {
		setTimeout(insert, timeBetweenRequest, db, tab, endKey);
	} else {
		if(currentFile > 0) {
			currentFile--;
			console.log('finish');
			setTimeout(doFile, timeBetweenFile, currentFile);
		}
	}
}

doFile(fileList.length - 1);
var currentFile = fileList.length - 1;

function doFile(i) {
	var fileName = 'logs/' + fileList[i];
	var optionsCSV = csvStreamOptions;
	console.log('start - ' + fileName);
	fs.createReadStream(fileName)
		.pipe(csvStream.createStream(optionsCSV))
		.on('data', function(data){
			itemList.push({params: data, resource: 'log'});
		})
		.on('end',function(){
			var currentDatabase = nano.use(databaseName);
			var i = 0;
			insert(currentDatabase, itemList, 0);
		});
}
