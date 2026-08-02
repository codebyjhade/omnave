// @ts-ignore
import PDFParser from "pdf2json";

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
          const pageText = texts.map((t: any) => {
            const token = t.R[0].T;
            try {
              return decodeURIComponent(token);
            } catch {
              return token;
            }
          }).join(" ");
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

export async function extractTextFromPdfUrl(fileUrl: string): Promise<string> {
  try {
    console.log("Downloading PDF from URL:", fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch PDF. Status: ${response.status}. Details: ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`PDF downloaded successfully. Buffer size: ${buffer.length} bytes. Parsing with pdf2json...`);
    const parsed = await parsePdfBuffer(buffer);
    if (!parsed.text) throw new Error("pdf2json returned empty text");
    
    return parsed.text;
    
  } catch (error: unknown) {
    console.error("Full PDF extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF Error: ${errorMessage}`);
  }
}

export async function parsePdfFromUrl(fileUrl: string): Promise<{ text: string; pages: number }> {
  try {
    console.log("Downloading PDF from URL for parsing:", fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch PDF. Status: ${response.status}. Details: ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`PDF downloaded successfully for parsing. Buffer size: ${buffer.length} bytes. Parsing with pdf2json...`);
    const parsed = await parsePdfBuffer(buffer);
    if (!parsed.text) throw new Error("pdf2json returned empty text");
    
    return parsed;
    
  } catch (error: unknown) {
    console.error("Full PDF extraction and parsing error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF Error: ${errorMessage}`);
  }
}
