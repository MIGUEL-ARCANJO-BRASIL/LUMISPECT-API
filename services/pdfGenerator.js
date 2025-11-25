import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logo Lumispect
const lumisLogoPath = path.join(__dirname, "..", "assets", "logo-lumis.png");
// Logo Fametro (marca d'água)
const fametroLogoPath = path.join(
  __dirname,
  "..",
  "assets",
  "logo-fametro.png"
);

let BASE64_LUMIS_URL = "";
let BASE64_FAMETRO_URL = "";

// Lumispect
try {
  if (!fs.existsSync(lumisLogoPath)) {
    console.error(
      `ERRO CRÍTICO: Imagem de logo Lumispect não encontrada em: ${lumisLogoPath}`
    );
  } else {
    const imageBuffer = fs.readFileSync(lumisLogoPath);
    BASE64_LUMIS_URL = `data:image/png;base64,${imageBuffer.toString(
      "base64"
    )}`;
  }
} catch (error) {
  console.error(
    "Erro ao ler ou converter imagem Lumispect para Base64:",
    error.message
  );
}

// Fametro
try {
  if (!fs.existsSync(fametroLogoPath)) {
    console.error(`Logo Fametro não encontrada em: ${fametroLogoPath}`);
  } else {
    const fametroBuffer = fs.readFileSync(fametroLogoPath);
    BASE64_FAMETRO_URL = `data:image/png;base64,${fametroBuffer.toString(
      "base64"
    )}`;
  }
} catch (error) {
  console.error(
    "Erro ao ler ou converter imagem Fametro para Base64:",
    error.message
  );
}

async function generateReportPdf(reportData) {
  const { score } = reportData.result;

  const numericScore =
    typeof score === "number" ? score : parseFloat(score) || 0;

  let category = "";
  let recommendation = "";
  let description = "";

  if (numericScore >= 70) {
    category = "Alta Probabilidade de Traços no Espectro";
    description =
      "O resultado do seu teste indica uma forte presença de traços avaliados pelo Lumispect. É crucial entender que esta é apenas uma triagem, mas o alinhamento com o escore máximo sugere que buscar uma avaliação profissional formal pode ser o passo mais importante para o seu autoconhecimento e bem-estar.";
    recommendation =
      "Recomendamos fortemente a busca por profissionais de saúde mental (Neurologista, Psiquiatra ou Psiquiatra com experiência em TEA) para um diagnóstico formal e início de um plano de suporte. Temos uma lista de clínicas e especialistas parceiros que podem auxiliar neste processo.";
  } else if (numericScore >= 40) {
    category = "Sinais Moderados: Traços de Rigidez e Sensibilidade";
    description =
      "Seu resultado indica uma presença moderada de traços relacionados ao espectro. Embora o Lumispect não seja diagnóstico, esses traços podem impactar áreas da sua vida. O autoconhecimento é a chave.";
    recommendation =
      "Se os traços causarem desconforto significativo, uma consulta com um profissional de saúde mental é o caminho. Procure informações confiáveis e continue a se observar. Considere conversar com um psicólogo para explorar esses traços em profundidade.";
  } else {
    category = "Traços Comuns ou Baixa Probabilidade";
    description =
      "O seu resultado sugere que as suas experiências se alinham mais com o padrão neurotípico, com pouca intensidade nos traços avaliados. Continue focando no seu bem-estar geral e no autoconhecimento.";
    recommendation =
      "Se os traços causarem desconforto significativo, uma consulta com um profissional de saúde mental é o caminho. Procure informações confiáveis e continue a se observar. Considere conversar com um psicólogo para explorar esses traços em profundidade.";
  }

  const chartScoreDegrees = (numericScore / 100) * 360;
  const remainingScore = 100 - numericScore;

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "reportTemplate.html"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template HTML não encontrado em: ${templatePath}`);
  }

  let htmlTemplate = fs.readFileSync(templatePath, "utf8");

  htmlTemplate = htmlTemplate
    .replace("{{CATEGORY}}", category)
    .replace("{{DESCRIPTION}}", description)
    .replace("{{RECOMMENDATION}}", recommendation)
    .replace(/{{SCORE}}/g, numericScore.toFixed(0))
    .replace("{{REMAINING_SCORE}}", remainingScore.toFixed(0))
    .replace("{{CHART_SCORE_DEG}}", chartScoreDegrees)
    .replace("{{DATE}}", new Date().toLocaleDateString("pt-BR"))
    .replace("{{LOGO_COMPOSITE_URL}}", BASE64_LUMIS_URL)
    .replace("{{LOGO_FAMETRO_URL}}", BASE64_FAMETRO_URL);

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0.8in",
      right: "0.8in",
      bottom: "0.8in",
      left: "0.8in",
    },
  });

  await browser.close();
  return pdfBuffer;
}

export { generateReportPdf };
