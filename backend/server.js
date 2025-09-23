import express from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const upload = multer(); // in-memory upload

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS for dev (only allow specific domains)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev
      "http://localhost:3000", // CRA dev
      "https://sharp-tools.netlify.app", // Netlify
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// ✅ API: PDF Split
app.post("/split", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No PDF uploaded");

    const { pages } = req.body;
    if (!pages) return res.status(400).send("No pages specified");

    const selectedPages = pages
      .split(",")
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p));

    // Load uploaded PDF
    const pdfDoc = await PDFDocument.load(req.file.buffer);

    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create();
    for (const pageNum of selectedPages) {
      if (pageNum >= 1 && pageNum <= pdfDoc.getPageCount()) {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
        newPdf.addPage(copiedPage);
      }
    }

    const pdfBytes = await newPdf.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=split.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("❌ Error splitting PDF:", err);
    res.status(500).send("Error processing PDF");
  }
});

// ✅ Serve React build (production only)
const buildPath = path.join(__dirname, "../dist"); // adjust if build is elsewhere
app.use(express.static(buildPath));

// Catch-all: serve index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ✅ Dynamic port (Render/Heroku/etc)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
