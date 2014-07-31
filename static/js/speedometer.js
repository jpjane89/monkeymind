var integralMin = medianIntegral - (medianIntegral*0.9);
var leftBad = medianIntegral - (medianIntegral*0.7);
var leftOkay = medianIntegral - (medianIntegral*0.5);
var leftGood = medianIntegral - (medianIntegral*0.3);
var center = medianIntegral - (medianIntegral*0.1);
var rightGood = medianIntegral + (medianIntegral*0.1);
var rightOkay = medianIntegral + (medianIntegral*0.3);
var rightBad = medianIntegral + (medianIntegral*0.5);
var integralMax = medianIntegral + (medianIntegral*0.7);

var svg = d3.select("#speedometer")
        .append("svg:svg")
        .attr("width", 400)
        .attr("height", 400);

var gauge = iopctrl.arcslider()
        .radius(120)
        .events(false)
        .indicator(iopctrl.defaultGaugeIndicator);

gauge.bands([
    {"domain": [integralMin, leftBad], "span":[0.2, 1] , "class": "badL"},
    {"domain": [leftBad, leftOkay], "span":[0.2, 1] , "class": "okay2L"},
    {"domain": [leftOkay, leftGood], "span": [0.2, 1] , "class": "okay1L"},
    {"domain": [leftGood, center], "span": [0.2, 1] , "class": "goodL"},
    {"domain": [center, rightGood], "span": [0.2, 1] , "class": "goodR"},
    {"domain": [rightGood, rightOkay], "span": [0.2, 1] , "class": "okay1R"},
    {"domain": [rightOkay, rightBad], "span": [0.2, 1] , "class": "okay2R"},
    {"domain": [rightBad, integralMax], "span": [0.2, 1] , "class": "badR"},
]);
gauge.axis().orient("in")
        .normalize(true)
        .ticks(9)
        .tickSubdivide(3)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .tickFormat(function (d) { return ''; })
        .scale(d3.scale.linear()
                .domain([integralMin, integralMax])
                .range([-3*Math.PI/4, 3*Math.PI/4]));

var segDisplay = iopctrl.segdisplay()
        .width(80)
        .digitCount(6)
        .negative(false)
        .decimals(0);

svg.append("g")
        .attr("class", "segdisplay")
        .attr("transform", "translate(130, 220)")
        .call(segDisplay);

var blinkText = svg.append('text')
                .text("Blink count")
                .attr("font-family", "Play")
                .attr("font-size", "20px")
                .attr("transform", "translate(130, 265)")
                .attr("fill", "#4CBB17");

svg.append("g")
        .attr("class", "gauge")
        .call(gauge);

segDisplay.value(BLINK_COUNT);
gauge.value(medianIntegral);
    