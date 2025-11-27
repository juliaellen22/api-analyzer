import express from "express";
import { upload } from "../config/multer.js";
import {
  analyzeHandler,
  getReportByIdHandler,
  listReportsHandler,
} from "../controllers/analysisController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rota para criar uma nova análise
router.post(
  "/analyze",
  authenticateToken, // Middleware de autenticação (opcional - permite continuar sem token)
  upload.fields([
    { name: "pdf_aluno", maxCount: 1 },
    { name: "pdf_opcionais", maxCount: 1 },
    { name: "pdf_certificacoes", maxCount: 1 },
  ]),
  analyzeHandler,
);

// Rota para listar todos os reports
router.get("/reports", authenticateToken, listReportsHandler);

// Rota para buscar um report por ID
router.get("/reports/:id", authenticateToken, getReportByIdHandler);

export { router };

