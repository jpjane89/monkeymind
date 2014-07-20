import struct
from time import time
from time import sleep
from numpy import mean
import serial


SYNC_BYTES = [0xaa, 0xaa]

def bigend_24b(b1, b2, b3):
    return b1* 256 * 256 + 256 * b2 + b3

class VirtualParser(object):
    def __init__(self, input_fstream):
        self.current_vector  = [0 for i in range(8)]
        self.raw_values = []
        self.sending_data = False
        self.dongle_state ="initializing"
        self.input_fstream = input_fstream
        self.input_stream = []
        self.read_more_stream()
        self.buffer_len = 512*3

    def is_sending_data(self):
        self.sending_data = True
        self.dongle_state = 'connected'

    def read_more_stream(self):
        self.input_stream += [ord(b) for b in list(self.input_fstream.read(1000))]
        sleep(0.1)

    def parse_payload(self, payload):
        while len(payload) > 0:
            #@TODO parse excode?  13.07 2013 (houqp)
            code = payload.pop(0)
            if code >= 0x80:
                vlen = payload.pop(0)
                # multi-byte codes
                if code == 0x80:
                    self.is_sending_data()
                    high_word = payload.pop(0)
                    low_word = payload.pop(0)
                    rawEeg = high_word * 256 + low_word
                    if rawEeg >=32768:
                        rawEeg = rawEeg - 65536
                    self.raw_values.append(rawEeg)

                elif code == 0x83:
                    self.is_sending_data()
                    self.current_vector = []
                    for i in range(8):
                        self.current_vector.append(
                            bigend_24b(payload.pop(0), payload.pop(0), payload.pop(0)))
                elif code == 0xd0:
                    # headset found
                    # 0xaa 0xaa 0x04 0xd0 0x02 0x05 0x05 0x23
                    self.global_id = 256 * payload.pop(0) + payload.pop(0)
                    self.dongle_state = 'connected'
                elif code == 0xd1:
                    # headset not found
                    # 0xaa 0xaa 0x04 0xd1 0x02 0x05 0x05 0xf2
                    self.error = 'not found'
                elif code == 0xd2:
                    # 0xaa 0xaa 0x04 0xd2 0x02 0x05 0x05 0x21
                    self.disconnected_global_id = 256 * payload.pop(0) + payload.pop(0)
                    self.dongle_state = 'disconnected'
                elif code == 0xd3:
                    # request denied
                    # 0xaa 0xaa 0x02 0xd3 0x00 0x2c
                    self.error = 'request denied'
                elif code == 0xd4:
                    # standby mode, only pop the useless byte
                    # 0xaa 0xaa 0x03 0xd4 0x01 0x00 0x2a
                    self.dongle_state = 'standby'
                    payload.pop(0)
                else:
                    # unknown multi-byte codes
                    pass
            else:
                # single-byte codes
                val = payload.pop(0)
                self.is_sending_data()
                if code == 0x02:
                    self.poor_signal = val
                elif code == 0x04:
                    self.current_attention = val
                elif code == 0x05:
                    self.current_meditation = val
                elif code == 0x16:
                    self.current_blink_strength = val
                else:
                    # unknown code
                    pass

    def consume_stream(self):
        while 1:
            while self.input_stream[:2] != SYNC_BYTES:
                retry = 0
                while len(self.input_stream) <= 3:
                    retry += 1
                    if retry > 3:
                        return False
                    self.read_more_stream()
                self.input_stream.pop(0)
            # remove sync bytes
            self.input_stream.pop(0)
            self.input_stream.pop(0)
            plen = 170
            while plen == 170:
                # we are in sync now
                if len(self.input_stream) == 0:
                    return False
                plen = self.input_stream.pop(0)
                if plen == 170:
                    # in sync
                    continue
                else:
                    break
            if plen > 170:
                # plen too large
                continue

            if (len(self.input_stream) < plen + 1):
                # read the payload and checksum
                self.read_more_stream()
            if (len(self.input_stream) < plen + 1):
                return False

            chksum = 0
            for bv in self.input_stream[:plen]:
                chksum += bv
            # take the lowest byte and invert
            chksum = chksum & ord('\xff')
            chksum = (~chksum) & ord('\xff')
            payload = self.input_stream[:plen+1]
            self.input_stream = self.input_stream[plen+1:]
            # pop chksum and compare
            if chksum != payload.pop():
                # invalid payload, skip
                continue
            else:
                self.parse_payload(payload)
                return

    def update(self):
        self.consume_stream()

class Parser(VirtualParser):
    def __init__(self, serial_dev='/dev/ttyUSB0'):
        self.dongle = serial.Serial(serial_dev,  115200, timeout=0.001)
        VirtualParser.__init__(self, self.dongle)



