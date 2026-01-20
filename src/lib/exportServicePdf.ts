import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SetList, Song } from '@/lib/types';

export function exportServiceToPdf(
  setList: SetList,
  allSongs: Song[]
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(setList.title, 14, 20);

  doc.setFontSize(12);
  doc.text(`Date: ${setList.date.toLocaleDateString()}`, 14, 30);

  if (setList.serviceNotes?.theme) {
    doc.text(`Theme: ${setList.serviceNotes.theme}`, 14, 38);
  }
  if (setList.serviceNotes?.scripture) {
    doc.text(`Scripture: ${setList.serviceNotes.scripture}`, 14, 46);
  }

  const rows = setList.songs
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => {
      const song = allSongs.find((s) => s.id === entry.songId);
      return [
        index + 1,
        song?.title ?? 'Unknown',
        entry.key,
        entry.notes ?? '',
      ];
    });

  autoTable(doc, {
    startY: 60,
    head: [['#', 'Song', 'Key', 'Notes']],
    body: rows,
  });

  doc.save(`${setList.title}.pdf`);
}
