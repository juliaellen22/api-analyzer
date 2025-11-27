export function formatAnalysisForFrontend(csvContent) {
  if (!csvContent || csvContent.trim().length === 0) {
    return {
      equivalentCount: 0,
      pendingCount: 0,
      workloadCount: 0,
      equivalentSubjects: [],
      pendingSubjects: [],
      notes: "Nenhuma análise disponível.",
    };
  }

  const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);
  const equivalentSubjects = [];
  const pendingSubjects = [];
  let totalWorkload = 0;

  // Processa cada linha do CSV
  for (const line of lines) {
    // Ignora cabeçalhos e linhas vazias
    if (line.toLowerCase().includes("disciplina") || line.toLowerCase().includes("carga")) {
      continue;
    }

    // Tenta parsear como CSV (separado por vírgula ou ponto e vírgula)
    const parts = line.split(/[,;]/).map((p) => p.trim());

    if (parts.length >= 2) {
      const subjectName = parts[0];
      const status = parts[1]?.toLowerCase() || "";
      const workload = extractWorkload(parts);

      const subject = {
        name: subjectName,
        workload: workload,
        equivalentTo: parts.length > 2 ? parts[2] : null,
      };

      if (status.includes("equivalente") || status.includes("sim")) {
        equivalentSubjects.push(subject);
        totalWorkload += workload;
      } else if (status.includes("não") || status.includes("pendente") || status.includes("não equivalente")) {
        pendingSubjects.push(subject);
      } else {
        // Se não está claro, adiciona como pendente
        pendingSubjects.push(subject);
      }
    } else if (parts.length === 1 && parts[0].trim().length > 0) {
      // Linha única - pode ser uma disciplina sem status claro
      pendingSubjects.push({
        name: parts[0],
        workload: 0,
        equivalentTo: null,
      });
    }
  }

  return {
    equivalentCount: equivalentSubjects.length,
    pendingCount: pendingSubjects.length,
    workloadCount: totalWorkload,
    equivalentSubjects: equivalentSubjects,
    pendingSubjects: pendingSubjects,
    notes: generateNotes(equivalentSubjects, pendingSubjects),
    rawContent: csvContent, // Mantém o conteúdo original para referência
  };
}

/**
 * Extrai a carga horária de uma linha do CSV
 * @param {string[]} parts - Partes da linha dividida
 * @returns {number} Carga horária em horas
 */
function extractWorkload(parts) {
  for (const part of parts) {
    // Procura por padrões como "40h", "40 horas", "40 h"
    const match = part.match(/(\d+)\s*h/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}

/**
 * Gera notas/observações baseadas na análise
 * @param {Array} equivalentSubjects - Disciplinas equivalentes
 * @param {Array} pendingSubjects - Disciplinas pendentes
 * @returns {string} Texto com observações
 */
function generateNotes(equivalentSubjects, pendingSubjects) {
  const notes = [];

  if (equivalentSubjects.length > 0) {
    notes.push(
      `Foram identificadas ${equivalentSubjects.length} disciplina(s) equivalente(s) que podem ser eliminadas.`
    );
  }

  if (pendingSubjects.length > 0) {
    notes.push(
      `Existem ${pendingSubjects.length} disciplina(s) pendente(s) que precisam ser cursadas.`
    );
  }

  if (equivalentSubjects.length === 0 && pendingSubjects.length === 0) {
    notes.push("Nenhuma equivalência foi identificada. Verifique os documentos enviados.");
  }

  return notes.join(" ");
}

/**
 * Formata um report completo para o frontend
 * @param {object} report - Objeto do report do banco de dados
 * @returns {object} Report formatado com análise processada
 */
export function formatReportForFrontend(report) {
  const analysisData = formatAnalysisForFrontend(report.content);

  return {
    id: report.id,
    studentName: report.studentName,
    registration: report.registration,
    studentActualCourse: report.studentActualCourse,
    studentTargetCourse: report.studentTargetCourse,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    generator: report.generator,
    analysis: analysisData,
  };
}

