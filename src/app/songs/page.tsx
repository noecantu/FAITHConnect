// 'use client';

// import { PageHeader } from '@/components/page-header';
// import { Button } from '@/components/ui/button';
// import { useChurchId } from '@/hooks/useChurchId';
// import { useSongs } from '@/hooks/useSongs';
// import { useUserRoles } from '@/hooks/useUserRoles';
// import { SongEditorDialog } from '@/components/music/SongEditorDialog';
// import { SongList } from '@/components/music/SongList';

// export default function SongsPage() {
//   const churchId = useChurchId();
//   const { songs, loading } = useSongs(churchId);
//   const { isAdmin, isMusicManager } = useUserRoles(churchId);

//   const canManageSongs = isAdmin || isMusicManager;

//   return (
//     <>
//       <PageHeader title="Songs" />

//       <div className="flex justify-end mb-4">
//         {canManageSongs && (
//           <SongEditorDialog mode="create">
//             <Button>Add Song</Button>
//           </SongEditorDialog>
//         )}
//       </div>

//       <SongList songs={songs} loading={loading} canManage={canManageSongs} />
//     </>
//   );
// }
