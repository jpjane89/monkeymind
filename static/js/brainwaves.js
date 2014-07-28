var rawEegArray = [];
var medianEeg = 0;
var baselineIntegrals = [];
var medianIntegral = 0;
var CURRENT_STATE = null;
var START_TIME = null;
var WATCH_TIME = null;
var BASELINE_COMPLETE = false;

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

function baseline1() {
  console.log('calculating median EEG');

  medianEeg = getMedian(rawEegArray);

  rawEegArray = [];
  CURRENT_STATE = baseline2;

}

function baseline2() {
  console.log('calculating median Integral');

  medianIntegral = getMedian(baselineIntegrals);

  console.log(medianIntegral);

  rawEegArray = [];
  BASELINE_COMPLETE = true;
  CURRENT_STATE = listenState;
  WATCH_TIME = null;
}

var listenState = function(rawEeg) {

  console.log('in listening state');
  now = Date.now();

  if (rawEeg > medianEeg*4) {
    CURRENT_STATE = blinkListenState1;
  }
  else if (WATCH_TIME === null) {
    WATCH_TIME = now;
    WatchPhaseTimeStamp = now + 5000;
    CURRENT_STATE = listenState;
    rawEegArray.push(rawEeg);
  }
  else if (now < WatchPhaseTimeStamp) {
    CURRENT_STATE = listenState;
    rawEegArray.push(rawEeg);
  }
  else if (now >= WatchPhaseTimeStamp) {
    CURRENT_STATE = calculateIntegral;
    CURRENT_STATE();
  }
  else {
    CURRENT_STATE = listenState;
  }
};

function blinkListenState1(rawEeg) {

  if (rawEeg > medianEeg*4) {
    CURRENT_STATE = blinkListenState2;
  }
  else {
    CURRENT_STATE = listenState;
  }
}

function blinkListenState2(rawEeg) {
  if (rawEeg > medianEeg*4) {
    CURRENT_STATE = blinkListenState3;
  }
  else {
    CURRENT_STATE = listenState;
  }
}

function blinkListenState3(rawEeg) {
  if (rawEeg > medianEeg*4) {
    CURRENT_STATE = blinkListenState4;
  }
  else {
    CURRENT_STATE = listenState;
  }
}

function blinkListenState4(rawEeg) {
  if (rawEeg > medianEeg*4) {
    CURRENT_STATE = blink;
  }
  else {
    CURRENT_STATE = listenState;
  }
}

function blink(rawEeg) {
  console.log('blink');
  CURRENT_STATE = waitState;
  WATCH_TIME = Date.now();
}

function waitState(rawEeg) {
  if (Date.now() - WATCH_TIME < 4000) {
    CURRENT_STATE = waitState;
  }
  else {
    WATCH_TIME = null;
    CURRENT_STATE = listenState;
  }
}

function calculateIntegral(rawEeg) {
  var integral = 0;

  for (i = 0; i < rawEegArray.length-1; i++) {
    integral += rawEegArray[i]*2;
  }

  console.log('Current Integral: ', integral);

  if (!BASELINE_COMPLETE) {
    baselineIntegrals.push(integral);
  }
  else {
    var lowerBound = medianIntegral - (0.5*medianIntegral);
    var upperBound = medianIntegral + (0.5*medianIntegral);

    if (integral > upperBound || integral < lowerBound) {
    console.log('abnormal');
    }
  }

  CURRENT_STATE = listenState;
  WATCH_TIME = null;
  rawEegArray = [];
}

function start_data(data) {
  console.log('first value');
  START_TIME = Date.now();
  IgnorePhaseTimeStamp = START_TIME + 10000;
  BaseLinePhase1TimeStamp = START_TIME + 40000;
  BaseLinePhase2TimeStamp = START_TIME + 160000;
}

function stream_data(data) {
  console.log(data);
  tick(data);

  time = Date.now();

  if (time < IgnorePhaseTimeStamp) {
    CURRENT_STATE = null;
  }
  else if (time < BaseLinePhase1TimeStamp) {
    CURRENT_STATE = baseline1;
    rawEegArray.push(data);
  }
  else if (time < BaseLinePhase2TimeStamp) {
    if (CURRENT_STATE == baseline1) {
      baseline1();
      CURRENT_STATE = listenState;
    }
    else {
      CURRENT_STATE(data);
    }
  }
  else {
    if (!BASELINE_COMPLETE) {
      baseline2();
    }
    else {
      CURRENT_STATE(data);
    }
  }
}