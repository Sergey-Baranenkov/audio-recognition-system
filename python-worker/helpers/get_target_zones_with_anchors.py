def get_target_zones(data, target_zone_length=5):
    groups = []
    for i in range(0, len(data) - target_zone_length + 1):
        groups.append(data[i: i + target_zone_length])
    return groups


def get_target_zones_with_anchors(data, target_zone_length=5, anchor_shift=3):
    target_zones = get_target_zones(data, target_zone_length=target_zone_length)
    result = []

    for i in range(0, len(data) - target_zone_length + 1 - anchor_shift):
        point = data[i]
        result.append((point, target_zones[i + anchor_shift]))
    return result
