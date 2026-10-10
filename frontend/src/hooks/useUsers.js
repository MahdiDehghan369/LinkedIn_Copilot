import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../api/usersApi.js';
import { queryKeys } from '../api/queryKeys.js';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.me, data),
  });
}
