var rawEegArray = [];
var medianEeg = null;
var baselineIntegrals = [];
var medianIntegral = null;
var CURRENT_STATE = null;
var START_TIME = null;
var INTEGRAL_START = null;
var BASELINE_START = false;
var BASELINE_COMPLETE = false;
var BLINK_COUNT = 0;
var BLINK_RECOVERY = null;
var ABNORMAL_INTEGRALS = [];

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

  medianEeg = getMedian(rawEegArray);

  rawEegArray = [];
}

function calculateMedianIntegral() {
  console.log('calculating median Integral');

  medianIntegral = getMedian(baselineIntegrals);

  rawEegArray = [];
  BASELINE_COMPLETE = true;
  INTEGRAL_START = null;
}

function calculateIntegral(rawEeg) {
  var integral = 0;
  var indexedIntegral = null;

  for (i = 0; i < rawEegArray.length-1; i++) {
    integral += rawEegArray[i]*2;
  }
  
  emitIntegral(integral);
}

function changeMusic() {
  var musicStreamer = $("#api");
  musicStreamer.rdio().next();
  var musicAlert = $("#music-alert");
  musicAlert.show();
  setTimeout(function() { musicAlert.hide(); }, 4000);
}

function emitIntegral(integral) {

  if (!BASELINE_COMPLETE) {
    baselineIntegrals.push(integral);
  }
  else {
    if (integral > integralMax) {
      indexedIntegral = integralMax;
      }
    else if (integral < integralMin) {
      indexedIntegral = integralMax;
    }
    else if ((integral<leftOkay) || (integral>rightOkay)) {
      ABNORMAL_INTEGRALS.push(integral);
      indexedIntegral = integral;
    }
    else {
      indexedIntegral = integral;
    }
    gauge.value(indexedIntegral);
  }

  INTEGRAL_START = null;
  rawEegArray = [];
}

function start_data(data) {
  console.log('first value');
  START_TIME = Date.now();
  IgnorePhaseTimeStamp = START_TIME + 10000;
  BaseLinePhase1TimeStamp = START_TIME + 20000;
  BaseLinePhase2TimeStamp = START_TIME + 40000;//160000;
}

function stream_data(data) {
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
    show_baseline_message();
    BASELINE_START = true;
  }
  rawEegArray.push(data);
}

function baseline2(data) {

  if (medianEeg === null) {
    calculateMedianEeg();
  }
  
  rawEegArray.push(data);
  updateIntegral();
}

function updateIntegral(data) {
  now = Date.now();

  if (INTEGRAL_START === null) {
    INTEGRAL_START = now;
    IntegralEndTimeStamp = now + 250; //3000;
  }
  else if (now >= IntegralEndTimeStamp) {
    calculateIntegral();
  }
}

function checkAbnormal() {
  console.log('checking to switch music');
  var abnormalCount = ABNORMAL_INTEGRALS.length;
  ABNORMAL_INTEGRALS = [];
  if (abnormalCount >=3) {
      changeMusic();
  }
}

function inSession(data) {

  if (!BASELINE_COMPLETE) {
      calculateMedianIntegral();
      loadSessionElements();
  }

  rawEegArray.push(data);
  updateIntegral();

  if ((Math.abs(data)> medianEeg*4) && !BLINK_RECOVERY && (rawEegArray.length>=5)) {
    checkForBlink();
  }
}

function checkForBlink() {
  var blinkArray = rawEegArray.slice(-5);
  var count = 0;

  for (i = 0; i < blinkArray.length; i++) {
    if (Math.abs(blinkArray[i])> medianEeg*4) {
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