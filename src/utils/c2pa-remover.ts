export interface RemovalResult {
  originalSize: number;
  newSize: number;
  removedItems: string[];
  blob: Blob;
  mimeType: string;
}

export async function removeC2PA(file: File): Promise<RemovalResult> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || detectMimeType(buffer);

  let result: { buffer: ArrayBuffer; removedItems: string[] };

  if (mimeType === 'image/jpeg') {
    result = removeJpegC2PA(buffer);
  } else if (mimeType === 'image/png') {
    result = removePngC2PA(buffer);
  } else if (mimeType === 'image/webp') {
    result = removeWebPC2PA(buffer);
  } else {
    throw new Error('Unsupported file type. Please use JPEG, PNG, or WebP.');
  }

  return {
    originalSize: buffer.byteLength,
    newSize: result.buffer.byteLength,
    removedItems: result.removedItems,
    blob: new Blob([result.buffer], { type: mimeType }),
    mimeType,
  };
}

function detectMimeType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return '';
}

// ─── JPEG ────────────────────────────────────────────────────────────────────

function removeJpegC2PA(buffer: ArrayBuffer): { buffer: ArrayBuffer; removedItems: string[] } {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const removedItems: string[] = [];
  const kept: Uint8Array[] = [];

  if (view.getUint16(0) !== 0xFFD8) throw new Error('Not a valid JPEG file');

  kept.push(bytes.slice(0, 2)); // SOI
  let offset = 2;

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xFF) break;

    // Skip padding bytes
    while (bytes[offset] === 0xFF && offset < bytes.length - 1) {
      if (bytes[offset + 1] !== 0xFF) break;
      offset++;
    }

    const marker = view.getUint16(offset);

    // EOI
    if (marker === 0xFFD9) {
      kept.push(bytes.slice(offset, offset + 2));
      break;
    }

    // SOS – rest is scan data
    if (marker === 0xFFDA) {
      kept.push(bytes.slice(offset));
      break;
    }

    // Standalone markers (no length)
    if (marker >= 0xFFD0 && marker <= 0xFFD7) {
      kept.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > bytes.length) break;
    const segLen = view.getUint16(offset + 2);
    const totalLen = 2 + segLen; // marker + length field + data

    // APP11 (0xFFEB) — primary JUMBF/C2PA container
    if (marker === 0xFFEB) {
      removedItems.push('C2PA manifest (APP11/JUMBF)');
      offset += totalLen;
      continue;
    }

    // APP1 (0xFFE1) — might be XMP containing C2PA
    if (marker === 0xFFE1) {
      const segData = bytes.slice(offset + 4, offset + totalLen);
      const headerStr = readAscii(segData, 0, 32);

      if (headerStr.startsWith('http://ns.adobe.com/xap/1.0/')) {
        const xmpStr = new TextDecoder('utf-8', { fatal: false }).decode(segData);
        if (containsC2PAReferences(xmpStr)) {
          removedItems.push('C2PA XMP metadata (APP1)');
          offset += totalLen;
          continue;
        }
      }

      // Extended XMP
      if (headerStr.startsWith('http://ns.adobe.com/xmp/extension/')) {
        const xmpStr = new TextDecoder('utf-8', { fatal: false }).decode(segData);
        if (containsC2PAReferences(xmpStr)) {
          removedItems.push('C2PA extended XMP metadata (APP1)');
          offset += totalLen;
          continue;
        }
      }
    }

    kept.push(bytes.slice(offset, offset + totalLen));
    offset += totalLen;
  }

  return { buffer: concatUint8Arrays(kept).buffer, removedItems };
}

// ─── PNG ─────────────────────────────────────────────────────────────────────

const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

function removePngC2PA(buffer: ArrayBuffer): { buffer: ArrayBuffer; removedItems: string[] } {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const removedItems: string[] = [];
  const kept: Uint8Array[] = [];

  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) throw new Error('Not a valid PNG file');
  }

  kept.push(bytes.slice(0, 8)); // PNG signature
  let offset = 8;

  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) break;

    const dataLen = view.getUint32(offset);
    const typeBytes = bytes.slice(offset + 4, offset + 8);
    const typeName = String.fromCharCode(...typeBytes);
    const totalLen = 4 + 4 + dataLen + 4; // length + type + data + CRC

    // caBX — C2PA binary JUMBF chunk
    if (typeName === 'caBX') {
      removedItems.push('C2PA binary manifest (caBX chunk)');
      offset += totalLen;
      continue;
    }

    // c2pa — direct C2PA chunk
    if (typeName === 'c2pa') {
      removedItems.push('C2PA chunk');
      offset += totalLen;
      continue;
    }

    // iTXt / tEXt / zTXt — check for C2PA keywords
    if (typeName === 'iTXt' || typeName === 'tEXt' || typeName === 'zTXt') {
      const chunkData = bytes.slice(offset + 8, offset + 8 + dataLen);
      const keywordEnd = chunkData.indexOf(0);
      const keyword = readAscii(chunkData, 0, keywordEnd);

      if (
        keyword === 'XML:com.adobe.xmp' ||
        keyword.toLowerCase().includes('c2pa') ||
        keyword.toLowerCase().includes('provenance')
      ) {
        const textStr = new TextDecoder('utf-8', { fatal: false }).decode(chunkData);
        if (containsC2PAReferences(textStr)) {
          removedItems.push(`C2PA ${typeName} metadata chunk`);
          offset += totalLen;
          continue;
        }
      }
    }

    kept.push(bytes.slice(offset, offset + totalLen));
    offset += totalLen;
  }

  return { buffer: concatUint8Arrays(kept).buffer, removedItems };
}

// ─── WebP ─────────────────────────────────────────────────────────────────────

function removeWebPC2PA(buffer: ArrayBuffer): { buffer: ArrayBuffer; removedItems: string[] } {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const removedItems: string[] = [];

  const riff = readAscii(bytes, 0, 4);
  const webp = readAscii(bytes, 8, 4);
  if (riff !== 'RIFF' || webp !== 'WEBP') throw new Error('Not a valid WebP file');

  const kept: Uint8Array[] = [];
  kept.push(bytes.slice(0, 12)); // RIFF header + WEBP
  let offset = 12;

  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) break;

    const fourCC = readAscii(bytes, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const paddedSize = chunkSize + (chunkSize % 2); // RIFF pads to even
    const totalLen = 8 + paddedSize;

    // XMP  chunk (with trailing space) — can contain C2PA
    if (fourCC === 'XMP ' || fourCC === 'XMP\x00') {
      const xmpData = bytes.slice(offset + 8, offset + 8 + chunkSize);
      const xmpStr = new TextDecoder('utf-8', { fatal: false }).decode(xmpData);
      if (containsC2PAReferences(xmpStr)) {
        removedItems.push('C2PA XMP metadata (WebP XMP chunk)');
        offset += totalLen;
        continue;
      }
    }

    // C2PA chunk (if directly present)
    if (fourCC === 'C2PA') {
      removedItems.push('C2PA manifest chunk');
      offset += totalLen;
      continue;
    }

    kept.push(bytes.slice(offset, offset + totalLen));
    offset += totalLen;
  }

  // Fix RIFF file size
  const result = concatUint8Arrays(kept);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(4, result.length - 8, true);

  return { buffer: result.buffer, removedItems };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length && offset + i < bytes.length; i++) {
    str += String.fromCharCode(bytes[offset + i]);
  }
  return str;
}

function containsC2PAReferences(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('c2pa') ||
    lower.includes('contentcredentials') ||
    lower.includes('content_credentials') ||
    lower.includes('dcterms:provenance') ||
    lower.includes('adobe:creatorId') ||
    lower.includes('photoshop:credentialstatus') ||
    lower.includes('xmpMM:history') && lower.includes('provenance') ||
    lower.includes('stEvt:softwareAgent') && lower.includes('adobe')
  );
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const arr of arrays) {
    result.set(arr, pos);
    pos += arr.length;
  }
  return result;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
