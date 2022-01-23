type songId = number;
type timeInterval = number;

type anchorFrequency = number;
type pointFrequency = number;
type timeDifference = number;

export type IRedisAnchor = [timeInterval, songId];
export type IAddress = [anchorFrequency, pointFrequency, timeDifference]

export type IFingerPrint = { [key: timeInterval]: IAddress[] }
