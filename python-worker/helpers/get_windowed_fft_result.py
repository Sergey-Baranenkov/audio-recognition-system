from scipy.signal.windows import hamming
import numpy as np
from scipy.fft import rfft, rfftfreq

# Генератор, возвращает чанк из n элементов
def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def get_windowed_fft_result(data, frame_rate: int, window_size: int, window_func=hamming) -> (list, list[list]):
    y_freq = []
    w = window_func(window_size)
    for chunk in chunks(data, window_size):
        if len(chunk) != window_size:
            break

        windowed_chunk = chunk * w
        fft_res = (2 / window_size) * np.abs(rfft(windowed_chunk))

        y_freq.append(fft_res)

    bins = rfftfreq(window_size, d=1 / frame_rate)

    return bins, y_freq
