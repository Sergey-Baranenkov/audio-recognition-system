import unittest
import numpy as np
from helpers.downsampling import downsampling
from helpers.stereo_to_mono import stereo_to_mono
from helpers.pydub_to_np import pydub_to_np
from helpers.downsample_sound import downsample_sound
from helpers.butter_lowpass import lowpass_filter
from helpers.get_windowed_fft_result import  get_windowed_fft_result, chunks
from helpers.compute_most_powerful_bin_indices import compute_most_powerful_bin_indices
from helpers.perform_algorithm import perform_algorithm

from pydub import AudioSegment

class PrimitiveTests(unittest.TestCase):
    def test_downsampling(self):
        self.assertEqual(downsampling([1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4]), [1,2,3,4])

    def test_stereo_to_mono(self):
        array = np.array([1,1,2,2,3,3,4,4, 1, 2], dtype=np.float32).reshape((-1, 2))
        res = stereo_to_mono(array)
        self.assertTrue(np.array_equal(res, np.array([1,2,3,4,1])))

    def test_chunker(self):
        array = [1,2,3,4,1,2,3,4,1,2,3,4]
        chunked_array = [x for x in chunks(array, 4)]
        self.assertListEqual(chunked_array, [[1,2,3,4], [1,2,3,4], [1,2,3,4]])


class SinWaveTests(unittest.TestCase):
    def setUp(self):
        self.song = AudioSegment.from_mp3("sin1300.mp3")

    def test_pydub_to_np(self):
        array = pydub_to_np(self.song)
        self.assertTrue(type(array) is np.ndarray)

    def test_downsample_sound(self):
        sample_rate = 44100
        downsampled_sound, downsampled_frame_rate = downsample_sound(self.song)
        self.assertAlmostEqual(len(downsampled_sound) / self.song.duration_seconds, sample_rate / 4, delta=0.5)
        self.assertEqual(sample_rate / 4, downsampled_frame_rate)

    def test_get_windowed_fft_result(self):
        window_size = 1024 # 0.1s
        downsampled_sound, downsampled_frame_rate = downsample_sound(self.song)
        bins, y_freq = get_windowed_fft_result(downsampled_sound, downsampled_frame_rate, window_size)
        self.assertEqual(len(bins), 513)
        self.assertEqual(len(y_freq[0]), len(bins))
        self.assertAlmostEqual(self.song.duration_seconds, len(y_freq) * (window_size / downsampled_frame_rate), delta=0.5)

    def test_compute_most_powerful_bin_indices(self):
        window_size = 1024 # 0.1s
        frame_rate = 44100
        downsampled_frame_rate =frame_rate / 4
        cutoff_frequency = downsampled_frame_rate / 2
        downsample_by = 4
        mono_sound = stereo_to_mono(pydub_to_np(self.song))
        filtered_sound = lowpass_filter(mono_sound, cutoff_frequency, frame_rate, order=5)
        downsampled_sound = downsampling(filtered_sound, downsample_by)
        bins, y_freq = get_windowed_fft_result(downsampled_sound, downsampled_frame_rate, window_size)
        res = compute_most_powerful_bin_indices(y_freq)
        self.assertListEqual(res, [[121] for x in range(len(y_freq))])

    def test_algorithm(self):
        downsampled_sound, downsampled_frame_rate = downsample_sound(self.song)
        res = perform_algorithm(downsampled_sound, downsampled_frame_rate)
        self.assertIsNotNone(res)

if __name__ == "__main__":
  unittest.main()