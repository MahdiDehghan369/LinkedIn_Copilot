import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notificationsApi.js';
import { queryKeys } from '../api/queryKeys.js';

/** @param {{ unread?: boolean }} [query] */
export function useNotifications(query) {
  return useQuery({
    queryKey: queryKeys.notifications(query),
    queryFn: () => notificationsApi.listNotifications(query),
    select: (data) => data?.notifications ?? [],
  });
}

/** Unread count, derived from the full list — kept as its own hook so the header badge doesn't need to know the shape. */
export function useUnreadNotificationCount() {
  const { data = [] } = useNotifications({ unread: true });
  return data.length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
