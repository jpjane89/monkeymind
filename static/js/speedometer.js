// this script contains the speedometer visualization. It is loaded in 'headset_connection.html' after the baseline ends

//these variables set the bands for the speedometer and determine what is "normal" vs. "abnormal"
var integralMin = MEDIAN_INTEGRAL - (MEDIAN_INTEGRAL*0.9); //this sets the minimum value that will show on the chart
var leftBad = MEDIAN_INTEGRAL - (MEDIAN_INTEGRAL*0.7);
var leftOkay = MEDIAN_INTEGRAL - (MEDIAN_INTEGRAL*0.5);//anything less than this is "abnormal"
var leftGood = MEDIAN_INTEGRAL - (MEDIAN_INTEGRAL*0.3);
var center = MEDIAN_INTEGRAL - (MEDIAN_INTEGRAL*0.1);
var rightGood = MEDIAN_INTEGRAL + (MEDIAN_INTEGRAL*0.1);
var rightOkay = MEDIAN_INTEGRAL + (MEDIAN_INTEGRAL*0.3);//anything more than this is "abnormal"
var rightBad = MEDIAN_INTEGRAL + (MEDIAN_INTEGRAL*0.5);
var integralMax = MEDIAN_INTEGRAL + (MEDIAN_INTEGRAL*0.7);//max value

var svg = d3.select("#speedometer")
        .append("svg:svg")
        .attr("width", 400)
        .attr("height", 400);

var gauge = iopctrl.arcslider()
        .radius(120)
        .events(false)
        .indicator(iopctrl.defaultGaugeIndicator);

gauge.bands([ //sets colors to the value-bands on speedometer
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
        .tickValues([integralMin, leftBad, leftOkay, leftGood, center, rightGood, rightOkay, rightBad, integralMax])
        .tickSubdivide(2)
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

segDisplay.value(BLINK_COUNT); //displays blinkcount from 'brainwaves.js'
gauge.value(MEDIAN_INTEGRAL);//starts the speedometer at median integral value from 'brainwaves.js'
    
