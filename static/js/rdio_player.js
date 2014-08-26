//this script sets up the Rdio player and is contained within 'headset_connection.html'

function playlistMain() { //gets the user's chosen playlist and playback token. This is called from after baseline is done.

  getPlaylistKey();

  getPlaybackToken();
}

function getPlaylistKey() {
  $.get("/ajax/rdio_player", returnPlaylistKey);
}

function returnPlaylistKey(data) { //saves playlist key to browser storage
  sessionStorage.playlistKey = data;
}

function getPlaybackToken() { //playback token needed to load Rdio player
    $.get("/ajax/getPlaybackToken", loadRdioPlayer);
}

function loadRdioPlayer(data) { //loads Rdio player

  sessionStorage.playbackToken = data;

  $('#api').bind('ready.rdio', function() {
    var key = sessionStorage.playlistKey.replace(/"/g,"");
    $(this).rdio().play(key);
  });

  $('#api').bind('playingTrackChanged.rdio', function(e, playingTrack, sourcePosition) {
    if (playingTrack) {
      duration = playingTrack.duration;
      $('#art').attr('src', playingTrack.icon);
      $('#track').text(playingTrack.name);
      $('#album').text(playingTrack.album);
      $('#artist').text(playingTrack.artist);
    }
  });

  $('#api').bind('positionChanged.rdio', function(e, position) {
    $('#position').css('width', Math.floor(100*position/duration)+'%').css('background-color', 'black');
  });

  $('#api').bind('playStateChanged.rdio', function(e, playState) {
    if (playState === 0) { // paused
      $('#play').show();
      $('#pause').hide();
    } else {
      $('#play').hide();
      $('#pause').show();
    }
  });

  $('#api').rdio(sessionStorage.playbackToken);

  $('#previous').click(function() { $('#api').rdio().previous(); });
  $('#play').click(function() { $('#api').rdio().play(); });
  $('#pause').click(function() { $('#api').rdio().pause(); });
  $('#next').click(function() { $('#api').rdio().next(); });

}