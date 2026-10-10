import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as contentApi from '../api/contentApi.js';
import { queryKeys } from '../api/queryKeys.js';

/** @param {{ status?: 'proposed'|'used'|'dismissed' }} [query] */
export function useIdeas(query) {
  return useQuery({
    queryKey: queryKeys.ideas(query),
    queryFn: () => contentApi.listIdeas(query),
    select: (data) => data?.ideas ?? [],
  });
}

export function useSaveIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentApi.saveIdea,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });
}

export function useUpdateIdeaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => contentApi.updateIdeaStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });
}

/** @param {string} weekStart */
export function useCalendar(weekStart) {
  return useQuery({
    queryKey: queryKeys.calendar(weekStart),
    queryFn: () => contentApi.getCalendar(weekStart),
    select: (data) => data?.calendar ?? null,
    enabled: Boolean(weekStart),
  });
}

export function useUpsertCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentApi.upsertCalendar,
    onSuccess: (data) => {
      if (data?.calendar?.weekStart) {
        queryClient.setQueryData(queryKeys.calendar(data.calendar.weekStart), data);
      }
    },
  });
}

export function useContentGaps() {
  return useQuery({
    queryKey: queryKeys.contentGaps,
    queryFn: contentApi.getContentGaps,
    select: (data) => data?.gaps ?? [],
  });
}
