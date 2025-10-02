// 1. Importação dos pacotes necessários
import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CORREÇÃO DE COMPATIBILIDADE ---
// Importa 'pdf-parse' (um módulo CommonJS) de forma compatível com ES Modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
// --- FIM DA CORREÇÃO ---

// 2. Configuração Inicial
dotenv.config(); // Carrega variáveis do arquivo .env
const app = express();
const PORT = process.env.SERVER_PORT || 5001;

// Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. Middlewares
app.use(cors()); // Permite requisições de outras origens (do seu frontend)
app.use(express.json()); // Permite que o express entenda JSON

// 4. Configuração da API do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "ERRO CRÍTICO: Chave da API do Gemini não encontrada no arquivo .env",
  );
  process.exit(1); // Encerra a aplicação se a chave não estiver configurada
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Funções Auxiliares ---
/**
 * Extrai texto de um buffer de arquivo PDF.
 * @param {Buffer} buffer - O buffer do arquivo PDF.
 * @returns {Promise<string>} O texto extraído.
 */
async function extractTextFromPdf(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error("Falha ao processar o arquivo PDF.");
  }
}

/**
 * Envia o texto extraído para a IA Gemini e retorna a análise.
 * @param {string} textAluno - Texto da grade curricular do aluno.
 * @param {string} textOpcionais - Texto da grade curricular base/opcional.
 * @returns {Promise<string>} O resultado da análise.
 */
async function analyzeWithLLM(textAluno, textOpcionais) {
  const prompt = `
        Você é um especialista em análise curricular do Senac. Sua tarefa é comparar duas grades curriculares e identificar equivalências.

        **Regras:**
        1.  Analise a "Grade Curricular do Aluno" e a "Grade Curricular Base".
        2.  Identifique as disciplinas da grade do aluno que são equivalentes às da grade base. A equivalência pode ser por nome similar, ementa ou carga horária compatível.
        3.  Liste APENAS as disciplinas da grade do aluno que podem ser eliminadas por equivalência.
        4.  Se uma disciplina não tiver equivalência clara, marque-a como "Não Equivalente".
        5.  Apresente o resultado em formato de tabela Markdown.

        **Grade Curricular do Aluno:**
        ---
        ${textAluno}
        ---

        **Grade Curricular Base:**
        ---
        ${textOpcionais}
        ---

        **Resultado da Análise de Equivalência:**
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Erro ao consultar a IA:", error);
    throw new Error("Ocorreu um erro ao se comunicar com o serviço de IA.");
  }
}

// 5. Definição do Endpoint da API
app.post(
  "/api/analyze",
  upload.fields([
    { name: "pdf_aluno", maxCount: 1 },
    { name: "pdf_opcionais", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("Recebida requisição em /api/analyze");

    // Validação dos arquivos
    if (!req.files || !req.files.pdf_aluno || !req.files.pdf_opcionais) {
      return res
        .status(400)
        .json({ error: "Ambos os arquivos PDF são necessários." });
    }

    try {
      const fileAluno = req.files.pdf_aluno[0];
      const fileOpcionais = req.files.pdf_opcionais[0];

      // Extração de texto dos PDFs em paralelo
      const [textAluno, textOpcionais] = await Promise.all([
        extractTextFromPdf(fileAluno.buffer),
        extractTextFromPdf(fileOpcionais.buffer),
      ]);

      // Chamada para a IA
      const analysisResult = await analyzeWithLLM(textAluno, textOpcionais);

      // Envio da resposta de sucesso
      res.json({ analysis_result: analysisResult });
    } catch (error) {
      console.error("Erro no processamento da análise:", error);
      res.status(500).json({
        error: error.message || "Ocorreu um erro inesperado no servidor.",
      });
    }
  },
);

// 6. Iniciando o Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`Frontend deve chamar: http://localhost:${PORT}/api/analyze`);
});
