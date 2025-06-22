'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function SyncUserWithConvex() {
  const { user } = useUser();
  const updateUser = useMutation(api.users.createOrUpdateUser); // Make sure function name matches in convex

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      try {
        await updateUser({
          userId: user.id,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.emailAddresses[0]?.emailAddress ?? '',
          imageUrl: user.imageUrl ?? '',
        });
      } catch (error) {
        console.error('Error syncing user:', error);
      }
    };

    syncUser();
  }, [user, updateUser]);

  return null;
}
