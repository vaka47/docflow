import { Document, Packer, Paragraph, TextRun } from "docx";

export async function exportToDocx(title: string, content: string) {
  const textContent = content.replace(/<[^>]+>/g, "");
  const lines = textContent.split("\n");
  const children = lines.map((line) => {
    if (line.startsWith("# ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace(/^#\s+/, ""), bold: true })],
      });
    }
    return new Paragraph(line);
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true })],
          }),
          ...children,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
