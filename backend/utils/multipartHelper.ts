import type { Request } from 'express';

export interface ExtractedFile {
  csvText: string;
  fileName: string;
}

/**
 * Universal CSV extractor supporting:
 * 1. multipart/form-data payloads (without requiring native C++ binary bindings)
 * 2. application/json payloads ({ csv: "...", fileName: "..." })
 * 3. text/csv and text/plain raw bodies
 */
export function extractCsvFromRequest(req: Request): ExtractedFile {
  let fileName = 'manufacturing_telemetry.csv';
  let csvText = '';

  const contentType = (req.headers['content-type'] || '').toLowerCase();

  // 1. JSON payload
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    if (typeof req.body.csv === 'string') {
      csvText = req.body.csv;
      if (req.body.fileName || req.body.file_name) {
        fileName = req.body.fileName || req.body.file_name;
      }
      return { csvText, fileName };
    }
  }

  // 2. Buffer payload
  let rawBody = '';
  if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf-8');
  } else if (typeof req.body === 'string') {
    rawBody = req.body;
  }

  // 3. Multipart form data
  if (contentType.includes('multipart/form-data') && rawBody.includes('------')) {
    // Extract filename if present
    const fileNameMatch = rawBody.match(/filename="([^"]+)"/i);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1];
    }

    // Extract content between boundary headers and ending boundary
    const headerEndIndex = rawBody.indexOf('\r\n\r\n');
    if (headerEndIndex !== -1) {
      const contentStart = headerEndIndex + 4;
      // Find the next boundary mark
      const boundaryIndex = rawBody.indexOf('\r\n------', contentStart);
      if (boundaryIndex !== -1) {
        csvText = rawBody.substring(contentStart, boundaryIndex).trim();
      } else {
        csvText = rawBody.substring(contentStart).trim();
      }
    } else {
      csvText = rawBody.trim();
    }
  } else {
    // 4. Raw CSV string
    csvText = rawBody.trim();
  }

  return { csvText, fileName };
}
