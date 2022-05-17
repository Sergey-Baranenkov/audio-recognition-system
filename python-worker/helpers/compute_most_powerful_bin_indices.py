import numpy as np


def compute_most_powerful_bin_indices(samples, bin_groups=(
(0, 10), (10, 20), (20, 40), (40, 80), (80, 160), (160, 513))) -> list:
    result = []
    for sample in samples:
        bins = []
        for (min_bin, max_bin) in bin_groups:
            interval = sample[min_bin:max_bin]
            (m, i) = max((v, i) for i, v in enumerate(interval))

            bins.append((m, i + min_bin))

        result.append(bins)

    # Фильтруем бины, которые больше чем среднее максимальных бинов
    bin_mean = np.mean([item[0] for sublist in result for item in sublist])

    for idx, beans in enumerate(result):
        result[idx] = list(map(lambda el: el[1], filter(lambda el: el[0] >= bin_mean, beans)))

    return result

# def compute_most_powerful_bin_indices(samples, bin_groups = ((0, 10),(10, 20),(20, 40),(40, 80),(80, 160),(160, 513))) -> list:
#     result = []
#     for sample in samples:
#         bins = []
#         for (min_bin, max_bin) in bin_groups:
#             interval = sample[min_bin:max_bin]
#             (m,i) = max((v,i) for i,v in enumerate(interval))
#
#             bins.append((m,i))
#
#         bin_mean = np.mean([bin[0] for bin in bins])
#
#         bins = list(map(lambda el: el[1], filter(lambda el: el[0] >= bin_mean, bins)))
#         result.append(bins)
#
#     # Фильтруем бины, которые больше чем среднее максимальных бинов
#     # bin_mean = np.mean([item[0] for sublist in result for item in sublist])
#     #
#     # for idx, beans in enumerate(result):
#     #     result[idx] = list(map(lambda el: el[1], filter(lambda el: el[0] >= bin_mean, beans)))
#
#     return result
