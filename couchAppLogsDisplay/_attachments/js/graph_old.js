
(function(global, factory) {
	if(typeof(define) === "function" && define.amd) {
		define(['jquery', 'd3', 'moment'], factory);
	} else {
		global.graph = factory($, d3, moment);
	}
}(this, function( $, d3, moment ) {

    var BAR_CHART_CLASSIC = 0,
        BAR_CHART_STACKED = 1,
        BAR_CHART_NORMALIZED = 2;

    /**
     * Internal counter for identify generator (see getUid() function)
     * @type {number}
     */
    var internalCounter = 0;

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
     * Generate internal id
     * @returns {string}
     */
    function getUid() {
        return "__GRAPH_BASIC_" + internalCounter + "__";
    }

    /**
     * Create a new graph
     * @param node
     * @param data
     * @param color
     * @returns {{id: string, node: *, type: string, data: (*|{}), color: (*|null), refresh: Function}}
     */
    function newGraph( node, data, color ) {
        var d3Node = d3.select($(node).get(0))
            .append('svg')
            .attr('class', 'graph');
        var instance = {
            id: getUid(),
            node: d3Node,
            type: 'basicGraph',
            data: data || [],
            dataType: null,
            dataTypeValueLength: 1,
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
                analyzedDataType(this);
                return this;
            },
            getData: function getData() {
                return this.data;
            },
            pushData: function pushData( data ) {
                if(Array.isArray(this.data)) {
                    this.data.push( data );
                } else {
                    require(['core/debugger'], function( Debug ){
                        Debug.error('Data in graph Object is not an array. You can not use pushData.');
                    });
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
        analyzedDataType( instance );
        return instance;
    }

    var DATA_TYPE_EMPTY = 0,
        DATA_TYPE_ARRAY = 1,
        DATA_TYPE_ARRAY_OF_ARRAY = 2,
        DATA_TYPE_ARRAY_OF_OBJECT_DATE = 3,
        DATA_TYPE_ARRAY_OF_OBJECT_DATE_ARRAY = 4,
        DATA_TYPE_ARRAY_OF_OBJECT_INDEX = 5,
        DATA_TYPE_ARRAY_OF_OBJECT_INDEX_ARRAY = 6,
        DATA_TYPE_ERROR = -1;

    /**
     * Analyze data type
     * @param graph
     */
    function analyzedDataType( graph ) {
        var data = graph.data;
        var dataType = DATA_TYPE_EMPTY;
        var dataTypeValueLength = 1;
        if( typeof(data) === "object" ) {
            if(Array.isArray(data)) {
                if(data.length > 0) {
                    var obj = data[0];
                    if( typeof(obj) === "object" ) {
                        if( Array.isArray(obj) ) {
                            dataType = DATA_TYPE_ARRAY_OF_ARRAY;
                            dataTypeValueLength = obj.length;
                        } else {
                            if(typeof(obj.value) === "undefined") {
                                dataType = DATA_TYPE_ERROR;
                            } else {
                                if (typeof(obj.date) !== 'undefined') {
                                    if(Array.isArray(obj.value)) {
                                        dataType = DATA_TYPE_ARRAY_OF_OBJECT_DATE_ARRAY;
                                        dataTypeValueLength = obj.value.length;
                                    } else {
                                        dataType = DATA_TYPE_ARRAY_OF_OBJECT_DATE;
                                    }
                                } else {
                                    if (typeof(obj.index) !== "undefined") {
                                        if(Array.isArray(obj.value)) {
                                            dataType = DATA_TYPE_ARRAY_OF_OBJECT_INDEX_ARRAY
                                            dataTypeValueLength = obj.value.length;
                                        } else {
                                            dataType = DATA_TYPE_ARRAY_OF_OBJECT_INDEX;
                                        }
                                    } else {
                                        dataType = DATA_TYPE_ERROR;
                                    }
                                }
                            }
                        }
                    } else {
                        dataType = DATA_TYPE_ARRAY;
                    }
                }
            }
        }
        graph.dataType = dataType;
        graph.dataTypeValueLength = dataTypeValueLength;
    }

    function D3StartDrawGraph( graph, left, top ) {
        var g = graph.node.select('g');
        if( g.empty() !== null ) {
            g.remove();
        }
        return graph.node.append('g')
            .attr('transform', 'translate(' + left + ', ' + top + ')');
    }

    function prepareGraphData( graph ) {
        if( graph.dataType === DATA_TYPE_ARRAY_OF_OBJECT_DATE || graph.dataType === DATA_TYPE_ARRAY_OF_OBJECT_DATE_ARRAY ) {
            for(var i in graph.data ) {
                graph.data[i].date = moment( graph.data[i].date );
            }
        }
    }

    function getFunctionXForEach( graph, callback ) {
        if(typeof(callback) === "undefined") {
            callback = function(p){return p;};
        }
        switch(graph.dataType) {
            case DATA_TYPE_ARRAY:
                return function( d, i ) { return callback(i); };
                break;
            case DATA_TYPE_ARRAY_OF_ARRAY:
                return function( d, i ) { return callback(i); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_DATE_ARRAY:
                return function( d, i ) { return callback(d.date); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_DATE:
                return function( d, i ) { return callback(d.date); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_INDEX:
                return function( d, i ) { return callback(d.index); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_INDEX_ARRAY:
                return function( d, i ) { return callback(d.index);};
                break;
            default:
                return function( d, i ) { return callback(i); };
        }
    }

    function getFunctionYForEach( graph, index, callback ) {
        if(typeof(index) === "undefined") {
            index = 0;
        }
        if(typeof(callback) === "undefined") {
            callback = function(p){return p;};
        }
        switch(graph.dataType) {
            case DATA_TYPE_ARRAY:
                return function( d, i ) { return callback(d);};
                break;
            case DATA_TYPE_ARRAY_OF_ARRAY:
                return function( d, i ) { return callback(d[index]);};
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_DATE_ARRAY:
                return function( d, i ) { return callback(d.value[index]);};
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_DATE:
                return function( d, i ) { return callback(d.value); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_INDEX:
                return function( d, i ) { return callback(d.value); };
                break;
            case DATA_TYPE_ARRAY_OF_OBJECT_INDEX_ARRAY:
                return function( d, i ) { return callback(d.value[index]);};
                break;
            default:
                return function( d, i ) { return callback(i); };
        }
    }

    function getGraphDataDomain( graph, axis, callback ) {
        if( axis.startAtZero ) {
            return [0, d3.max(graph.data, callback)];
        } else {
            return d3.extent(graph.data, callback);
        }
    }

    function BarChartParseXDomain( data ) {
        if(Array.isArray( data )) {
            return data.map(function( value, index ) { return index; });
        } else {

        }
    }

    function BarChartParseYDomain( data, barChartType ) {
        if( typeof( barChartType ) === "undefined" ) {
            barChartType = BAR_CHART_CLASSIC;
        }
        var callbackParsing = function callbackParsing( value ) {
            if(typeof( value ) === "object") {
                if(Array.isArray( value )) {
                    if( barChartType === BAR_CHART_CLASSIC ) {
                        return d3.max( value, function( value ){ return value; } );
                    }
                    if( barChartType === BAR_CHART_NORMALIZED ) {
                        return 100;
                    }
                    if( barChartType === BAR_CHART_STACKED ) {
                        return d3.sum( data, function( value ) { return value; } );
                    }
                } else {
                }
            } else {
                return value;
            }
        }
        if(Array.isArray( data )) {
            return [0, d3.max(data, callbackParsing)];
        } else {

        }
    }

    function drawBarChart( graph ) {
        var node = graph.node;
        var marginScaleTop = 10;
        var marginScaleRight = 0;
        var marginScaleBottom = 20;
        var marginScaleLeft = 40;
        var width = parseInt(node.style("width")) - marginScaleLeft - marginScaleRight;
        var height =  parseInt(node.style("height")) - marginScaleBottom - marginScaleTop;
        var barChartType = BAR_CHART_CLASSIC;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10);

        var data = graph.data;

        x.domain(BarChartParseXDomain( data ));
        y.domain(BarChartParseYDomain( data, barChartType ));

        var svg = node.append('g')
            .attr('transform', 'translate(' + marginScaleLeft + ', ' + marginScaleTop + ')');

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("x", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Frequency");

        var transformedData = data;
        var dataSerial = 1;
        if( Array.isArray( data ) ) {
            if( typeof( data[0] ) === "object" ) {
                if(Array.isArray( data[0] )) {
                    dataSerial = data[0].length;
                    transformedData = [];
                    for(var i in data) {
                        for(var j in data[i]) {
                            transformedData.push(data[i][j]);
                        }
                    }
                }
            }
        }

        var calcAttrX = function calcAttrX( value, index ) {
            if( dataSerial === 1 ) {
                return x(index);
            } else {
                var currentDec = index % dataSerial;
                var key = (index - currentDec) / dataSerial;
                return x(key) + (x.rangeBand()/dataSerial) * currentDec;
            }
        };
        var calcAttrWidth = function calcAttrWidth( value, index ) {
            if( dataSerial === 1 ) {
                return x.rangeBand();
            } else {
                return x.rangeBand() / dataSerial;
            }
        };
        var calcAttrY = function calcAttrY( value, index ) {
            return y(value);
        };
        var calcAttrHeight = function calcAttrHeight( value, index ) {
            return height - y(value);
        };
        var calcAttrFill = function calcAttrFill( value, index ) {
            return graph.color.normal[index % dataSerial];
        };
        var eventMouseOver = function eventMouseOver( value, index ) {
            d3.select(this).attr("fill", function() { return graph.color.hover[index % dataSerial] })
                .attr('stroke-width', 1)
                .attr('stroke', 'black');
        };
        var eventMouseOut = function eventMouseOut( value, index ) {
            d3.select(this).attr("fill", function() { return graph.color.normal[index % dataSerial] })
                .attr('stroke-width', 0);
        };

        svg.append("g")
            .attr('class', 'serial')
            .selectAll(".bar")
            .data(transformedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", calcAttrX)
            .attr("width", calcAttrWidth)
            .attr("y", calcAttrY)
            .attr("height", calcAttrHeight)
            .attr("fill", calcAttrFill)
            .on('mouseover', eventMouseOver)
            .on('mouseout', eventMouseOut);

    }

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

		graph.refresh = function() {
			var start = moment().subtract(365, 'days');
			var current = start.clone();
		
			graph.data.sort(function(a, b){ return moment(a.date).isAfter(moment(b.date));});

			var dataCalendar = {};
			var maxValue = 0;
			for(var i in graph.data) {
				var obj = graph.data[i];
				var date = moment(obj.date);
				var key = date.year() + "-" + date.month() + "-" + date.date();
				if(typeof(dataCalendar[key])==='undefined') {
					dataCalendar[key] = {
						date: date,
						value: 0
					};
				}
				dataCalendar[key].value += obj.value;
				if(dataCalendar[key].value > maxValue) {
					maxValue = dataCalendar[key].value;
				}
			}
	
			var calendar = [];
			for(var day = 0; day <= 365; day++) {
				var key = current.year() + "-" + current.month() + "-" + current.date()
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
							return (o.moment.week() + (52 - start.week())) * 22
						} else {
							return (o.moment.week() - start.week()) * 22;
						}
					} else {
						return (o.moment.week() + (52 - start.week())) * 22
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
		graph.refresh();
    }

    function drawPieChart( graph ) {
			
        var width = 400
            height = 200
            radius = Math.min(width, height) / 2;
			
        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);
			
		if(typeof(graph.data) === 'object') {
			var d = [];
			for(var i in graph.data) {
				d.push({key: i, value: graph.data[i]});
			}
			d.sort(function(a,b){return b.value - a.value;});
			graph.data = d;
		}
		
		if((graph.data.length * 14 + 8) > height) {
			height = graph.data.length * 14 + 8;
		}
		
		var legendStart = height/2 - (graph.data.length * 7);

		var legend = graph.node.append('g')
            .attr('transform', 'translate(200, ' + legendStart + ')');
		
		
		for(var i in graph.data) {
			legend.append('rect')
				.attr('y', 14 * i)
				.attr('fill', graph.color.normal[i%graph.color.normal.length]);
			if(typeof(graph.data[i].key) !== 'undefined'){
				legend.append('text')
					.attr('x', 24)
					.attr('y', 14 * i + 8)
					.text(graph.data[i].key + ' (' + graph.data[i].value + ')');
			}
		}
		


        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                if(typeof(d) === 'object') {
                    if(Array.isArray(d)) {
                        return d3.sum(d);
                    } else {
						return d.value;
					}
                } else {
                    return d;
                }
            });

        var svg = graph.node.append("g")
            .attr("transform", "translate(100, "+height/2+")");

        var g = svg.selectAll(".arc")
            .data(pie(graph.data))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function( value, index ) { return graph.color.normal[index%graph.color.normal.length] });
			
		graph.node.attr('preserveAspectRatio', 'xMinYMin')
			.attr('class', 'graph-pie')
			.attr('viewBox', '0 0 '+width+' '+height);
    }

    function drawLineChart( graph ) {
        var margin = {
            top: 10,
            right: 0,
            bottom: 20,
            left: 40
        }
        var width = parseInt(graph.node.style("width")) - margin.left - margin.right;
        var height =  parseInt(graph.node.style("height")) - margin.bottom - margin.top;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(6);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(6);



        graph.refresh = function() {
            var svg = D3StartDrawGraph( graph, margin.left, margin.top );

            prepareGraphData(graph);

            //TODO: getFunction ne marche pas ici, on ne veut pas n'importe quel index, on veut le plus gros uniquement !
            x.domain( getGraphDataDomain( graph, graph.params.xAxis, getFunctionXForEach(graph) ) );
            y.domain( getGraphDataDomain( graph, graph.params.yAxis, getFunctionYForEach(graph) ) );

            var xAxisName = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("y", -6)
                .text(graph.params.xAxis.name);

            xAxisName.attr("x", width + 10 - parseInt(xAxisName.style("width")));

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(graph.params.yAxis.name);

            for( var i = 0; i < graph.dataTypeValueLength; i++ ) {
                var line = d3.svg.line()
                    .x( getFunctionXForEach(graph, x) )
                    .y( getFunctionYForEach(graph, i, y) );
                svg.append("path")
                    .datum( graph.data )
                    .attr("class", "line")
                    .attr("stroke", graph.color.normal[i])
                    .attr("d", line);
            }
        };

    }

    return {
        newBarChart: function newBarChart( node, data, option ) {
            if(typeof(option) === "undefined") {
                option = {};
            }
            var graph = newGraph( node, data, GraphColor.blueBasic );
            drawBarChart( graph );
            return graph;
        },
        newPieChart: function newPartChart( node, data, option ) {
            if(typeof(option) === "undefined") {
                option = {};
            }
            var graph = newGraph( node, data, GraphColor.blueBasic );
            drawPieChart( graph );
            return graph;
        },
        newCalendarChart: function newCalendarChart( node, data, option ) {
            if(typeof(option) === "undefined") {
                option = {};
            }
            var graph = newGraph( node, data, GraphColor.blueBasic );
            drawCalendarChart( graph );
            return graph;
        },
        newLineChart: function newLineChart( node, data, option ) {
            if(typeof(option) === "undefined") {
                option = {};
            }
            var graph = newGraph( node, data, GraphColor.blueBasic );
            drawLineChart( graph );
            return graph;
        }

    };
}));