import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { checkIsFollowing, toggleFollow } from '@/services/users';

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUserId || user.uid === targetUserId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    checkIsFollowing(user.uid, targetUserId)
      .then(following => {
        if (mounted) {
          setIsFollowing(following);
          setLoading(false);
        }
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [user, targetUserId]);

  const handleToggle = async () => {
    if (!user || user.uid === targetUserId) return;
    try {
      const newStatus = !isFollowing;
      setIsFollowing(newStatus); // Optimistic UI
      await toggleFollow(user.uid, targetUserId, isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(isFollowing); // Revert on failure
    }
  };

  return {
    isFollowing,
    loading,
    toggleFollow: handleToggle,
    canFollow: user && user.uid !== targetUserId
  };
}
