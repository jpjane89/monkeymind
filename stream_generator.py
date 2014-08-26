# This program processes incoming EEG values from the headset and sets up a queue

import platform
import sys, time
from pymindwave import headset #this is a pre-existing library for establishing headset reference and parsing MindWave data
from datetime import datetime
import json
import time

hs = None #reference to headset connection
test_mode = False #variable used when in testing mode
test_values = [] #variable used when in testing mode

def set_global_headset(): #this is called from app.py when websocket is opened

    global hs
    hs = headset.Headset('/dev/tty.MindWave') 
    return hs

def disconnect(): #this is called upon websocket disconnection from app.py

    print 'disconnecting...'
    hs.disconnect()
    hs.destroy()
    sys.exit(0)

def start_stream(): #this generates the first value

    generate_stream()
    v = process_first_value()
    return v

def continue_stream(before_v): #this generates all subsequent values

    next_v = process_next_value(before_v)
    return next_v

def generate_stream(): #pops off first EEG value from array accumulating EEG values

    if not test_mode:
        while True:
            if hs.parser.raw_values:
                v = hs.parser.raw_values.pop(0)
                yield v
            else:
                time.sleep(0.1)

    else:
        print test_values
        v = test_values.pop(0)
        yield v
        

def process_first_value(): #takes in first value (cannot smooth because no previous value)

    raw_v = generate_stream().next()
    v = (raw_v *(1.8/4096))/2000 * 1000000 #converts to microvolt units

    return v

def process_next_value(before_v): #takes in incoming value and smoothes based on previous value

    raw_v = generate_stream().next()
    v = ((raw_v *(1.8/4096))/2000) * 1000000
    new_v = smooth_value(before_v, v)

    return new_v

def smooth_value(before_v, v): #smoothing function (1/2 of new value + 1/2 of previous value)

    new_v = (before_v*0.5) + (0.5*v)
    return new_v

