from flask import abort, Flask, request, session, render_template, g, redirect, url_for, flash
from flask.ext.socketio import SocketIO, emit
import mind_echo
import jinja2
from datetime import datetime
import urllib, cgi
import requests
import requests.auth
import json
import oauth2 as oauth

app = Flask(__name__)
app.secret_key = 'secret key'
app.jinja_env.undefined = jinja2.StrictUndefined

CONSUMER_KEY = '8xjysrrzyxyr7ca6m9uqmczz'; 
CONSUMER_SECRET = 'S9X2mnMEcQ';

socketio = SocketIO(app)

# @socketio.on('connect', namespace= '/test')
# def stream():
#   print "websocket connected"

#   smooth_values = []
#   cumulative_sum = 0

#   v = mind_echo.start_stream()
#   smooth_values.append(v)
#   cumulative_sum += v
#   interpretation = None

#   while True:
#     data = mind_echo.continue_stream(smooth_values)

#     print len(smooth_values)
    
#     if len(smooth_values) < 150:
#       interpretation = mind_echo.interpret_value(cumulative_sum, smooth_values)
#       cumulative_sum += data
#       smooth_values.append(data)

#     elif len(smooth_values) == 150:
#       interpretation = mind_echo.interpret_value(cumulative_sum, smooth_values)
#       cumulative_sum -= smooth_values.pop(0)
#       cumulative_sum += data
#       smooth_values.append(data)

#     print data
#     emit('new value', data)
#     if interpretation:
#       print interpretation
#       emit('interpretation', interpretation)
    
@app.route("/")
def index():
    return render_template("index.html")

@app.route('/rdio_login')
def login():
  return render_template('login.html')

@app.route('/authorization_url')
def make_authorization_url():

  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)
  client = oauth.Client(consumer)
  response, content = client.request('http://api.rdio.com/oauth/request_token', 'POST', urllib.urlencode({'oauth_callback': 'http://localhost:5000/rdio_callback'}))
  parsed_content = dict(cgi.parse_qsl(content))
  oauth_token = parsed_content['oauth_token']
  oauth_token_secret = parsed_content['oauth_token_secret']
  session['oauth_token'] = oauth_token
  session['oauth_token_secret'] = oauth_token_secret
  url = parsed_content['login_url'] + '?oauth_token=' + oauth_token

  return url
  
@app.route('/rdio_callback')
def rdio_callback():

  oauth_verifier = request.args.get('oauth_verifier')
  request_token = oauth.Token(session['oauth_token'], session['oauth_token_secret'])
  request_token.set_verifier(oauth_verifier)
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, request_token)
  response, content = client.request('http://api.rdio.com/oauth/access_token', 'POST')
  parsed_content = dict(cgi.parse_qsl(content))
  oauth_token = parsed_content['oauth_token']
  oauth_token_secret = parsed_content['oauth_token_secret']
  session['oauth_token'] = oauth_token
  session['oauth_token_secret'] = oauth_token_secret

  return render_template('playlist.html')

@app.route('/ajax/playlists')
def get_playlists():
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'currentUser'}))
  user = response[1]
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'getPlaylists'}))
  json_response = json.loads(response[1])

  owned_playlists = json_response['result']['owned']
  collab_playlists = json_response['result']['collab']
  subscribed_playlists = json_response['result']['subscribed']

  playlists = owned_playlists + collab_playlists + subscribed_playlists

  playlist_names = []
  for item in playlists:
    playlist_names.append(item['name'])

  return json.dumps(playlist_names)

@app.route('/rdio_player')
def rdio_player():
  return render_template('rdio_player.html')

@app.route('/ajax/getPlaybackToken')
def get_playback_token():
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'getPlaybackToken'}))
  json_response = json.loads(response[1])

  playback_token = json_response['result']
  session['playback_token'] = playback_token

  return playback_token
  
if __name__ == "__main__":
    socketio.run(app)