from pydub import AudioSegment

from helpers.butter_lowpass import lowpass_filter
from helpers.downsampling import downsampling
from helpers.pydub_to_np import pydub_to_np
from helpers.stereo_to_mono import stereo_to_mono


def downsample_sound(sound: AudioSegment, downsample_by=4, filter_order=5):
    frame_rate = sound.frame_rate
    downsampled_frame_rate = frame_rate / downsample_by
    cutoff_frequency = downsampled_frame_rate / 2

    mono_sound = stereo_to_mono(pydub_to_np(sound))
    filtered_sound = lowpass_filter(mono_sound, cutoff_frequency, frame_rate, order=filter_order)
    return downsampling(filtered_sound, downsample_by), downsampled_frame_rate
