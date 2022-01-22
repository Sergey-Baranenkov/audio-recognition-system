from helpers.compute_most_powerful_bin_indices import compute_most_powerful_bin_indices
from helpers.get_flatten_bin_indices import get_flatten_bin_indices
from helpers.get_structure_to_unwind import get_structure_to_unwind
from helpers.get_target_zones_with_anchors import get_target_zones_with_anchors
from helpers.get_windowed_fft_result import get_windowed_fft_result


def perform_algorithm(sound, frame_rate, window_size=4096):
    bins, y_freq = get_windowed_fft_result(sound, frame_rate, window_size)
    most_powerful_bin_indices = compute_most_powerful_bin_indices(y_freq)
    transformed = get_flatten_bin_indices(most_powerful_bin_indices)
    target_zones = get_target_zones_with_anchors(transformed)
    return get_structure_to_unwind(target_zones, song_id=228)