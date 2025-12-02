import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().required().description('MongoDB connection string'),
    JWT_SECRET: Joi.string().required().description('Secret key for JWT signing'),
    PORT: Joi.number().default(3000).description('Application port'),

    // AWS S3 Configuration
    S3_BUCKET: Joi.string().required().description('AWS S3 Bucket name'),
    S3_REGION: Joi.string().required().description('AWS S3 Region'),
    AWS_ACCESS_KEY_ID: Joi.string().required().description('AWS Access Key ID'),
    AWS_SECRET_ACCESS_KEY: Joi.string().required().description('AWS Secret Access Key'),

    // Optional: Node Environment
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
});
