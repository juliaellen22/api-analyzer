import prisma from "../prisma.js";
import { analyzeWithLLM } from "../services/analysisService.js";
import { extractTextFromPdf } from "../services/pdfService.js";
import { formatReportForFrontend } from "../services/reportFormatter.js";

/**
 * Handler para análise de currículos.
 */
async function analyzeHandler(req, res) {
  console.log("Recebida requisição em /api/analyze");

  // Validação dos arquivos obrigatórios
  if (!req.files || !req.files.pdf_aluno || !req.files.pdf_opcionais) {
    return res
      .status(400)
      .json({ error: "Ambos os arquivos PDF (aluno e opcionais) são necessários." });
  }

  // Validação dos dados do formulário
  const { studentName, registration, currentCourse, targetCourse } = req.body;

  if (!studentName || !registration || !currentCourse || !targetCourse) {
    return res.status(400).json({
      error: "Todos os campos do formulário são obrigatórios: nome do aluno, matrícula, curso atual e curso destino.",
    });
  }

  try {
    const fileAluno = req.files.pdf_aluno[0];
    const fileOpcionais = req.files.pdf_opcionais[0];
    const fileCertificacoes = req.files.pdf_certificacoes?.[0];

    // Extração de texto dos PDFs em paralelo
    const extractionPromises = [
      extractTextFromPdf(fileAluno.buffer),
      extractTextFromPdf(fileOpcionais.buffer),
    ];

    // Adiciona extração do PDF de certificações se fornecido
    if (fileCertificacoes) {
      extractionPromises.push(extractTextFromPdf(fileCertificacoes.buffer));
    } else {
      extractionPromises.push(Promise.resolve(""));
    }

    const [textAluno, textOpcionais, textCertificacoes] = await Promise.all(extractionPromises);

    // Chamada para a IA
    const analysisResult = await analyzeWithLLM(textAluno, textOpcionais, textCertificacoes);

    // Salvar no banco de dados
    const report = await prisma.report.create({
      data: {
        content: analysisResult,
        generatorId: req.user?.id || null, // Usa o ID do usuário autenticado, ou null se não houver
        studentName: studentName,
        studentActualCourse: currentCourse,
        studentTargetCourse: targetCourse,
        registration: registration,
      },
    });

    // Envio da resposta de sucesso
    res.json({
      analysis_result: analysisResult,
      report_id: report.id,
      message: "Análise concluída e salva com sucesso.",
    });
  } catch (error) {
    console.error("Erro no processamento da análise:", error);
    res.status(500).json({
      error: error.message || "Ocorreu um erro inesperado no servidor.",
    });
  }
}

/**
 * Handler para listar todos os reports.
 */
async function listReportsHandler(req, res) {
  try {
    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: "desc", // Mais recentes primeiro
      },
      include: {
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      reports: reports.map((report) => ({
        id: report.id,
        studentName: report.studentName,
        registration: report.registration,
        studentActualCourse: report.studentActualCourse,
        studentTargetCourse: report.studentTargetCourse,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        generator: report.generator
          ? {
              id: report.generator.id,
              name: report.generator.name,
              email: report.generator.email,
            }
          : null,
        // Não incluir o content completo na listagem para economizar banda
        contentPreview: report.content
      })),
      total: reports.length,
    });
  } catch (error) {
    console.error("Erro ao listar reports:", error);
    res.status(500).json({
      error: error.message || "Ocorreu um erro ao listar os reports.",
    });
  }
}

/**
 * Handler para buscar um report por ID.
 */
async function getReportByIdHandler(req, res) {
  console.log("estamos chegando aq no id");
  
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do report é obrigatório." });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Report não encontrado." });
    }

    // Formatar a resposta para o frontend com análise processada
    const formattedReport = formatReportForFrontend(report);
    res.json(formattedReport);
  } catch (error) {
    console.error("Erro ao buscar report:", error);
    res.status(500).json({
      error: error.message || "Ocorreu um erro ao buscar o report.",
    });
  }
}


async function deleteReportByIdHandler(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "ID do relatório não foi fornecido.",
      });
    }

    // Verifica se o report existe
    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: "Report não encontrado.",
      });
    }

    // Deleta
    await prisma.report.delete({
      where: { id },
    });

    return res.json({
      message: "Report deletado com sucesso.",
      deletedId: id,
    });

  } catch (error) {
    console.error("Erro ao deletar report:", error);
    return res.status(500).json({
      error: error.message || "Erro interno ao deletar o report.",
    });
  }
}


export { analyzeHandler, deleteReportByIdHandler, getReportByIdHandler, listReportsHandler };

