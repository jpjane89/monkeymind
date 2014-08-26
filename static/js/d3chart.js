//This script contains the chart for visualizing brainwave data. It is loaded in 'headset_connection.html' when the session starts

var n = 100;
chartData = new Array(n+1).join('0').split('').map(parseFloat); //this is where data will be added

var margin = {top: 140, right:0, bottom: 100, left: 90},
  width = 1200 - margin.left - margin.right,
  height = 550 - margin.top - margin.bottom;

var x = d3.scale.linear()
  .domain([1, n - 2])
  .range([0, width]);

var y = d3.scale.linear()
  .domain([-80, 80])
  .range([height, 0]);

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d, i) { return x(i); })
  .y(function(d, i) { return y(d); });

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("rect")
    .attr("width", "1108px")
    .attr("height", "330px")
    .attr("fill", "white")
    .attr('stroke', 'black')
    .attr('stroke-width','4');

svg.append("defs").append("clipPath")
  .attr("id", "clip")
.append("rect")
  .attr("width", width+2)
  .attr("height", height+2);

svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + y(0) + ")")
  .call(d3.svg.axis().scale(x).ticks(0).orient("bottom"));

svg.append("g")
  .attr("class", " y axis")
  .call(d3.svg.axis().scale(y).ticks(9).orient("left"));

svg.append("text")
  .attr("class", "y-label")
  .attr("x", -50)
  .attr("text-anchor", "end")
  .attr("y", -70)
  .attr("dy", "1em")
  .attr("transform", "rotate(-90)")
  .text("EEG Voltage (microvolts)");

var path = svg.append("g")
  .attr("clip-path", "url(#clip)")
.append("path")
  .datum(chartData)
  .attr("class", "line")
  .attr("d", line);


function tick(rawEeg) { //this function is called each time a new value comes in

  chartData.push(rawEeg); //adds to array declared above

  path
      .attr("d", line)
      .attr("transform", null)
    .transition()
      .duration(500)
      .ease("linear")
      .attr("transform", "translate(" + x(0) + ",0)");

  chartData.shift();

}
