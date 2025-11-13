import { extractTextFromPdf } from "../services/pdfService.js";
import { analyzeWithLLM } from "../services/analysisService.js";

/**
 * Handler para análise de currículos.
 */
async function analyzeHandler(req, res) {
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
}

export { analyzeHandler };
