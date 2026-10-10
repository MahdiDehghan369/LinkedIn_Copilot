import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as analyticsApi from '../api/analyticsApi.js';
import { queryKeys } from '../api/queryKeys.js';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analyticsOverview,
    queryFn: analyticsApi.getAnalyticsOverview,
  });
}

/** @param {string} postId */
export function usePostAnalytics(postId) {
  return useQuery({
    queryKey: queryKeys.postAnalytics(postId),
    queryFn: () => analyticsApi.getPostAnalytics(postId),
    select: (data) => data?.analytics,
    enabled: Boolean(postId),
    retry: false, // a 404 here just means "not refreshed yet" — not worth retrying
  });
}

export function useRefreshPostAnalytics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: analyticsApi.refreshPostAnalytics,
    onSuccess: (data, postId) => {
      queryClient.setQueryData(queryKeys.postAnalytics(postId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.analyticsOverview });
    },
  });
}

export function usePerformanceInsight() {
  return useMutation({ mutationFn: analyticsApi.getPerformanceInsight });
}
