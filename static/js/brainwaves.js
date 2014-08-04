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

function calculateIntegral(rawEeg) {
  var integral = 0;
  var indexedIntegral = null;

  for (i = 0; i < RAW_EEG_ARRAY.length-1; i++) {
    integral += RAW_EEG_ARRAY[i]*2;
  }
  
  emitIntegral(integral);
}

function pauseMusic() {
  var musicStreamer = $("#api");
  musicStreamer.rdio().pause();

  setTimeout(function() { musicStreamer.rdio().play(); }, 2000);

  var musicAlert = $("#music-alert");
  musicAlert.show();
  setTimeout(function() { musicAlert.hide(); }, 3000);
}

function emitIntegral(integral) {

  if (!BASELINE_COMPLETE) {
    BASELINE_INTEGRALS.push(integral);
  }
  else {
    if (integral > integralMax) {
      indexedIntegral = integralMax;
      }
    else if (integral < integralMin) {
      indexedIntegral = integralMax;
    }
    else if ((integral<leftOkay) || (integral>rightOkay)) {
      TEMP_ABNORMAL_INTEGRALS +=1;
      indexedIntegral = integral;
    }
    else {
      indexedIntegral = integral;
    }
    gauge.value(indexedIntegral);
  }

  INTEGRAL_START = null;
  RAW_EEG_ARRAY = [];
}

function startData(data) {
  console.log('first value');
  START_TIME = Date.now();
  IgnorePhaseTimeStamp = START_TIME + 5000;
  BaseLinePhase1TimeStamp = START_TIME + 15000;
  BaseLinePhase2TimeStamp = START_TIME + 25000;
}

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
    showBaselineMessage();
    BASELINE_START = true;
  }
  RAW_EEG_ARRAY.push(data);
}

function baseline2(data) {

  if (MEDIAN_EEG === null) {
    calculateMedianEeg();
  }
  
  RAW_EEG_ARRAY.push(data);
  updateIntegral();
}

function updateIntegral(data) {
  now = Date.now();

  if (INTEGRAL_START === null) {
    INTEGRAL_START = now;
    IntegralEndTimeStamp = now + 250;
  }
  else if (now >= IntegralEndTimeStamp) {
    calculateIntegral();
  }
}

function checkAbnormal() {
  console.log('checking to switch music');
  if (TEMP_ABNORMAL_INTEGRALS >=2) {
      pauseMusic();
      PAUSE_COUNT += 1;

  }
  TEMP_ABNORMAL_INTEGRALS = 0;
}

function inSession(data) {

  if (!BASELINE_COMPLETE) {
      calculateMedianIntegral();
      loadSessionElements();
  }

  RAW_EEG_ARRAY.push(data);
  updateIntegral();

  if ((Math.abs(data)> MEDIAN_EEG*4) && !BLINK_RECOVERY && (RAW_EEG_ARRAY.length>=5)) {
    checkForBlink();
  }
}

function checkForBlink() {
  var blinkArray = RAW_EEG_ARRAY.slice(-5);
  var count = 0;

  for (i = 0; i < blinkArray.length; i++) {
    if (Math.abs(blinkArray[i])> MEDIAN_EEG*4) {
      count +=1;
    }
  }
  if (count == 5) {
    BLINK_COUNT += 1;
    segDisplay.value(BLINK_COUNT);
    BLINK_RECOVERY = true;
    setTimeout(function() { BLINK_RECOVERY = false; }, 400);
  }
}