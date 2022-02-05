import {IInformationProps} from "../components/information/Information";
import {StatusEnum} from "../interfaces/StatusEnum";

export function getTextByStatus(status: StatusEnum): IInformationProps | null {
    switch (status) {
        case StatusEnum.stopped:
            return {
                header: "Нажмите для захвата аудио",
            }
        case StatusEnum.notFound:
            return {
                header: "Не найдено :(",
                description: "Попробуйте еще раз",
            }
        case StatusEnum.recording:
            return {
                header: "Ищем ваш великолепный трек...😎",
            }
        default:
            return null;
    }
}
