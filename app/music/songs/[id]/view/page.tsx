import SongViewOnly from "../../../../components/music/SongViewOnly";

export default function SongViewPage({
  params,
}: {
  params: { id: string };
}) {
  return <SongViewOnly songId={params.id} />;
}
