'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { UserRoundPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import UserListItem from './UserListItem';
import { useState, useMemo } from 'react';
import type { User } from '@/app/lib/types';

interface Props {
  users: User[];
  onCreate: () => void;
  onSelectUser: (user: User) => void;
}

export default function UserListCard({ users, onCreate, onSelectUser }: Props) {
  const [page, setPage] = useState(1);

  // Determine how many items per page based on screen size
  // (matches your grid: 1, 2, or 3 columns → 4 rows)
  const itemsPerPage = useMemo(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth >= 1024) return 12; // lg: 3 cols × 4 rows
    if (window.innerWidth >= 640) return 8;  // sm: 2 cols × 4 rows
    return 4;                                // mobile: 1 col × 4 rows
  }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));

  const pagedUsers = users.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Assign access and roles here.</CardDescription>
          </div>

          <button
            onClick={onCreate}
            className="
              p-2 rounded-md border
              bg-muted/20 hover:bg-muted transition
              focus:outline-none focus:ring-2 focus:ring-primary
            "
          >
            <UserRoundPlus className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No users found for this church.
          </p>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedUsers.map((u) => (
            <UserListItem key={u.id} user={u} onClick={() => onSelectUser(u)} />
          ))}
        </div>

        {/* PAGINATION FOOTER */}
        {users.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goPrev}
              disabled={page === 1}
              className="p-2 rounded-md border bg-muted/20 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <button
              onClick={goNext}
              disabled={page === totalPages}
              className="p-2 rounded-md border bg-muted/20 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
