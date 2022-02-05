import './AudioButton.css';
import React, {useEffect, useState} from "react";

export interface IAudioButtonProps {
    audio: HTMLAudioElement;
    onPlay: () => void;
    onPause: () => void;
}

export default function AudioButton({ audio, onPlay, onPause }: IAudioButtonProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        return () => audio.pause();
    }, []);

    audio.addEventListener('ended', () => { setIsPlaying(false); })

    const onClick = async () => {
        setIsPlaying(!isPlaying);
        if (isPlaying) {
            onPause();
            audio.pause();
        } else {
            onPlay()
            await audio.play();
        }
    }

    return (
        <button className={
            `audio-button ${isPlaying ? 'audio-button_pause' : 'audio-button_play'}`
        } onClick={onClick}/>
    )
}
