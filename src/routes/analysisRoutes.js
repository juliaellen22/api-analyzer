import express from "express";
import { upload } from "../config/multer.js";
import { analyzeHandler } from "../controllers/analysisController.js";

const router = express.Router();

router.post(
  "/analyze",
  upload.fields([
    { name: "pdf_aluno", maxCount: 1 },
    { name: "pdf_opcionais", maxCount: 1 },
  ]),
  analyzeHandler,
);

export { router };
