require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/mechanics',
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};