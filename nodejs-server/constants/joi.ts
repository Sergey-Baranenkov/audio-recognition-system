import {Readable} from "stream";
import Joi from "joi";
import {IHapiReadable} from "../interfaces/IHapiReadable";

export const JoiWithReadableStreamType = Joi.extend((joi) => ({
    type: 'readable',
    messages: {
        'readable.wrong_type': '{{#label}} must be of type Readable',
        'readable.empty': '{{#label}} must not be empty',
    },
    validate(value, helpers) {
        if (!(value instanceof Readable)) {
            return { value, errors: helpers.error('readable.wrong_type') };
        }

        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        if (Buffer.byteLength(value._data) === 0) {
            return { value, errors: helpers.error('readable.empty') };
        }
        return { value };
    },
})) as Joi.Root & {
    readable: () => Joi.BoxObjectSchema<Joi.Box<IHapiReadable, false>>
};
