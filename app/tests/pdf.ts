// The text of a PDF, as a PDF reader copies it (unpdf, a build of Mozilla's
// PDF.js). Used by the banned-words guard and the CV tests (PF-018).
import { readFileSync } from 'node:fs'
import { extractText, getDocumentProxy } from 'unpdf'

export async function pdfText(file: string): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(readFileSync(file)))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
