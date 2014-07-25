import platform
import sys, time
from pymindwave import headset
from datetime import datetime
import json
import time

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

# def interpret_value():

#     avg = cumulative_sum/150

#     if smooth_values[-1] > (avg*2.5):
#         return 2
#     elif smooth_values[-1] > (avg):
#         return 1
#     else:
#         return 0

# def update_state(interpretation):

#     if state == 'listen' and interpretation == 0:
#         state = 'listen'
#     elif state == 'listen' and interpretation == 2:
#         start_time = time.time()
#         blink_transition(start_time)
#         state = 'transition'
#     elif state == 'transition' and interpretation != 2:
#         state = 'listen'
#     elif state == 'transition' and interpretation == 2:
#         state = 'blink'
#         start_time = time.time()
#         blink(start_time)
#     elif state == 'blink' and interpretation != 2:
#         state = 'listen'
#     elif state == 'blink' and interpretation == 2:
#         state = 'blink'
#         emit(state)
#         state = 'listen'
#         wait()
#     elif state == 'listen' and interpretation == 1:
#         state = 'spike1'
#     elif state =='spike1' and interpretation != 1:
#         state = 'listen'
#     elif state == 'spike 1' and interpretation == 1:
#         state = 'spike 2'
#     elif state == 'spike 2' and interpretation != 2:
#         state = 'listen'
#     elif state == 'spike 2' and interpretation == 2:
#         state = 'spike 3'
#         emit(state)
#         state = 'listen'

# def blink_transition(start_time):

#     now = time.time()

#     if start_time - now < 0.005:
#         continue_stream()
#     else:
#         continue_stream()
#         interpretation = interpret_value()
#         update_state(interpretation)

# def blink(start_time):

#     now = time.time()

#     if start_time - now < 0.005:
#         continue_stream()
#     else:
#         continue_stream()
#         interpretation = interpret_value()
#         update_state(interpretation)

# def wait(start_time):

#     now = time.time()

#     if start_time - now < 0.005:
#         continue_stream()
#     else:
#         continue_stream()
#         interpretation = interpret_value()
#         update_state(interpretation)

def start_stream():

    connect()

    generate_stream()

    v = process_first_value()

    return v

def continue_stream(before_v):

    next_v = process_next_value(before_v)

    return next_v










