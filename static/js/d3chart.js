
var n = 100;
chartData = new Array(n+1).join('0').split('').map(parseFloat);

var margin = {top: 80, right: 100, bottom: 100, left: 120},
  width = 1200 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;

var x = d3.scale.linear()
  .domain([0, n - 1])
  .range([0, width]);

var y = d3.scale.linear()
  .domain([-100, 100])
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

svg.append("defs").append("clipPath")
  .attr("id", "clip")
.append("rect")
  .attr("width", width)
  .attr("height", height);

svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + y(0) + ")")
  .call(d3.svg.axis().scale(x).orient("bottom").tickFormat(function (d) { return ''; }));

svg.append("g")
  .attr("class", " y axis")
  .call(d3.svg.axis().scale(y).orient("left").tickSize(5));

svg.append("text")
  .attr("class", "y-label")
  .attr("x", -140)
  .attr("text-anchor", "end")
  .attr("y", -70)
  .attr("dy", "1em")
  .attr("transform", "rotate(-90)")
  .text("EEG Voltage");

path = svg.append("g")
  .attr("clip-path", "url(#clip)")
.append("path")
  .datum(chartData)
  .attr("class", "line")
  .attr("d", line);

function tick(rawEeg) {

  chartData.push(rawEeg);

  path
      .attr("d", line)
      .attr("transform", null)
    .transition()
      .duration(500)
      .ease("linear")
      .attr("transform", "translate(" + x(0) + ",0)");

  chartData.shift();

}
