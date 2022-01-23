from collections import defaultdict


def get_structure_to_unwind(target_zones) -> dict:
    result_dict = defaultdict(list)

    for zone in target_zones:
        anchor_time = zone[0][0]
        anchor_freq = zone[0][1]

        for point in zone[1]:
            result_dict[anchor_time].append((anchor_freq, point[1], point[0] - anchor_time))

    return result_dict
