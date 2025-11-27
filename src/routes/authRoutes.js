import express from "express";
import { authenticateToken, requireAuth } from "../middlewares/authMiddleware.js";
import { getProfile, login, register } from "../services/authService.js";

const router = express.Router();

// Rota de registro (pública)
router.post("/register", register);

// Rota de login (pública)
router.post("/login", login);

// Rota para obter perfil do usuário (requer autenticação)
router.get("/profile", authenticateToken, requireAuth, getProfile);


export { router };

