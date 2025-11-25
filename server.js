import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { generateReportPdf } from "./services/pdfGenerator.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: domínios que podem chamar a API
const allowedOrigins = [
  "http://localhost:5173",
  "https://inovatech-lumispect.vercel.app",
  "https://inovatech-lumispect-em0lig9f9-miguel-arcanjo-brasils-projects.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(
        new Error(`Origin ${origin} não permitido pelo CORS da API`),
        false
      );
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// ===============================================
// ENDPOINT PRINCIPAL: Geração de PDF
// ===============================================
app.post("/generate-pdf", async (req, res) => {
  try {
    const { answers, result, questions } = req.body;

    if (
      !answers ||
      Object.keys(answers).length === 0 ||
      !result ||
      !questions
    ) {
      return res.status(400).send({
        message:
          "Dados do questionário (respostas, perguntas e resultado) são necessários.",
      });
    }

    const { score, category, recommendation, description } = result;

    const reportData = {
      result: {
        score,
        category,
        recommendation,
        description,
      },
      answers,
      questions,
    };

    console.log("Score recebido:", reportData.result.score);

    const pdfBuffer = await generateReportPdf(reportData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Lumispect_Relatorio_Detalhado.pdf"',
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro na geração do PDF:", error);
    res.status(500).send({ message: "Erro interno ao gerar o relatório PDF." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PDF API Server rodando em http://localhost:${PORT}`);
});
