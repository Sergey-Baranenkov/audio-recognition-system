
# Трансформирует стерео звук в моно, вычисляя среднее между левым и правым каналом. dtype = int чтобы округлить до
# нижнего уровня
import numpy as np


def stereo_to_mono(stereo: np.ndarray) -> np.ndarray:
    return np.mean(stereo, axis=1, dtype=int)
