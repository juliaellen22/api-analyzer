import jwt from "jsonwebtoken";

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário ao request
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    // Se não houver token, continua sem autenticação (para permitir uso sem login)
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token inválido, mas permite continuar sem autenticação
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware que exige autenticação obrigatória
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }
  next();
}

