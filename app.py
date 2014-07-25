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
    return render_template("brainwave.html")

@app.route("/login", methods=["GET"])
def show_login():
    # if session.get("user"):
    #     return redirect("/movie_list")
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def process_login():

    email = request.form.get("email")
    password = request.form.get("password")

    user = model.db.query(model.User).filter_by(email = email).first()

    if user and password == user.password:
        session['user'] = user.email
        session['user_id'] = user.id
        flash ("Welcome %s!" % email)
        return redirect("/welcome")
    elif user and password != user.password:
        flash ("Incorrect password.")
        return redirect("/login")
    else:
        flash ("Please register with MonkeyMind")
        return redirect("/register")

@app.route("/register", methods=["GET"])
def show_register():
    return render_template("register.html")

@app.route("/register", methods=["POST"])
def process_register():

    email = request.form.get("email")
    password = request.form.get("password")

    new_user = model.User(email=email, password=password)
    model.db.add(new_user)
    model.db.commit()

    session['user'] = email
    user = model.db.query(model.User).filter_by(email=email).one()
    session['user_id'] = user.id
    flash ("Welcome %s!" % email)

    return redirect("/welcome")

@app.route("/logout")
def logout():
    session.clear()

    return redirect("/login")

@app.route('/rdio_login')
def rdio_login():
  return render_template('rdio_login.html')

@app.route('/welcome')
def welcome():
  return render_template('progress.html')

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
  
@app.route('/rdio_callback', methods=["GET"])
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

  session['playlists'] = {}

  for item in playlists:
    session['playlists'][item['name']]=item['key']

  return json.dumps(session['playlists'].keys())

@app.route('/rdio_callback', methods=["POST"])
def get_playlist():

  playlist_name = request.form.get("playlist")

  print playlist_name

  playlist_id = session['playlists'].get(playlist_name)

  print session['playlists']

  session['chosen_playlist'] = playlist_id

  return render_template('rdio_player.html')

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