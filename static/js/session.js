
var socket = null;
var start = null;


function formatTime(ms) {
  var total_seconds = ms / 1000;
  var minutes = Math.floor(total_seconds / 60);
  var seconds = Math.floor(total_seconds % 60);

  if (minutes < 10 && seconds < 10) {
      return "0" + minutes + ":" + "0" + seconds;
  }
  if (minutes < 10 && seconds >= 10) {
      return "0" + minutes + ":" + seconds;
  }if (minutes >= 10 && seconds < 10) {
      return minutes + ":" + "0" + seconds;
  }
  return minutes + ":" + seconds;
}
 
function displayStatus(data) {
  var connectionText = $("#connection-status");
    connectionText.html(data);

    if (data=='standby') {
      connectionText.css('backgroundColor','#FCDC3B');
    }
    else if (data=='connected!') {
      connectionText.css('backgroundColor','#66CD00');
      startMessage();
    }
    else {
      connectionText.css('backgroundColor','#ff1a1a');
    }
}

function startMessage() {
  var jumbotron = $('#start-message');
  jumbotron.show();

  var startButton = $("#start-session");
  startButton.click(startSession);
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

function loadStopButton() {

  var stop = $('#end-session-btn');
  stop.show();

  stop.click(sendSessionData);
}

function loadSessionElements() {

  changeBaselineMessage();

  loadSpeedometer();

  loadStopButton();

  setTimer();

  setInterval(checkAbnormal, 1000);

}

function insertScript(script, container) {
    var elem = document.createElement('script');
    elem.type = 'text/javascript';
    elem.src = '/static/js/' + script + '.js';
    container.append(elem);
}

function startSession() {
  var jumbotron = $('.jumbotron');
  jumbotron.hide();

  $('.footer-nav').show();
  playlistMain();

  scriptContainer = $("#script-container");
  insertScript('d3chart', scriptContainer);

  centerBar = $('.center-bar');
  centerBar.show();

  leftMessage = $(".hello-message");
  leftMessage.html("Track your brain waves below");

  socket.emit('readyMessage', 'ready');
}

function sendSessionData() {

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
    window.location.replace('/complete');
  }).fail(function() { console.log('failed');} );

}

function saveSessionID(data) {
  sessionStorage.sessionID = data;
  console.log(sessionStorage.sessionID);
}

function connectionMain() {

  var namespace = '/test';
  socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
  var duration = 1;

  socket.on('connection status', displayStatus);

  socket.on('first value', startData);
  
  socket.on('new value', streamData);

  socket.on('session id', saveSessionID);

}