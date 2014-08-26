# This Flask app sets up the websocket connection and handles interaction with client-side

from flask import abort, Flask, request, session, render_template, g, redirect, url_for, flash
from flask.ext.socketio import SocketIO, emit
import stream_generator #this is a BrainWave module (see stream_generator.py)
import jinja2
from datetime import datetime
import urllib, cgi
import requests
import requests.auth
import json
import oauth2 as oauth
import model #this is the MonkeyMind sqlite3 database (see model.py)
import time

#variables necessary for Flask app set up
app = Flask(__name__)
app.config['DEBUG'] = True
app.secret_key = 'secret key'
app.jinja_env.undefined = jinja2.StrictUndefined

import os

#variables necessary for Rdio API--you must register with Rdio to get these 
CONSUMER_KEY = os.environ.get("CONSUMER_KEY")
CONSUMER_SECRET = os.environ.get('CONSUMER_SECRET')

socketio = SocketIO(app) #this lets us run the app through websocket
hs = None #this will be the reference to the headset connection

@socketio.on('connect', namespace= '/test') #handles first connection with browser
def send_connection_status():

  global hs

  print "websocket connected"

  time.sleep(8)

  hs = stream_generator.set_global_headset() #establishes headset reference

  time.sleep(0.5)
  if hs.get_state() != 'connected':
      hs.disconnect()

  while hs.get_state() != 'connected': #checks status of headset, then sleeps momentarily and re-checks
    time.sleep(0.5)
    hs.connect()
    connection_status = hs.get_state()
    print connection_status
    print "checking status"
    emit('connection status', connection_status)

  emit('connection status','connected!')  #tells browser connection is established
  time.sleep(0.5)

  date = datetime.now() 

  user = model.db.query(model.User).filter_by(rdio_id=session['user']).one()

  user_id = user.id

  new_session = model.Session(user_id=user_id,playlist=session['chosen_playlist'],datetime=date)
  model.db.add(new_session)
  model.db.commit() #saves initial info to DB

  model.db.refresh(new_session)
  session_id = new_session.id

  emit('session id', session_id) #sends session ID to browser storage

@socketio.on('disconnect', namespace= '/test') #destroys connection and reference to headset when websocket disconnected
def disconnect_headset():
  
  global hs
  hs.disconnect()
  hs.destroy()
  print "disconnected"

@socketio.on('readyMessage', namespace= '/test') #when browser is ready, starts sending headset data
def stream_data(message):
  global hs
  
  start = stream_generator.start_stream()
  data = stream_generator.continue_stream(start)
  emit('first value', data)

  while True:
    data = stream_generator.continue_stream(start)
    emit('new value', data)
    start = data

@app.route("/") #cover page
def index():
    
    return render_template("index.html")

@app.route('/authorization_url') #triggered when user clicks "log-in" on cover page--> makes a Post request to Rdio API for request tokens
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
  
@app.route('/rdio_callback') #verifies request tokens to get oauth token, upon successful API integration, redirects to main "welcome" page
def rdio_callback():

  request_token = verify_request_token()
  get_oauth_token(request_token)
  get_user_info()
  check_user()

  return redirect('/welcome')

def verify_request_token(): #verifies request tokens
  oauth_verifier = request.args.get('oauth_verifier')
  request_token = oauth.Token(session['oauth_token'], session['oauth_token_secret'])
  request_token.set_verifier(oauth_verifier)
  return request_token

def get_oauth_token(request_token): #makes request for oauth token, passing request token
  
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)
  client = oauth.Client(consumer, request_token)
  response, content = client.request('http://api.rdio.com/oauth/access_token', 'POST')
  parsed_content = dict(cgi.parse_qsl(content))
  oauth_token = parsed_content['oauth_token']
  oauth_token_secret = parsed_content['oauth_token_secret']
  session['oauth_token'] = oauth_token
  session['oauth_token_secret'] = oauth_token_secret

def get_user_info(): #gets Rdio username and user's first name after Oauth successfull
  
  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'currentUser'}))
  json_response = json.loads(response[1])
  rdio_id = json_response['result']['key']
  first_name = json_response['result']['firstName']

  session['user'] = rdio_id
  session['user_name'] = first_name

def check_user(): #checks to see if user is already in MonkeyMind system and if not, adds them in

  rdio_id = session['user']
  first_name = session['user_name']

  user = model.db.query(model.User).filter_by(rdio_id=rdio_id).all()

  if not user:
    new_user = model.User(rdio_id=rdio_id, first_name=first_name)
    model.db.add(new_user)
    model.db.commit() 

@app.route('/welcome') #loads main 'welcome' page using user's first name
def welcome():

  first_name = session['user_name']

  return render_template('welcome.html', name=first_name)

@app.route('/ajax/welcome') #handles AJAX request for user's previous session history
def get_progress_data():

  sessions_list = []

  rdio_id = session['user']

  user = model.db.query(model.User).filter_by(rdio_id=rdio_id).one()

  users_sessions = model.db.query(model.Session).filter_by(user_id=user.id).all() #gets all session data for that user

  for user_session in users_sessions:
    new_session = {}
    new_session['session_id']= user_session.id
    if user_session.total_pauses: # in case test-session doesn't have that data
      new_session['pause_per_min'] = (300000 * user_session.total_pauses)/(user_session.total_time) #pauses per 5 minutes (*1000 to convert to seconds *60 to convert to minutes * 5)
    if user_session.datetime: # in case test-session doesn't have that data
      new_session['date']= json.dumps(user_session.datetime.strftime('%Y-%m-%d'))
      new_session['start_time']=user_session.datetime.strftime('%I:%M%p')
    if user_session.median_integral: # in case test-session doesn't have that data
      new_session['median_integral']=user_session.median_integral
    sessions_list.append(new_session)

  return json.dumps(sessions_list) #sends data to browser for display

@app.route('/playlist') #gets playlist history from DB to display on 'playlist.html'
def start_session():

  playlist_stats = {} #store playlist data in a dictionary where key= playlist name and values = name,average pauses per 5 min, total count

  rdio_id = session['user']

  user = model.db.query(model.User).filter_by(rdio_id=rdio_id).one()

  users_sessions = model.db.query(model.Session).filter_by(user_id=user.id).all()

  for user_session in users_sessions: #loops through all the sessions to accumulate playlist history
    if user_session.total_pauses: # in case test-session doesn't have that data
      pause_per_min = (300000 * user_session.total_pauses)/user_session.total_time #pauses per 5 minutes (*1000 to convert to seconds *60 to convert to minutes * 5)
    
    name = user_session.playlist
    
    if name not in playlist_stats: #checks 
      playlist_stats[name] = {'name': name, 'average':0, 'count':0}
    
    existing_stats = playlist_stats.get(name)
    
    playlist_stats[name]['count'] = existing_stats['count'] + 1 #keeps a count of how many times user has listened to that playlist
    
    if pause_per_min: # in case test-session doesn't have that data
      playlist_stats[name]['average'] = ((existing_stats['count'] * existing_stats['average']) + pause_per_min) / playlist_stats[name]['count'] #continually updates average stats as each loop progresses

  values_list = sorted(playlist_stats.values(), key= lambda k: k['average']) #sort dictionary values by average pauses per 5 min

  return render_template('playlist.html', playlists=values_list)

@app.route('/ajax/playlists') #handles AJAX request for user's Rdio playlists, saves in session all user's playlists + corresponding keys
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

@app.route('/playlist', methods=["POST"]) #handles POST request containing which playlist the user selected
def get_playlist():

  playlist_name = request.form.get("playlist")

  if playlist_name != '':
    session['chosen_playlist'] = playlist_name
    return render_template('headset_connection.html')
  else:
    flash ("No playlist entered. Try again")
    return redirect('/playlist')

@app.route('/ajax/rdio_player') #handles AJAX request for the key for the user's selected playlist (this is needed for Rdio player)
def rdio_player():

  return json.dumps(session['playlists'].get(session['chosen_playlist']))

@app.route('/ajax/getPlaybackToken') #gets playback token from Rdio API needed to use stream music and sends to browser
def get_playback_token():

  access_token = oauth.Token(session['oauth_token'],session['oauth_token_secret'])
  consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)

  client = oauth.Client(consumer, access_token)
  response = client.request('http://api.rdio.com/1/', 'POST', urllib.urlencode({'method': 'getPlaybackToken', 'domain': 'localhost'}))
  json_response = json.loads(response[1])

  playback_token = json_response['result']

  session['playback_token'] = playback_token

  return playback_token

@app.route('/complete', methods=["POST"]) #handles POST request from browser containing the user's session data to save to DB
def process_session_data():
  
  median_integral = request.form.get('integral')
  total_time = request.form.get('totalTime')
  total_pauses = request.form.get('totalPauses')
  session_id = request.form.get('sessionID')

  current_session = model.db.query(model.Session).filter_by(id=session_id).one()

  current_session.median_integral = median_integral
  current_session.total_time = total_time
  current_session.total_pauses = total_pauses
  model.db.commit()

  return 'hello'

@app.route('/complete', methods=["GET"]) #once session data is succesfully received and saved, loads 'end_page'
def complete_session():

  return render_template('end_page.html')
  
if __name__ == "__main__":
    socketio.run(app)