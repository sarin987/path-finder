import { useState, useEffect } from 'react';
import { API_ROUTES } from '../config';
import { Storage, StorageKeys } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID in auth context:', user);
        setLoading(false);
        return;
      }

      const token = await Storage.getItem(StorageKeys.USER_TOKEN);
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching profile for user:', user.id);
      
      const response = await fetch(`${API_ROUTES.users}/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Profile response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Store and set profile data
      await Storage.setItem(StorageKeys.USER_PROFILE, data.profile);
      setProfile(data.profile);

    } catch (error) {
      console.error('Profile fetch error:', error);
      setError(error.message);
      
      // Try to load from cache
      const cached = await Storage.getItem(StorageKeys.USER_PROFILE);
      if (cached) {
        console.log('Using cached profile data');
        setProfile(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return { profile, loading, error, refetch: fetchProfile };
};