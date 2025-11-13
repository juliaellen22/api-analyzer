import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

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

export { extractTextFromPdf };
