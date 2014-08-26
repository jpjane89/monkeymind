// this script contains the main visual elements and timing scenarios of the session page

var socket = null; //this will contain websocket connection
var start = null; //this will be a boolean value to set when the session starts

function connectionMain() { //sets up websocket connection

  var namespace = '/test';
  socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
  var duration = 1;

  socket.on('connection status', displayStatus); //handles info on connection status

  socket.on('first value', startData); //handles first EEG value--> see 'brainwaves.js'
  
  socket.on('new value', streamData); //handles all subsequent EEG values--> see 'brainwaves.js'

  socket.on('session id', saveSessionID); //saves session ID to send back to database at end of session

}

function displayStatus(data) { //displays connection status on top of page
  var connectionText = $("#connection-status");
    connectionText.html(data);

    if (data=='standby') {
      connectionText.css('backgroundColor','#FCDC3B');
    }
    else if (data=='connected!') {
      connectionText.css('backgroundColor','#66CD00');
      startMessage(); //loads start message
    }
    else {
      connectionText.css('backgroundColor','#ff1a1a');
    }
}

function startMessage() {
  var jumbotron = $('#start-message');
  jumbotron.show();

  var startButton = $("#start-session");
  startButton.click(startSession); //starts session
}

function startSession() {
  var jumbotron = $('.jumbotron');
  jumbotron.hide();

  $('.footer-nav').show();
  playlistMain();

  scriptContainer = $("#script-container");
  insertScript('d3chart', scriptContainer); //loads d3 brainwave chart

  centerBar = $('.center-bar');
  centerBar.show();

  leftMessage = $(".hello-message");
  leftMessage.html("Track your brain waves below");

  socket.emit('readyMessage', 'ready'); //sends message back to server-side that page is ready for data
}

function loadSessionElements() { //this function loads elements of the main session

  changeBaselineMessage();

  loadSpeedometer();

  loadStopButton();

  setTimer();

  setInterval(checkAbnormal, 1000);

}

function insertScript(script, container) { //this function allows for new js scripts to be added to page (used for 'speedometer.js' and 'd3chart.js')
    var elem = document.createElement('script');
    elem.type = 'text/javascript';
    elem.src = '/static/js/' + script + '.js';
    container.append(elem);
}

function showBaselineMessage() {
  var baseline = $('#baseline-message');
  baseline.show();
}

function changeBaselineMessage() {
  var baseline = $('#baseline-message');
  baseline.html("<span class='glyphicon glyphicon-check'></span> <h3>Baseline complete!</h3><p>Use the meter on the right to track your focus. Try to keep the dial in the center zone. When you lose focus, you'll be reminded to come back to center by a pause in the music.</p>" );

  setTimeout(function() {
      baseline.hide(); }, 30000);

}

function loadSpeedometer(){
  speedometer = $("#speedometer");
  speedometer.show();

  scriptContainer = $("#script-container");
  insertScript('speedometer',scriptContainer);
}

function loadStopButton() {

  var stop = $('#end-session-btn');
  stop.show();

  stop.click(sendSessionData); //sends data back to DB when the session is over
}

function setTimer() {
  var timer = $('#timer');
  timer.show();

  start = new Date().getTime();

  setInterval(function() {
    var newTime = new Date().getTime();
    var clock = $('#clock');
    clock.html(formatTime(newTime - start));
  }, 1000);
}

function saveSessionID(data) {
  sessionStorage.sessionID = data;
  console.log(sessionStorage.sessionID);
}

function sendSessionData() { //sends session data back to server-side

  console.log('sending data');

  var newTime = new Date().getTime();

  var sessionData = {
    sessionID: sessionStorage.sessionID,
    integral: MEDIAN_INTEGRAL,
    totalTime: newTime - start,
    totalPauses: PAUSE_COUNT
  };

  console.log(sessionData);

  $.ajax({
    type: "POST",
    url: "/complete",
    data: sessionData,
  }).done(function(data) {
    window.location.replace('/complete'); //loads new page upon success
  }).fail(function() { console.log('failed');} );

}