import unittest
import mind_echo

class TestGenerationOperations(unittest.TestCase):

    def setUp(self):

        mind_echo.test_mode = True
        mind_echo.test_values = [-7039, 141, -10831, -1011, -6826, -10680, 18599, 8406, -17603, 18621, -12180, -13106, 21457, -8309, -26711, 12367, -29462, 28422, 13155, 18173, -13195, 4143]

    def test_start_stream(self):

        self.assertEqual(int(mind_echo.start_stream()), int(-1546.65527344))

    def test_continue_stream1(self):

        first_value = mind_echo.start_stream()

        self.assertEqual(int(mind_echo.continue_stream(first_value)), int(-757.836914064))

if __name__ == '__main__':
    unittest.main()