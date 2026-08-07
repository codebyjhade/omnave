// @ts-ignore
import PDFParser from "pdf2json";
import mammoth from "mammoth";
// @ts-ignore
import { parseOffice } from "officeparser";

function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData?.parserError || "Failed to parse PDF"));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages = pdfData.Pages || pdfData.formImage?.Pages || [];
        const pageCount = pages.length;

        let fullText = "";
        for (const page of pages) {
          const texts = page.Texts || [];
          const pageText = texts
            .map((t: any) => {
              const token = t.R[0].T;
              try {
                return decodeURIComponent(token);
              } catch {
                return token;
              }
            })
            .join(" ");
          fullText += pageText + "\n";
        }

        resolve({ text: fullText.trim(), pages: pageCount });
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function parseDocumentFromUrl(fileUrl: string): Promise<{ text: string; pages: number }> {
  try {
    console.log("Downloading document from URL for parsing:", fileUrl);
    const response = await fetch(fileUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch document. Status: ${response.status}. Details: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract file extension dynamically (stripping query parameters)
    const cleanUrl = fileUrl.split("?")[0];
    const extMatch = cleanUrl.match(/\.([a-z0-9]+)$/i);
    const extension = extMatch ? extMatch[1].toLowerCase() : "";

    console.log(`Document downloaded. Buffer size: ${buffer.length} bytes. Detected extension: .${extension}`);

    if (extension === "docx" || extension === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || "").trim();
      if (!text) throw new Error("mammoth returned empty text for DOCX file");

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      // Estimate ~500 words per page for standard DOCX documents
      const pages = Math.max(1, Math.ceil(wordCount / 500));
      return { text, pages };
    }

    if (extension === "pptx" || extension === "ppt") {
      const parsedText = await parseOffice(buffer);
      const text = (typeof parsedText === "string" ? parsedText : String(parsedText || "")).trim();
      if (!text) throw new Error("officeparser returned empty text for PPTX file");

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      // Estimate ~150 words per slide/page for PPTX presentations
      const pages = Math.max(1, Math.ceil(wordCount / 150));
      return { text, pages };
    }

    // Default to PDF parsing using pdf2json
    const parsed = await parsePdfBuffer(buffer);
    if (!parsed.text) throw new Error("PDF parser returned empty text");

    return parsed;
  } catch (error: unknown) {
    console.error("Full document extraction and parsing error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Document Parsing Error: ${errorMessage}`);
  }
}
