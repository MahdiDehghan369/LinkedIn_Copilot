import { useMutation } from '@tanstack/react-query';
import * as aiApi from '../api/aiApi.js';

export function useGenerateIdeas() {
  return useMutation({ mutationFn: aiApi.generateIdeas });
}

export function useGeneratePost() {
  return useMutation({ mutationFn: aiApi.generatePost });
}

export function useImprovePost() {
  return useMutation({ mutationFn: aiApi.improvePost });
}

export function useAnalyzeWritingStyle() {
  return useMutation({ mutationFn: aiApi.analyzeWritingStyle });
}
