import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { Favorite } from '../../shared/api';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  // Add a favorite
  const addFavorite = async (product: Omit<Favorite, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(product)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add favorite');
      }
      
      const newFavorite = await response.json();
      setFavorites(prev => [newFavorite, ...prev]);
      return newFavorite;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add favorite');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove a favorite
  const removeFavorite = async (favoriteId: number) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }
      
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if a product is favorited
  const checkFavorite = async (url: string): Promise<{ isFavorited: boolean; favoriteId?: number }> => {
    if (!user) return { isFavorited: false };
    
    try {
      const response = await fetch(`/api/favorites/check?url=${encodeURIComponent(url)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to check favorite status');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error checking favorite status:', err);
      return { isFavorited: false };
    }
  };

  // Load favorites on mount
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    checkFavorite,
    fetchFavorites
  };
} 