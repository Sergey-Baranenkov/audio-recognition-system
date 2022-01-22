def get_structure_to_unwind(target_zones, song_id):
    result = []
    for zone in target_zones:
        anchor_time = zone[0][0]
        anchor_freq = zone[0][1]

        first = (anchor_time, song_id)

        second = []

        for point in zone[1]:
            second.append((anchor_freq, point[1], point[0] - anchor_time))

        result.append((first, second))
    return result
