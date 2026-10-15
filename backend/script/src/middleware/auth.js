import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

// Middleware pour verifier le token JWT dans les cookies ou les headers et 
// si valide, ajoute les infos du user dans req.user
export function verifyToken(req, res, next) {
  const token =
    req.cookies.token ||
    req.headers["authorization"]?.split(" ")[1];

  if (!token) return next('NO_TOKEN');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ajoute les infos du user dans req
    next();
  } catch (error) {
    return next('INVALID_TOKEN');
  }
}