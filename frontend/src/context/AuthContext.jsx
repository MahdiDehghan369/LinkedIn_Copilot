import { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/authApi.js';
import * as usersApi from '../api/usersApi.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

const AuthContext = createContext(null);

const ME_QUERY_KEY = queryKeys.me;

/**
 * Wraps the app once, near the root. Holds the authenticated user (or
 * `null`) resolved from the session cookie via `GET /api/users/me` —
 * there is no client-side token to inspect, so "am I logged in" is
 * always answered by asking the backend.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => usersApi.getMe(),
    retry: false, // a 401 here means "logged out", not a transient failure
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.setQueryData(ME_QUERY_KEY, null),
  });

  const isSessionMissing = meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;

  const value = useMemo(
    () => ({
      user: meQuery.data?.user ?? null,
      isLoadingSession: meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data?.user),
      isSessionMissing,
      login: loginMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error,
      register: registerMutation.mutateAsync,
      isRegistering: registerMutation.isPending,
      registerError: registerMutation.error,
      logout: logoutMutation.mutateAsync,
      isLoggingOut: logoutMutation.isPending,
      refetchUser: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      isSessionMissing,
      loginMutation.mutateAsync,
      loginMutation.isPending,
      loginMutation.error,
      registerMutation.mutateAsync,
      registerMutation.isPending,
      registerMutation.error,
      logoutMutation.mutateAsync,
      logoutMutation.isPending,
      queryClient,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** @returns {ReturnType<typeof useMemo> & object} */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
