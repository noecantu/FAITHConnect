'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { UserRoundPlus } from 'lucide-react';
import UserListItem from './UserListItem';
import type { User } from '@/app/lib/types';

interface Props {
  users: User[];
  onCreate: () => void;
  onSelectUser: (user: User) => void;
}

export default function UserListCard({ users, onCreate, onSelectUser }: Props) {
  return (
    <Card>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <UserListItem key={u.id} user={u} onClick={() => onSelectUser(u)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
