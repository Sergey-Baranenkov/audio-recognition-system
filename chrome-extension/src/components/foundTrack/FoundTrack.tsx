import './FoundTrack.css';
import Tag from "../tag/Tag";

export interface IFoundTrackProps {
    title: string;
    author: string;
    genres: Array<string>;
}

export default function FoundTrack({ title, author, genres }: IFoundTrackProps) {
    return (
        <div className={'track-container'}>
            <h1 className={'track-title'}>{title}</h1>
            <p className={'track-author'}>{author}</p>

            <div className={'tags-container'}>
                {genres.map(genre => <Tag text={genre}/>)}
            </div>
        </div>
    )
}
