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
    
    console.log(`PDF downloaded successfully for parsing. Buffer size: ${buffer.length} bytes. Parsing...`);
    
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    if (!data.text) throw new Error("pdf-parse returned empty text");
    
    return {
      text: data.text,
      pages: data.total,
    };
    
  } catch (error: unknown) {
    console.error("Full PDF extraction and parsing error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`PDF Error: ${errorMessage}`);
  }
}
