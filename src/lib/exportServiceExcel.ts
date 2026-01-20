import * as XLSX from 'xlsx';
import type { SetList, Song } from '@/lib/types';

export function exportServiceToExcel(
  setList: SetList,
  allSongs: Song[]
) {
  const rows = setList.songs
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => {
      const song = allSongs.find((s) => s.id === entry.songId);
      return {
        Order: index + 1,
        Title: song?.title ?? 'Unknown',
        Key: entry.key,
        Notes: entry.notes ?? '',
      };
    });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Service');

  XLSX.writeFile(wb, `${setList.title}.xlsx`);
}
