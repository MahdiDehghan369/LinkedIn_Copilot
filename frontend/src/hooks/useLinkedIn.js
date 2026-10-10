import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as linkedinApi from '../api/linkedinApi.js';
import { queryKeys } from '../api/queryKeys.js';

export function useLinkedInStatus() {
  return useQuery({
    queryKey: queryKeys.linkedinStatus,
    queryFn: linkedinApi.getLinkedInStatus,
  });
}

export function useDisconnectLinkedIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkedinApi.disconnectLinkedIn,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.linkedinStatus, data),
  });
}
