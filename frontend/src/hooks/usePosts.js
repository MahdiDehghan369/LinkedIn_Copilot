import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as postsApi from '../api/postsApi.js';
import { queryKeys } from '../api/queryKeys.js';

/** @param {{ status?: string, page?: number, pageSize?: number }} [query] */
export function usePosts(query) {
  return useQuery({
    queryKey: queryKeys.posts(query),
    queryFn: () => postsApi.listPosts(query),
  });
}

/** @param {string} id */
export function usePost(id) {
  return useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => postsApi.getPost(id),
    select: (data) => data?.post,
    enabled: Boolean(id),
  });
}

/**
 * Every mutation below invalidates the whole `posts` query family (list +
 * any individual post) — post actions are infrequent enough that a broad
 * invalidation is simpler and safer than hand-picking exact keys per
 * action, and avoids stale status badges after a transition.
 */
function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['posts'] });
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: postsApi.createPost, onSuccess: invalidate });
}

export function useUpdatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, patch }) => postsApi.updatePost(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: postsApi.deletePost, onSuccess: invalidate });
}

export function useApprovePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: postsApi.approvePost, onSuccess: invalidate });
}

export function usePublishPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: postsApi.publishPost, onSuccess: invalidate });
}

export function useSchedulePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, scheduledFor }) => postsApi.schedulePost(id, scheduledFor),
    onSuccess: invalidate,
  });
}

export function useCancelPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: postsApi.cancelPost, onSuccess: invalidate });
}

export function useUploadPostImage() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, file }) => postsApi.uploadPostImage(id, file),
    onSuccess: invalidate,
  });
}

export function useDeletePostImage() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: postsApi.deletePostImage,
    onSuccess: invalidate,
  });
}