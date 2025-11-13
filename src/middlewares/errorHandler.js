/**
 * Middleware para tratamento de erros global.
 */
function errorHandler(err, req, res, next) {
  console.error("Erro:", err);
  res.status(err.status || 500).json({
    error: err.message || "Ocorreu um erro inesperado no servidor.",
  });
}

export { errorHandler };
