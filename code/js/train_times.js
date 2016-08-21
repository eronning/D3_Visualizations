// Get the data
var formatTime = d3.time.format("%H:%M");
// stations information
var stations = []; 
// get the data for the station times and the 
d3.csv("data/hyperloop.csv", function(error, data) {
    d3.csv("data/city_distances.csv", function(error, d) {
        // gather all of the station data
        var counter = 0;
        for (i in d) {
        	// add station information to list
            stations.push({
                name: d[i].city1,
                distance: counter,
            });
            // update the distance count
            counter += +d[i].miles;
        }
        // add the last station to the list
        stations.push({
            name: d[d.length - 1].city2,
            distance: counter,
        });
        // setup the margins
        var margin = {top: 20, right: 30, bottom: 20, left: 100},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;
        // create a x variable
        var x = d3.time.scale()
            .domain([parseTime("6:00"), parseTime("23:00")])
            .range([0, width]);
        // create a y variable
        var y = d3.scale.linear()
            .range([0, height]);
        // setup the x-axis
        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(18)
            .tickFormat(formatTime)
            .innerTickSize(-width);
        // setup the svg and append it the appropriate element
        var svg = d3.select("#chart-2").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("y", -margin.top)
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom);
        // set the domain for the y-axis (sets the spacing between elements)
        y.domain(d3.extent(stations, function(d) { return d.distance; }));
        // make a station
        var station = svg.append("g")
            .attr("class", "station")
            .selectAll("g")
            .data(stations)
            .enter().append("g")
            .attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; });
        // write the text for the stations (y-axis)
        station.append("text")
            .attr("x", -6)
            .attr("dy", ".35em")
            .text(function(d) { return d.name; });
        // make a line from a station across the chart
        station.append("line")
            .attr("x2", width);
        // add the top x axis
        svg.append("g")
            .attr("class", "x top axis")
            .call(xAxis.orient("top"));
        // add the bottom x axis
        svg.append("g")
            .attr("class", "x bottom axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis.orient("bottom"));
        // parse all of the train data
        var trains = new Array();
        for (i in data) {
        	// grab data for a given train
            var t = data[i];
            var t_name = t.train_name
            var stops = new Array();
            for (j in stations) {
            	// get the data for a train stop
                var s_name = stations[j].name;
                var dist = stations[j].distance;
                var arrival = parseTime(t[stations[j].name + " arrive"]);
                var depart = parseTime(t[stations[j].name + " depart"]);
                // ensure the time is not null -- add the stop
                if (arrival !=  null) {
                    stops.push({
                        name: s_name,
                        distance: dist,
                        time: arrival
                    });
                }
                // ensure the time is not null -- add the stop
                if (depart != null) {
                    stops.push({
                        name: s_name,
                        distance: dist,
                        time: depart
                    });
                }
            }
            // add the train info
            trains.push({
                name: t.train_name,
                stops: stops
            });
        }
        // make a tool tip for the trains (popup which displays information about a train route)
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                var returnString = "<strong><span style='color:red'>Train: " + d.name + "</span></strong>";
                for (i in d.stops) {
                    var s = d.stops[i];
                    returnString += "<p><span style='color:green'> " + s.name + " </span><span style='color:RoyalBlue'> " + s.time + "</span></p>";
                }
                return returnString;
            })
        svg.call(tip);
        // make a line
        var line = d3.svg.line()
            .x(function(d) { return x(d.time); })
            .y(function(d) { return y(d.distance); });
        // build the train
        var train = svg.append("g")
            .attr("class", "train")
            .selectAll("g")
            .data(trains)
            .enter().append("g")
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width", "4px")
            .attr("class", function(d) { return d.name; });
        // generate the path -- sorting to make sure that it goes from lowest to highest time (deals with trains going overnight)
        train.append("path")
            .attr("d", function(d){ return line(d.stops.sort(function(a,b) {return (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0);} )); })
            .on("mouseover", tip.show)
            .on("mouseleave", tip.hide);
        // lines for times of station stops that appear on hover
        var hoverLines;
       // perform when hovering
        train.on("mouseover", function(d) {
            console.log(this);
        	// highlight train path when hovering over the path
            d3.select(this).select("path")
                .style("stroke", "blue");
            // generate lines that appear at time when train stops at station
            hoverLines = new Array();
            for (i in d.stops) {
            	var hoverLine = svg.append("g")
		            .attr("class", "hover")
		            .selectAll("g")
		            .data(d.stops)
		            .enter().append("g")
		            .style("fill", "none")
		            .style("stroke", "blue")
		            .style("stoke-width", "2px")
            	hoverLine.append("line")
					.attr("x1", x(d.stops[i].time)).attr("x2", x(d.stops[i].time)) // vertical line so same value on each
					.attr("y1", 0).attr("y2", height); // top to bottom	
				hoverLines.push(hoverLine);
            }
        });
        // perform when no longer hovering
        train.on("mouseleave", function(d) {
        	// removes the highlighting from the path
            d3.select(this).select("path")
                .style("stroke", "black");
            // goes through and removes all of the lines that indicate the station stops
            for (i in d.stops) {
            	for (j in hoverLines) {
            		hoverLines[j].remove("line")
						.attr("x1", x(d.stops[i].time)).attr("x2", x(d.stops[i].time)) // vertical line so same value on each
						.attr("y1", 0).attr("y2", height); // top to bottom	
            	}
            }
        })

    });
});
// parses time
function parseTime(s) {
  var t = formatTime.parse(s);
  if (t != null && t.getHours() < 3) t.setDate(t.getDate() + 1);
  return t;
}
