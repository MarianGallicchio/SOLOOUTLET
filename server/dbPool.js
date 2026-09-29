/**
 * Pool MySQL compartido (importado por index.js y mpOAuth.js).
 * En la nube (Railway/Render/Aiven/PlanetScale-style hosts) el endpoint
 * suele ser TLS obligatorio: si DB_SSL=1 o el host no es localhost, se
 * conecta con SSL (rejectUnauthorized false para CAs de la plataforma).
 */
import mysql from 'mysql2/promise';

const isRemote = !!process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST);
const useSsl = process.env.DB_SSL === '1' || (isRemote && process.env.DB_SSL !== '0');

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'solooutlet',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
