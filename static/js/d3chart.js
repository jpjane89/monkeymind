
function drawChart() {
  var n = 100,
    // random = d3.random.normal(0, .2),
    data = new Array(n+1).join('0').split('').map(parseFloat)

  var margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = 1060 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

  var x = d3.scale.linear()
    .domain([0, n - 1])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([-.0001, .0001])
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
    .call(d3.svg.axis().scale(x).orient("bottom"));

  svg.append("g")
    .attr("class", "y axis")
    .call(d3.svg.axis().scale(y).orient("left"));

  var path = svg.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);
}

function tick(rawEeg) {

  data.push(rawEeg);

  path
      .attr("d", line)
      .attr("transform", null)
    .transition()
      .duration(500)
      .ease("linear")
      .attr("transform", "translate(" + x(0) + ",0)");

  data.shift();

}
