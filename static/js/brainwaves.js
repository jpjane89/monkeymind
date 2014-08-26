// this script contains the system for handling brainwave data

//initialize variables for state system
var RAW_EEG_ARRAY = [];
var MEDIAN_EEG = null;
var BASELINE_INTEGRALS = [];
var MEDIAN_INTEGRAL = null;
var CURRENT_STATE = null;
var START_TIME = null;
var INTEGRAL_START = null;
var BASELINE_START = false;
var BASELINE_COMPLETE = false;
var BLINK_COUNT = 0;
var BLINK_RECOVERY = null;
var PAUSE_COUNT = 0;
var TEMP_ABNORMAL_INTEGRALS = 0;

// handles first incoming value and sets timers for taking baseline
function startData(data) {
  console.log('first value');
  START_TIME = Date.now();
  IgnorePhaseTimeStamp = START_TIME + 5000; //ignore first 5 seconds on input (very noisy)
  BaseLinePhase1TimeStamp = START_TIME + 15000; //next 10 seconds calculate median EEG
  BaseLinePhase2TimeStamp = START_TIME + 25000;//next 10 seconds calculate median integral
}

//handles all subsequent values and sets state based on timestamp
function streamData(data) {
  tick(data);

  time = Date.now();

  if (time < IgnorePhaseTimeStamp) {
    CURRENT_STATE = ignore;
  }
  else if (time < BaseLinePhase1TimeStamp) {
    CURRENT_STATE = baseline1;
  }
  else if (time < BaseLinePhase2TimeStamp) {
    CURRENT_STATE = baseline2;
  }
  else {
    CURRENT_STATE = inSession;
  }

  CURRENT_STATE(data);
}

function ignore(data) {
}

function baseline1(data) {

  if (!BASELINE_START) {
    showBaselineMessage(); //shows baseline message for first time--> see 'session.js'
    BASELINE_START = true;
  }
  RAW_EEG_ARRAY.push(data);
}

function baseline2(data) {

  if (MEDIAN_EEG === null) {
    calculateMedianEeg(); //calculates median EEG at transition to second baseline
  }
  
  RAW_EEG_ARRAY.push(data);
  updateIntegral(); //accumulates integrals for median calculation
}

function inSession(data) {

  if (!BASELINE_COMPLETE) {
      calculateMedianIntegral();
      loadSessionElements(); //loads visual contents --> see 'session.js'
  }

  RAW_EEG_ARRAY.push(data);
  updateIntegral();

  if ((Math.abs(data)> MEDIAN_EEG*4) && !BLINK_RECOVERY && (RAW_EEG_ARRAY.length>=5)) {
    checkForBlink(); //if incoming value is more than 4 times average value and blink didn't just occur, check for blink again
  }
}

function updateIntegral(data) {
  now = Date.now();

  if (INTEGRAL_START === null) {
    INTEGRAL_START = now;
    IntegralEndTimeStamp = now + 250; //accumulates data for 250 ms
  }
  else if (now >= IntegralEndTimeStamp) {
    calculateIntegral();
  }
}

function calculateIntegral(rawEeg) {
  var integral = 0;
  var indexedIntegral = null;

  for (i = 0; i < RAW_EEG_ARRAY.length-1; i++) {
    integral += RAW_EEG_ARRAY[i]*2; //essentially length * width where length is EEG value and width is 2ms --> time between each output
  }
  
  emitIntegral(integral);
}

function emitIntegral(integral) {

  if (!BASELINE_COMPLETE) {
    BASELINE_INTEGRALS.push(integral);
  }
  else {
    if (integral > integralMax) { //formatting integral for appearance on the speedometer
      indexedIntegral = integralMax;
      }
    else if (integral < integralMin) { //formatting integral for appearance on the speedometer
      indexedIntegral = integralMax;
    }
    else if ((integral<leftOkay) || (integral>rightOkay)) {
      TEMP_ABNORMAL_INTEGRALS +=1; //count as "abnormal"
      indexedIntegral = integral;
    }
    else {
      indexedIntegral = integral;
    }
    gauge.value(indexedIntegral); //sets speedometer value to the newest calculating integral --> see 'speedometer.js'
  }

  INTEGRAL_START = null; //reset the integral variables
  RAW_EEG_ARRAY = [];
}

function checkForBlink() {
  var blinkArray = RAW_EEG_ARRAY.slice(-5); //take last five values
  var count = 0;

  for (i = 0; i < blinkArray.length; i++) {
    if (Math.abs(blinkArray[i])> MEDIAN_EEG*4) {
      count +=1;
    }
  }
  if (count == 5) { //register as blink if last 5 were all 4* average value
    BLINK_COUNT += 1;
    segDisplay.value(BLINK_COUNT);
    BLINK_RECOVERY = true;
    setTimeout(function() { BLINK_RECOVERY = false; }, 400); //don't look at values for 400ms
  }
}

function checkAbnormal() {
  console.log('checking to switch music');
  if (TEMP_ABNORMAL_INTEGRALS >=2) { // every 1 second, check the abnormal count. Should be about 4 values. If more than half (2) are abnormal, trigger pause.
      pauseMusic();
      PAUSE_COUNT += 1;

  }
  TEMP_ABNORMAL_INTEGRALS = 0;
}

function pauseMusic() {
  var musicStreamer = $("#api"); //Rdio player--> see 'rdio_player.js'
  musicStreamer.rdio().pause();

  setTimeout(function() { musicStreamer.rdio().play(); }, 2000); //restarts music 2s later

  var musicAlert = $("#music-alert"); //visual alert pops up
  musicAlert.show();
  setTimeout(function() { musicAlert.hide(); }, 3000);
}

function getMedian(list) {
  list.sort (function(a,b) {return a-b;} );

  var half = Math.floor(list.length/2);

  if (list.length % 2) {
    return list[half];
  }
  else {
    return (list[half-1] + list[half+1]/2.0);
  }
}

function calculateMedianEeg() {
  console.log('calculating median EEG');

  MEDIAN_EEG = getMedian(RAW_EEG_ARRAY);

  RAW_EEG_ARRAY = [];
}

function calculateMedianIntegral() {
  console.log('calculating median Integral');

  MEDIAN_INTEGRAL = getMedian(BASELINE_INTEGRALS);

  RAW_EEG_ARRAY = [];
  BASELINE_COMPLETE = true;
  INTEGRAL_START = null;
}