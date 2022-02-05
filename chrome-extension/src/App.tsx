/*global chrome*/

import React, {useEffect, useRef, useState} from 'react';
import './App.css';


import RecordRTC, {StereoAudioRecorder} from "recordrtc";
import Information, {IInformationProps} from "./components/information/Information";
import {getTextByStatus} from "./helpers/getTextByStatus";
import {StatusEnum} from "./interfaces/StatusEnum";
import FoundTrack, {IFoundTrackProps} from "./components/foundTrack/FoundTrack";
import AudioButton, {IAudioButtonProps} from "./components/audioButton/AudioButton";

interface IRecognitionResponse extends IFoundTrackProps {
    src: string;
}

function App() {
    const [track, setTrack] = useState<IFoundTrackProps & Pick<IAudioButtonProps, 'audio'> | null>(null);
    const [retryCounter, setRetryCounter] = useState(0);
    const recorder = useRef<RecordRTC | null>(null);
    const context = useRef<AudioContext | null>(null);

    const [status, setStatus] = useState<StatusEnum>(StatusEnum.stopped);

    useEffect(() => {
        if (retryCounter >= 2) {
            setRetryCounter(0);
            stopRecording();
            setStatus(StatusEnum.notFound);
        }
    }, [retryCounter])

    const onRecognizedTrackPlay = async () => {
        await context.current?.suspend();
    }

    const onRecognizedTrackPause = async () => {
        await context.current?.resume();
    }

    const sendBlob = async (blob: Blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'music.wav');
        const res = await fetch(process.env.REACT_APP_RECOGNITION_ENDPOINT as string, { method: 'POST', body: formData });

        if (res.status === 200) {
            const { title, author, genres, src }: IRecognitionResponse = await res.json();
            setTrack({
                title,
                author,
                genres,
                audio: new Audio(src),
            });

            setStatus(StatusEnum.result);
            stopRecording();
        } else {
            setRetryCounter((prev) => prev + 1);
        }
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

                context.current = ctx;

                recorder.current = new RecordRTC(clone, {
                    type: "audio",
                    mimeType: "audio/wav",
                    timeSlice: 5000,
                    desiredSampRate: 44100,
                    recorderType: StereoAudioRecorder,
                    numberOfAudioChannels: 1,
                    ondataavailable: async (blob) => { await sendBlob(blob); }
                });

                return resolve(null);
            });
        })
    }

    const stopRecording = () => recorder.current!.stopRecording();

    const onClick = async () => {
        setRetryCounter(0);
        if (status === StatusEnum.recording) {
            stopRecording();
        } else {
            setTrack(null);
            if (!recorder.current) await initRecorder();
            recorder.current!.reset();
            recorder.current!.startRecording();
        }

        setStatus(status === StatusEnum.recording ? StatusEnum.stopped : StatusEnum.recording);
    };

  return (
    <div className="container">
        <button className={`recognize-button rotating`} style={{
            animationPlayState: status === StatusEnum.recording ? 'running': 'paused',
        }} onClick={onClick}/>

        { [StatusEnum.stopped, StatusEnum.notFound].includes(status) && <div className={'arrow-back'}/> }
        { status === StatusEnum.result ? <AudioButton
            audio={track!.audio}
            onPlay = {onRecognizedTrackPlay}
            onPause = {onRecognizedTrackPause}
        /> : null }
        { [StatusEnum.stopped, StatusEnum.notFound, StatusEnum.recording].includes(status) ?
            <Information { ...getTextByStatus(status) as IInformationProps } />
            :
            track ?
                <FoundTrack {...track}/>
                :
                null
        }

    </div>
  );
}

export default App;
