import './Information.css';

export interface IInformationProps {
    header: string;
    description?: string
}

export default function Information({ header, description }: IInformationProps) {
    return (
        <div className={'information-container'}>
            <h1 className={'information-header'}>{header}</h1>
            { description && <p className={'information-description'}>{description}</p> }
        </div>
    )
}
