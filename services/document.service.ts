import PDFParser from "pdf2json";

interface PdfTextRun { T?: string }
interface PdfTextItem { R?: PdfTextRun[] }
interface PdfPage { Texts?: PdfTextItem[] }
interface PdfPayload { Pages?: PdfPage[]; formImage?: { Pages?: PdfPage[] } }

export function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: unknown) => {
      const message = typeof errData === 'object' && errData !== null && 'parserError' in errData
        ? String(errData.parserError)
        : 'Failed to parse PDF';
      reject(new Error(message));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: PdfPayload) => {
      try {
        const pages = pdfData.Pages || pdfData.formImage?.Pages || [];
        const pageCount = pages.length;

        let fullText = "";
        for (const page of pages) {
          const texts = page.Texts || [];
          const pageText = texts
            .map((item) => {
              const token = item.R?.[0]?.T ?? '';
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
