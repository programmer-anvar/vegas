import dotenv from 'dotenv';
dotenv.config();

const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Environment xato: "${key}" .env faylida topilmadi`);
  }
}

export const env = process.env.NODE_ENV || 'development';
export const port = Number(process.env.PORT) || 5000;
export const mongoUri = process.env.MONGO_URI;

export const jwt = {
  accessSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

export const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
export const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
export const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};
const proxyHops = Number(process.env.TRUST_PROXY);
export const trustProxy = Number.isInteger(proxyHops) && proxyHops > 0 ? proxyHops : false;
