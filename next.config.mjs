/** @type {import('next').NextConfig} */

const nextConfig = {
    env: {
        GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
        GOOGLE_SHEET_GID: process.env.GOOGLE_SHEET_GID,
        GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL
    }
};

export default nextConfig;
