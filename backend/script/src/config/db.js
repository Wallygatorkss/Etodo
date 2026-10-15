import mysql from 'mysql2'
import path from 'path'; 
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// cree une pool de connexion a la db mysql avec les infos du .env
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE
}).promise()


export default pool;