function get_playback_token() {
    $.get("/ajax/getPlaybackToken", return_playback_token);
}

function return_playback_token(data) {
  sessionStorage.playbackToken = data;
}

function get_playlist_key() {
  $.get("/ajax/rdio_player", return_playlist_key);
}

function return_playlist_key(data) {
  sessionStorage.playlistKey = data;
}

function playlistMain() {

  get_playlist_key();

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
    $('#position').css('width', Math.floor(100*position/duration)+'%');
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

  get_playback_token();

  $('#api').rdio(sessionStorage.playbackToken);

  $('#previous').click(function() { $('#api').rdio().previous(); });
  $('#play').click(function() { $('#api').rdio().play(); });
  $('#pause').click(function() { $('#api').rdio().pause(); });
  $('#next').click(function() { $('#api').rdio().next(); });

}