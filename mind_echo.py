import platform
import sys, time
from pymindwave import headset
from datetime import datetime
import json
import time

hs = None

def disconnect():

    print 'disconnecting...'
    hs.disconnect()
    hs.destroy()
    sys.exit(0)

def generate_stream():

    while True:
        if hs.parser.raw_values:
            v = hs.parser.raw_values.pop(0)
            yield v
        else:
            time.sleep(0.1)

def process_first_value():

    raw_v = generate_stream().next()
    v = (raw_v *(1.8/4096))/2000

    return v

def process_next_value(before_v):

    raw_v = generate_stream().next()
    v = ((raw_v *(1.8/4096))/2000) * 1000000
    new_v = smooth_value(before_v, v)

    return new_v

def smooth_value(before_v, v):

    new_v = (before_v*0.5) + (0.5*v)
    return new_v

def start_stream():

    generate_stream()

    v = process_first_value()

    return v

def continue_stream(before_v):

    next_v = process_next_value(before_v)

    return next_v

def set_global_headset():

    global hs

    hs = headset.Headset('/dev/tty.MindWave') 

    return hs










