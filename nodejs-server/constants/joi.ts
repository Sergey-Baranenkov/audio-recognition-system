import {Readable} from "stream";
import Joi, {AnySchema} from "joi";
import {IHapiReadable} from "../interfaces/IHapiReadable";
import _ from "lodash";

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

const schemaToParse = ['array', 'object'];
export const JoiFormDataParser = Joi.extend((joi) => ({
    type: 'init',
    messages: {
        'init.schema.error': '{{#label}}: {{#error}}',
    },
    validate: (value) => ({ value }),
    rules: {
        schema: {
            method(schema: Joi.AnySchema) {
                return this.$_addRule({ name: 'schema', args: { schema } });
            },
            validate(val, helpers, { schema }) {
                let parsed;
                try {
                    if (schemaToParse.includes(schema.type)) {
                        parsed = JSON.parse(val);
                    } else if (_.get(schema, '_valids._values', new Set()).has(null) && val === 'null') {
                        parsed = null;
                    } else {
                        parsed = val;
                    }
                } catch (e) {
                    return helpers.error('init.schema.error', { error: 'Ошибка при парсинге JSON' });
                }
                const { value, error } = schema.validate(parsed, { abortEarly: true });
                if (error) {
                    return helpers.error('init.schema.error', { error: error.message });
                }
                return value;
            },
        },
    },
})) as Joi.Root & {init: () => {schema: <T extends AnySchema> (schema: T) => T }};
