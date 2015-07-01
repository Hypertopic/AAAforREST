(function(global, factory) {
	if(typeof(define) === "function" && Define.amd) {
		define(['jquery', 'd3', 'moment'], factory);
	} else {
		global.graph = factory($, d3, moment);
	}
}(this, function($, d3, moment) {
	var graph = {};
	graph = (function(graph){
		function drawCalendarChart( graph ) {
			var node = graph.node;
			var marginScaleTop = 10;
			var marginScaleRight = 40;
			var marginScaleBottom = 20;
			var marginScaleLeft = 40;
			var calendarSize = 22 * 54;
			var width = calendarSize;
			var svgWidth = width + marginScaleLeft + marginScaleRight;
			var svgHeight = 240;
			var height =  parseInt(node.style("height")) - marginScaleBottom - marginScaleTop;

			var end = moment();
			var start = end.clone().subtract(365, 'days');
			
			node.attr('preserveAspectRatio', 'xMinYMin')
				.attr('class', 'graph-calendar')
				.attr('viewBox', '0 0 '+svgWidth+' ' + svgHeight);
			
			var svg = node.append('g')
					.attr('transform', 'translate(' + marginScaleLeft + ', ' + marginScaleTop + ')');
				
			var xScale = d3.time.scale()
					.domain([start.toDate(), end.toDate()])
					.range([0, calendarSize]);
			var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient('top')
					.ticks(d3.time.month, 1)
					.tickFormat(d3.time.format('%b %Y'));
					
			svg.append("g")
				.attr('transform', 'translate(0, 20)')
				.call(xAxis);
				
			var legend = svg.append("g")
				.attr('transform', 'translate(30, 190)');
				
			legend.append('text')
				.attr('y', 14)
				.text('Less');
			legend.append('text')
				.attr('y', 14)
				.attr('x', 280)
				.text('More');
			
			for(var i = 0; i <= 10; i++) {
				legend.append('rect')
					.attr('x', 36 + 22 * i)
					.attr('fill', graph.color.percent[i]);
			}
			graph._internalSvg = svg;
			redrawCalendarGraph(graph);
		}
		
		function redrawCalendarGraph(graph) {
			var svg = graph._internalSvg;
			var start = moment().subtract(365, 'days');
			var current = start.clone();
					
		
			graph.data.sort(function(a, b){ return moment(a.key).isAfter(moment(b.key));});

			var dataCalendar = {};
			var maxValue = 0;
			for(var i in graph.data) {
				var obj = graph.data[i];
				var date = moment(obj.key);
				var key = date.year() + "-" + date.month() + "-" + date.date();
				if(typeof(dataCalendar[key])==='undefined') {
					dataCalendar[key] = {
						date: date,
						value: 0
					};
				}
				dataCalendar[key].value += obj.value.reduce(function(prev, cur){return prev + cur.value;}, 0);
				if(dataCalendar[key].value > maxValue) {
					maxValue = dataCalendar[key].value;
				}
			}

			var calendar = [];
			for(var day = 0; day <= 365; day++) {
				var key = current.year() + "-" + current.month() + "-" + current.date();
				if(typeof(dataCalendar[key])!=='undefined') {
					var relativeValue = dataCalendar[key].value / maxValue * 10;
					calendar.push({
						date: key,
						moment: current.clone(),
						color: graph.color.percent[Math.round(relativeValue)],
						value: dataCalendar[key].value
					});
				} else {
					calendar.push({
					date: key,
					moment: current.clone(),
					color: graph.color.neutral[0],
					value: 0
				});
				}
				current.add(1, 'days');
			}
			
			svg.select('.data').remove();
			
			svg.append("g")
				.attr('class', 'data')
				.attr('transform', 'translate(0, 25)')
				.selectAll("rect")
				.data(calendar)
				.enter().append("rect")
				.attr("x", function(o) {
					if(o.moment.years() == start.years()) {
						if(o.moment.week() < start.week()) {
							return (o.moment.week() + (52 - start.week())) * 22;
						} else {
							return (o.moment.week() - start.week()) * 22;
						}
					} else {
						return (o.moment.week() + (52 - start.week())) * 22;
					}
				})
				.attr('data-date', function(o){return o.date;})
				.attr("y", function(o) {
					return o.moment.day()*22;
				})
				.attr("fill", function(o){
					return o.color;
				})
				.append("svg:title")
				.text(function(d){ return d.moment.format('DD[/]MM[/]YYYY') + ' : ' + d.value; });
				
			return graph;
		}
		
		graph.newCalendarChart = function newCalendarChart( node, data, option ) {
			if(typeof(option) === "undefined") {
				option = {};
			}
			var graph = newGraph( node, data, GraphColor.blueBasic );
			drawCalendarChart( graph );
			graph.refresh = function(){ return redrawCalendarGraph(this);};
			return graph;
		};

		return graph;
	})(graph || {});
		/**
		 * Color you can use for styled your graph
		 * @type {{blueBasic: {normal: string[], hover: string[]}}}
		 */
		var GraphColor = {
			blueBasic:{
				neutral:[
					"#DCDCDC"
				],
				percent:[
					"#F3FFFF",
					"#E3F2FD",
					"#BBDEFB",
					"#90CAF9",
					"#64B5F6",
					"#42A5F5",
					"#1E88E5",
					"#1976D2",
					"#1565C0",
					"#0D47A1",
					"#1A237E",
				],
				normal:[
					"#0D47A1",
					"#1976D2",
					"#2196F3",
					"#64B5F6",
					"#BBDEFB",
					"#448AFF",
					"#2962FF"
				],
				hover:[
					"#1565C0",
					"#1E88E5",
					"#42A5F5",
					"#90CAF9",
					"#E3F2FD",
					"#82B1FF",
					"#2979FF"
				]
			}
		};
	/**
	 * Internal counter for identify generator (see getUid() function)
	 * @type {number}
	 */
	var internalCounter = 0;

	/**
	 * Generate internal id
	 * @returns {string}
	 */
	function getUid() {
		return "__GRAPH_BASIC_" + (internalCounter++) + "__";
	}

	/**
	 * Create a new graph
	 * @param node
	 * @param data
	 * @param color
	 * @returns {{id: string, node: *, type: string, data: (*|{}), color: (*|null), refresh: Function}}
	 */
	function newGraph( node, data, color ) {
		//Create svg :
		var d3Node = d3.select($(node).get(0))
			.append('svg')
			.attr('class', 'graph');
		//Create object javascript "Graph" : 
		var instance = {
			id: getUid(),
			node: d3Node,
			type: 'basicGraph',
			data: data || [],
			dataType: null,
			dataTypeValueLength: 1,
			options: {},
			params: {
				xAxis: {
					name: "",
					startAtZero: false
				},
				yAxis: {
					name: "",
					startAtZero: false
				}
			},
			color: color || null,
			setXAxisName: function setXAxisName( name ) {
				this.params.xAxis.name = name;
				return this;
			},
			setXAxisStartAtZero: function setXAxisStartAtZero( value ) {
				this.params.xAxis.startAtZero = value || true;
				return this;
			},
			setYAxisName: function setXAxisName( name ) {
				this.params.yAxis.name = name;
				return this;
			},
			setYAxisStartAtZero: function setXAxisStartAtZero( value ) {
				this.params.yAxis.startAtZero = value || true;
				return this;
			},
			setData: function setData( data ) {
				this.data = data;
				parseData(this);
				return this;
			},
			getData: function getData() {
				return this.data;
			},
			pushData: function pushData( data ) {
				if(Array.isArray(this.data)) {
					this.data.push( data );
				} else {
					if(typeof(console) !== "undefined" && typeof(console.error) !== "undefined") {
						console.error('Data in graph Object is not an array. You can not use pushData.');
					}
				}
				return this;
			},
			cleanData: function cleanData() {
				this.data = [];
				this.dataType = DATA_TYPE_EMPTY;
				return this;
			},
			refresh: function(){return this;}
		};
		parseData( instance );
		return instance;
	}

	/**
		Parse an array to be like the standard data model.
		
	**/
	function parseArrayData( curObj ) {
		var subArray = [];
		for(var j in curObj) {
			var curSubObj = curObj[i];
			if(typeof(curSubObj) === "object") {
				if(typeof(curSubObj.key) !== "undefined" && typeof(curSubObj.value) !== "undefined") {
					//[[{key, value},{key2, value2}]]
					subArray.push(curSubObj);
				} else {
					//[[{key:value, key2:value2}]]
					for(var k in curSubObj) {
						subArray.push({key: k, value: curSubObj[k]});
					}
				}
			} else {
				//[[value, value2]]
				subArray.push({key: j, value: curSubObj});
			}
		}
		return subArray;
	}

	/**
		Parse an object to be like the standard data model.
		
	**/
	function parseObjectData( curObj ) {
		if(typeof(curObj.value) === "object") {
			var subArray = [];
			for(var j in curObj.value) {
				var curSubObj = curObj.value[j];
				if(typeof(curSubObj) === "object") {
					if(typeof(key) !== "undefined" && typeof(value) !== "undefined") {
						subArray.push(curSubObj);
					} else {
						for(var k in curSubObj) {
							subArray.push({key: k, value: curSubObj[k]});
						}
					}
				} else {
					//[{key, {subkey1: value1, subkey2: value2}}]
					subArray.push({key: j, value: curSubObj});
				}
			}
			return {key: curObj.key, value: subArray};
		} else {
			//[{key, value}, {key, value}]
			return {key: curObj.key, value: [{key:0, value:curObj.value}]};
		}
	}

	/**
		Parse data to the standard data model :
		[{key:key, value:[{key:key, value:value}]}]
	**/
	function parseData( graph ) {
		var resultData = [];
		var data = graph.data;
		if( typeof(data) === "object" ) {
			for(var i in data) {
				var curObj = data[i];
				if(typeof(curObj) === "object") {
					if(Array.isArray(curObj)) {
						var parsedData = parseArrayData( curObj );
						resultData.push({key: i, value: parsedData});
					} else {
						if(typeof(curObj.key) !== "undefined" && typeof(curObj.value) !== "undefined") {
							var parsedData = parseObjectData( curObj );
							resultData.push( parsedData );
						} else {
							//[{key:value, key2:value2}]
							var subArray = [];
							for(var j in curObj) {
								var curSubObj = curObj[j];
								subArray.push({key: j, value: curSubObj});
							}
							resultData.push({key: i, value: subArray});
						}
					}
				} else {
					resultData.push({key:i, value:[{key:0, value: curObj}]});
				}
			}
		}
		graph.data = resultData;
	}
	/***
		Pie Chart File
	**/
	graph = (function(libGraph){

		/**
			parse data for the pie
			@param data[] array to be parse
			@returns dataParsed[]
		**/
		function parsePieData( data ) {
			var parseData = [];
			
			for(var i in data) {
				var currentData = data[i];
				if(typeof(currentData.value) === "object" && Array.isArray(currentData.value)) {
					parseData.push({key: currentData.key, value: currentData.value.reduce(function(prev, cur){return prev + cur.value;}, 0)});
				} else {
					parseData.push({key: currentData.key, value: currentData.value});
				}
			}
			
			parseData.sort(function(a, b){return b.value - a.value;});
			
			return parseData;
		}

		
		/**
			Create legend on the target node
		**/
		function createLegend( svgNode, graph, pieData ) {
			for(var i in pieData) {
				svgNode.append('rect')
					.attr('y', 14 * i)
					.attr('fill', graph.color.normal[i%graph.color.normal.length]);
				if(typeof(pieData[i].key) !== 'undefined'){
					svgNode.append('text')
						.attr('x', 24)
						.attr('y', 14 * i + 8)
						.text(pieData[i].key + ' (' + pieData[i].value + ')');
				}
			}
		}
		
		function drawPieChart( graph ) {
				
			var width = 200,
				height = 200,
				radius = Math.min(width, height) / 2,
				posX =  100,
				posY = 100;
				
			var arc = d3.svg.arc()
				.outerRadius(radius - 10)
				.innerRadius(0);
			
			
			var pieData = parsePieData(graph.data);
			
			graph.node.selectAll('g').remove();
					
			switch(graph.options.legend || libGraph.PieChart.legend.RIGHT) {
				case libGraph.PieChart.legend.RIGHT:
					width += 200;
					if((pieData.length * 14 + 8) > height) {
						height = pieData.length * 14 + 8;
						posY = height / 2;
					}
					
					var legendStart = height/2 - (graph.data.length * 7);

					var legendNode = graph.node.append('g')
						.attr('transform', 'translate(200, ' + legendStart + ')');

					createLegend( legendNode, graph, pieData );
					break;
				case libGraph.PieChart.legend.BOTTOM:
					height += pieData.length * 14 + 8;
					var legendStart = 200;

					var legendNode = graph.node.append('g')
						.attr('transform', 'translate(0, ' + legendStart + ')');

					createLegend( legendNode, graph, pieData );
					break;
			}



			var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) {
					return d.value;
				});

			var svg = graph.node.append("g")
				.attr("transform", "translate(" + posX + ", " + posY + ")");

			var g = svg.selectAll(".arc")
				.data(pie(pieData))
				.enter().append("g")
				.attr("class", "arc");

			g.append("path")
				.attr("d", arc)
				.style("fill", function( value, index ) { return graph.color.normal[index%graph.color.normal.length] });
				
			graph.node.attr('preserveAspectRatio', 'xMinYMin')
				.attr('class', 'graph-pie')
				.attr('viewBox', '0 0 '+width+' '+height);
		}
		
		/**
			PieChart constant
		**/
		libGraph.PieChart = {
			legend: {
				NONE: 0,
				BOTTOM: 1,
				RIGHT: 2
			}
		};
		
		libGraph.newPieChart = function newPartChart( node, data, options ) {
			var graph = newGraph( node, data, GraphColor.blueBasic );
			graph.options = options || {};
			drawPieChart( graph );
			graph.refresh = function(){drawPieChart(this);return this;};
			return graph;
		};
			
		return libGraph;
	})(graph || {});
	return graph;
}));