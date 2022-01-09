/*global chrome*/

import React, {useRef, useState} from 'react';
import './App.css';
import RecordRTC, {StereoAudioRecorder} from "recordrtc";

function App() {
    const [text, setText] = useState("");
    const [isRecording, setRecordingState] = useState(false);
    const recorder = useRef<RecordRTC | null>(null);

    const sendBlob = async (blob: Blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'music.wav');
        const res = await fetch('http://localhost:1337/recognize-track', {method: 'POST', body: formData});
        const json: {songName: string} = await res.json();
        setText(json.songName);
    }

    const initRecorder = async () => {
        return new Promise((resolve, reject) => {
            chrome.tabCapture.capture({ audio: true, video: false }, async (stream) => {
                if (stream === null) {
                    return reject('Stream is null!!!');
                }

                const clone = stream.clone();

                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(stream);
                source.connect(ctx.destination);

                recorder.current = new RecordRTC(clone, {
                    type: "audio",
                    mimeType: "audio/wav",
                    timeSlice: 5000,
                    desiredSampRate: 44100 / 4,
                    recorderType: StereoAudioRecorder,
                    numberOfAudioChannels: 1,
                    ondataavailable: async (blob) => {
                        await sendBlob(blob);
                    }
                });

                return resolve(null);
            });
        })
    }

    const onClick = async () => {
        setRecordingState(!isRecording);
        if (isRecording) {
            recorder.current!.stopRecording();
        } else {
            if (!recorder.current) {
                await initRecorder();
            }

            recorder.current!.reset();
            recorder.current!.startRecording();

        }
    };

  return (
    <div className="container">
        <button className={`recognize-button rotating`} style={{
            animationPlayState: isRecording ? 'running': 'paused',
        }} onClick={onClick}/>

        <div className={"status-bar"}>
            <p>recordingState: {isRecording ? 'да' : 'нет'}</p>
            <p>{text}</p>
        </div>
    </div>
  );
}

export default App;
