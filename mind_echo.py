import platform
import sys, time
from pymindwave import headset
from datetime import datetime
import json

hs = headset.Headset('/dev/tty.MindWave')

def connect():
    time.sleep(0.5)
    if hs.get_state() != 'connected':
        hs.disconnect()

    while hs.get_state() != 'connected':
        time.sleep(0.5)
        print 'current state: {0}'.format(hs.get_state())
        if (hs.get_state() == 'standby'):
            print 'trying to connect...'
            hs.connect()

    print 'now connected!'
    time.sleep(0.5)

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
    v = (raw_v *(1.8/4096))/2000
    new_v = smooth_value(before_v, v)

    return new_v

def smooth_value(before_v, v):

    new_v = (before_v*0.5) + (0.5*v)
    return new_v

def interpret_value(cumulative_sum, smooth_values):

    avg = cumulative_sum/len(smooth_values)
    print avg, smooth_values[-1]

    if smooth_values[-1] > (avg*2.5):
        return "Large change"

    elif smooth_values[-1] > (avg*1.5):
        return "Small change"

def start_stream():

    connect()

    generate_stream()

    v = process_first_value()

    return v

def continue_stream(smooth_values):

    next_v = process_next_value(smooth_values[-1])

    return next_v


