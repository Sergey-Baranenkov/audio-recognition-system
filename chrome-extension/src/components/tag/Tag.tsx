import './Tag.css';
import randomColor from "randomcolor";

export interface ITagProps {
    text: string
}

export default function Tag({ text }: ITagProps) {
    return (
        <div className={'tag-container'} style={{backgroundColor: randomColor({luminosity: 'dark'})}}>
            <p className={'tag-text'}>{text}</p>
        </div>
    )
}
