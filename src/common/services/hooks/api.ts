import {
  InfiniteQueryObserverResult,
  QueryFunction,
  QueryKey,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  getCollections,
  getCurrentExperience,
  getExperiences,
  setCurrentExperience,
} from "../api";
import { Experience } from "../../../types/experience";
import { Collection } from "../../../types/collection";
import { ApiError, setAuthCode } from "../apiUtils";
import { ApiStatusResponse } from "../../../types/response";

const RETRY_COUNT = 3;

const useQueryRetryUnless400 = <
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: UseQueryOptions<TQueryFnData, ApiError, TData, TQueryKey>
) =>
  useQuery(queryKey, queryFn, {
    retry: (failureCount, error) =>
      error.response &&
      error.response.status < 400 &&
      error.response.status >= 500 &&
      failureCount < RETRY_COUNT,
    ...options,
  });

export const useExperiences = (): UseQueryResult<
  Record<string, Experience>,
  ApiError
> => useQueryRetryUnless400(["experiences"], getExperiences);

export const useExperience = (id: string): Experience | undefined => {
  const { data: experiencesMap } = useExperiences();

  if (experiencesMap == null || !(id in experiencesMap)) {
    return undefined;
  }

  return experiencesMap[id];
};

export const useCollections = (): UseQueryResult<
  Record<string, Collection>,
  ApiError
> => useQueryRetryUnless400(["collections"], getCollections);

export const useCurrentExperience = (
  notifyOnChangeProps: Array<keyof InfiniteQueryObserverResult> | "tracked" = [
    "data",
    "error",
  ]
): UseQueryResult<Experience, ApiError> =>
  useQueryRetryUnless400(["current"], getCurrentExperience, {
    refetchInterval: 500,
    notifyOnChangeProps: notifyOnChangeProps,
  });

export const useCurrentExperienceMutation = (): UseMutationResult<
  ApiStatusResponse,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  // TODO: Figure why onSuccess is being marked as unused
  // noinspection JSUnusedGlobalSymbols
  return useMutation(setCurrentExperience, {
    onSuccess: async () => queryClient.invalidateQueries("current"),
  });
};

export const useAuthCodeMutation = (): UseMutationResult<
  void,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  // TODO: Figure why onSuccess is being marked as unused
  // noinspection JSUnusedGlobalSymbols
  return useMutation(setAuthCode, {
    onSuccess: async () => queryClient.invalidateQueries(),
  });
};
