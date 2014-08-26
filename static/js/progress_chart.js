//this script contains chart for displaying progress on the 'welcome' page and is contained within 'welcome.html'

function displayProgress(data) {

  var chartData = JSON.parse(data);
  console.log(chartData);

  var margin = {top: 180, right: 30, bottom: 30, left: 60},
  width = 1200 - margin.left - margin.right,
  height = 580 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .domain(chartData.map(function(d) { return d.session_id; })) //session number on X axis
      .rangeRoundBands([0, width], 0.2);

  var y = d3.scale.linear()
      .domain([0, d3.max(chartData, function(d) { return d.pause_per_min; })]) //pauses per minute on Y axis
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(0)
      .tickPadding(10);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickValues(0)
      .ticks(0);

  var tip = d3.tip() //formats data that displays when you hover over a bar
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "Date: <span style='color:#009ACD'>" + new Date(d.date).toDateString() + "</span> </br>" + "Start time: <span style='color:#009ACD'>" + d.start_time +"</span> </br>" + "Pauses per 5 min: <span style='color:#009ACD'>" + d.pause_per_min + "</span>";
    });

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.call(tip);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll(".bar")
        .data(chartData)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.session_id); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.pause_per_min); })
        .attr("height", function(d) { return height - y(d.pause_per_min); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

}