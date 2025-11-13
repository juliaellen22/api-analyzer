import { model } from "../config/gemini.js";

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

export { analyzeWithLLM };
