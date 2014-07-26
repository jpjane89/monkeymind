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
import model
import time

app = Flask(__name__)
app.secret_key = 'secret key'
app.jinja_env.undefined = jinja2.StrictUndefined

CONSUMER_KEY = '8xjysrrzyxyr7ca6m9uqmczz'; 
CONSUMER_SECRET = 'S9X2mnMEcQ';

socketio = SocketIO(app)

@socketio.on('connect', namespace= '/test')
def stream():

  print "websocket connected"

  start = mind_echo.start_stream()
  data = mind_echo.continue_stream(start)
  print "first value"
  emit('first value', data)


  while True:
    data = mind_echo.continue_stream(start)
    emit('new value', data)
    start = data
    
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def show_login():
    return render_template("rdio_login.html")

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

  return redirect(url)
  
@app.route('/rdio_callback')
def rdio_callback():

  request_token = verify_request_token()
  get_oauth_token(request_token)
  get_user_info()

  return redirect('/welcome')

def verify_request_token():
  print "got to first def"
  oauth_verifier = request.args.get('oauth_verifier')
  request_token = oauth.Token(session['oauth_token'], session['oauth_token_secret'])
  request_token.set_verifier(oauth_verifier)
  return request_token

def get_oauth_token(request_token):
  print "got to second def"
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)
  client = oauth.Client(consumer, request_token)
  response, content = client.request('http://api.rdio.com/oauth/access_token', 'POST')
  parsed_content = dict(cgi.parse_qsl(content))
  oauth_token = parsed_content['oauth_token']
  oauth_token_secret = parsed_content['oauth_token_secret']
  session['oauth_token'] = oauth_token
  session['oauth_token_secret'] = oauth_token_secret

def get_user_info():
  print "got to third def"
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'currentUser'}))
  json_response = json.loads(response[1])
  rdio_id = json_response['result']['key']
  first_name = json_response['result']['firstName']

  session['user'] = rdio_id
  session['user_name'] = first_name

def check_user():

  rdio_id = session['user']
  first_name = session['user_name']

  user = model.db.query(model.User).filter_by(rdio_id=rdio_id).one()

  if not user:
    new_user = model.User(rdio_id=rdio_id, first_name=first_name)
    model.db.add(new_user)
    model.db.commit() 

@app.route('/welcome')
def welcome():

  first_name = session['user_name']

  return render_template('welcome.html', name=first_name)

@app.route('/playlist')
def start_session():

  return render_template('playlist.html')

@app.route('/ajax/playlists')
def get_playlists():
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'currentUser'}))
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'getPlaylists'}))
  json_response = json.loads(response[1])

  owned_playlists = json_response['result']['owned']
  collab_playlists = json_response['result']['collab']
  subscribed_playlists = json_response['result']['subscribed']

  playlists = owned_playlists + collab_playlists + subscribed_playlists

  session['playlists'] = {}

  for item in playlists:
    session['playlists'][item['name']]=item['key']

  return json.dumps(session['playlists'].keys())

@app.route('/playlist', methods=["POST"])
def get_playlist():

  playlist_name = request.form.get("playlist")

  if playlist_name != '':
    playlist_id = session['playlists'].get(playlist_name)
    session['chosen_playlist'] = playlist_id
    return render_template('time_player.html')
  else:
    flash ("No playlist entered. Try again")
    return redirect('/playlist')

@app.route('/ajax/rdio_player')
def rdio_player():

  print session['chosen_playlist']
  return json.dumps(session['chosen_playlist'])

@app.route('/ajax/getPlaybackToken')
def get_playback_token():
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'getPlaybackToken', 'domain': 'localhost'}))
  json_response = json.loads(response[1])

  playback_token = json_response['result']
  session['playback_token'] = playback_token

  return playback_token
  
if __name__ == "__main__":
    socketio.run(app)