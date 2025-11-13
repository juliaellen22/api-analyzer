import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as analysisRoutes } from "./routes/analysisRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api", analysisRoutes);

// Middleware de tratamento de erros (deve estar por último)
app.use(errorHandler);

// Iniciando o Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`Frontend deve chamar: http://localhost:${PORT}/api/analyze`);
});
