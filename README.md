# What is MonkeyMind?

MonkeyMind is a web application that interfaces with NeuroSky's commerically-available EEG headset, [Mindwave](http://store.neurosky.com/products/mindwave-1), allowing users with the ability to conduct at-home [neurofeedback training](http://en.wikipedia.org/wiki/Neurofeedback) to improve focus and calm. 

Mimicked after other models of neurofeedback training programs, MonkeyMind uses music as a feedback mechanism: when the client's brain signals veer from the established baseline range (indicating movement, tension, or distraction), music momentarily pauses, triggering the client to re-center and focus. Unlike most other neurofeedback applications, MonkeyMind allows clients to choose their own music to listen to, using playlists from their personal Rdio account.

MonkeyMind incorporates the [python-mindwave library](https://github.com/akloster/python-mindwave/tree/master/pymindwave) for parsing the raw EEG data from the MindWave headset.

Back-end: Written in a Python-Flask MVC framework where Jinja provides the views and SQL Alchemy provides the model. Employs Flask-Socket.io for transferring data from the MindWave headset to the browser.

Front-end: Javascript, D3.js, jQuery & jQuery UI

## What do I need to get it to work?

1. MindWave headset and reader
2. Register the application with [Rdio](http://www.rdio.com/developers/) and get application keys
3. Install dependencies using:
```
pip install -r requirements.txt
```
4. Run the following code in Command Line:
```
python app.py
```
5. Open up a browser at http://localhost:5000/

## What does it look like?

Once a user is logged in through Rdio, they are taken to their homepage which presents their history of neurofeedback sessions. The bars in the chart correspond with the number of times the user had to stop to refocus over a 5 minute period of time. Over time, the user should expect to see the bars decrease in height. To start a new session, the user clicks the button in the upper right corner.
![Screenshot](https://raw.github.com/jpjane89/monkeymind/master/screenshots/progress.png)

The user is then prompted to choose a playlist for their training session. A list of their playlists is accessed using the Rdio API and added to the autocomplete input tab. On the right, the user is given a summary of how well they have focused in the past listening to the various playlists, ordered by the average number of times the user has to re-focus in a 5 minute period listening to that playlist.
![Screenshot](https://raw.github.com/jpjane89/monkeymind/master/screenshots/playlist.png)

Once the user has chosen their playlist, they are prompted to connect their MindWave headset, which involves putting the dongle into their computer's USB drive and turning the headset to the "on" position. In the upper right corner, the application reads in the headset's status. Once the headset is connected, the user is ready to start the session.
![Screenshot](https://raw.github.com/jpjane89/monkeymind/master/screenshots/connected.png)

The first minute of the session is dedicated to establishing baseline values of the individual's "normal" brain behavior.Two main metrics are used: median EEG level (used to determine when the individual blinks, which produces a large spike in EEG), and the median integral of the EEG wave over a 250 millisecond time period (used to determine when the individual exhibits unusual brain wave variation, indicating a lack of calm and focus). Once these baseline values are calculated, the user enters into the main session. The speedometer on the right keeps a count of the number of times the individual blinks and gives the user a visualization of the amount of variation in the brain activity (the integral). The user is prompted to re-focus when the amount of variation is either abnormally small or large by a momentary pause in the music, as well as a message telling him/her to "refocus".
![Screenshot](https://raw.github.com/jpjane89/monkeymind/master/screenshots/main_session.png)

Stats from the user's session are saved to a database and presented on the main progress page next time they log-in.

### Questions or feedback?
Contact Jane Williams at jpjane@gmail.com


