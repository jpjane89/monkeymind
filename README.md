# What is MonkeyMind?

MonkeyMind is a web application that interfaces with NeuroSky's commerically-available EEG headset, [Mindwave](http://store.neurosky.com/products/mindwave-1), allowing users with the ability to conduct at-home [neurofeedback training](http://en.wikipedia.org/wiki/Neurofeedback) to improve focus and calm. 

Mimicked after other models of neurofeedback training programs, MonkeyMind uses music as a feedback mechanism: when the client's brain signals veer from the established baseline range (indicating movement, tension, or distraction), music momentarily pauses, triggering the client to re-center and focus. Unlike most other neurofeedback applications, MonkeyMind allows clients to choose their own music to listen to, using playlists from their personal Rdio account.

MonkeyMind incorporates the [python-mindwave library](https://github.com/akloster/python-mindwave/tree/master/pymindwave) for parsing the raw EEG data from the MindWave headset.

Back-end: Written in a Python-Flask MVC framework where Jinja provides the views and SQL Alchemy provides the models. Employs Flask-Socket.io for transferring data from the MindWave headset to the browser.

Front-end: Javascript, D3.js, jQuery & jQuery UI

## What do I need to get it to work?

1. MindWave headset and reader
2. Register the application with [Rdio](http://www.rdio.com/developers/) and get application keys
3. Install dependencies using:
```
pip install -r requirements.txt
```

## What does it look like?

Once a user is logged in through Rdio, they are taken to their home-page which presents their history of neurofeedback sessions. The bars in the chart correspond with the number of times the user had to stop to refocus over a 5 minute period of time. Over time, the user should expect to see a decrease in bar heights.
![Screenshot](https://raw.github.com/jpjane89/monkeymind/master/screenshots/progress.png)