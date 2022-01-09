import Joi, { mappedSchema } from 'joi';

export type JoiExtractTypes<
    A extends mappedSchema | undefined = undefined,
    B extends mappedSchema | undefined = undefined,
    C extends mappedSchema | undefined = undefined,
    > =
    (A extends mappedSchema ? Joi.extractType<A> : {}) &
    (B extends mappedSchema ? Joi.extractType<B> : {}) &
    (C extends mappedSchema ? Joi.extractType<C> : {});
