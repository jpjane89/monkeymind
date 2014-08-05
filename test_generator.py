import unittest
import stream_generator

class TestGenerator(unittest.TestCase):

    def setUp(self):

        stream_generator.test_mode = True
        stream_generator.test_values = [-7039, 141, -10831, -1011, -6826, -10680, 18599, 8406, -17603, 18621]

    def test_start_stream(self):

        self.assertEqual(int(stream_generator.start_stream()), int(-1546.65527344))

    def test_first_value(self):

        first_value = stream_generator.start_stream()

        self.assertEqual(int(stream_generator.continue_stream(first_value)), int(-757.836914064))

    def test_continue_stream_loop(self):

        output = []

        first_value = stream_generator.start_stream()

        start = stream_generator.continue_stream(first_value)
        output.append(int(start))

        while True:
            try:
                data = stream_generator.continue_stream(start)
                output.append(int(data))
                start = data
            except:
                break

        self.assertEqual(output,[int(-757.836),int(-1568.84765625), int(-895.495605469), int(-1197.67456055), int(-1772.17712403), int(1157.25860595), int(1502.14004516), int(-1182.85331726), int(1454.33750153)])


if __name__ == '__main__':
    unittest.main()