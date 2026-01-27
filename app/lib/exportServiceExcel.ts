import * as XLSX from 'xlsx';
import type { SetList, Song, SetListSongEntry } from './types';

export function exportServiceToExcel(
  setList: SetList,
  allSongs: Song[]
) {
  const allSetlistSongs: SetListSongEntry[] = setList.sections.flatMap(
    (section) => section.songs
  );

  const rows = allSetlistSongs.map((entry, index) => {
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
