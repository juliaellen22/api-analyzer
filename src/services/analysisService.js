import { model } from "../config/gemini.js";

/**
 * Envia o texto extraído para a IA Gemini e retorna a análise.
 * @param {string} textAluno - Texto da grade curricular do aluno.
 * @param {string} textOpcionais - Texto da grade curricular base/opcional.
 * @param {string} textCertificacoes - Texto das certificações e cursos extras (opcional).
 * @returns {Promise<string>} O resultado da análise.
 */
async function analyzeWithLLM(textAluno, textOpcionais, textCertificacoes = "") {
  const hasCertificacoes = textCertificacoes && textCertificacoes.trim().length > 0;
  
  let prompt = `
        Você é um especialista em análise curricular do Senac. Sua tarefa é comparar duas grades curriculares e identificar equivalências.

        **Regras:**
        1.  Analise a "Grade Curricular do Aluno" e a "Grade Curricular Base".
        2.  Identifique as disciplinas da grade do aluno que são equivalentes às da grade base.
        3.  A equivalência pode ser por nome similar, ementa, carga horária compatível ou conteúdo relacionado.
        4.  Liste APENAS as disciplinas da grade do aluno que podem ser eliminadas por equivalência.
        5.  Se uma disciplina não tiver equivalência clara, marque-a como "Não Equivalente".
        6.  Apresente o resultado em formato de csv com as seguintes colunas: "Disciplina", "Status", "Equivalente a", "Carga Horária".
        7.  Use "Equivalente" para disciplinas que podem ser eliminadas e "Não Equivalente" ou "Pendente" para as que precisam ser cursadas.
        8.  Inclua a carga horária no formato "XXh" (ex: "40h", "60h").`;

  if (hasCertificacoes) {
    prompt += `
        
        **REGRA ESPECIAL - Certificações e Cursos Extras:**
        7.  Considere também as certificações e cursos extras do aluno na análise de equivalência.
        8.  Se houver cursos ou disciplinas na grade base que sejam similares ou equivalentes aos cursos extras/certificações apresentados, eles devem ser marcados como equivalentes.
        9.  As certificações e cursos extras têm o mesmo peso que as disciplinas da grade do aluno para fins de equivalência.`;
  }

  prompt += `

        **Grade Curricular do Aluno:**
        ---
        ${textAluno}
        ---

        **Grade Curricular Base:**
        ---
        ${textOpcionais}
        ---`;

  if (hasCertificacoes) {
    prompt += `

        **Certificações e Cursos Extras do Aluno:**
        ---
        ${textCertificacoes}
        ---
        
        **IMPORTANTE:** As certificações e cursos extras devem ser considerados na análise de equivalência. Se houver cursos ou disciplinas na grade base que sejam similares ou equivalentes aos cursos extras apresentados, eles devem ser marcados como equivalentes.`;
  }

  prompt += `

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

