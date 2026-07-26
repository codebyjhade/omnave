import { PDFParse } from "pdf-parse";

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
    
    console.log(`PDF downloaded successfully. Buffer size: ${buffer.length} bytes. Parsing...`);
    
    // Parse using the modern class-based PDFParse API to maintain TypeScript ESM compatibility
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    if (!data.text) throw new Error("pdf-parse returned empty text");
    
    return data.text;
    
  } catch (error: any) {
    console.error("Full PDF extraction error:", error);
    throw new Error(`PDF Error: ${error.message}`);
  }
}
