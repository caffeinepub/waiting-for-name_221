import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StudySession, Subject, UserProfile } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudySessions() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<StudySession[]>({
    queryKey: ["studySessions", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserStudySessions(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useTotalStudyTime() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["totalStudyTime", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getTotalStudyTimePerSubject(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: { id: string; name: string; description: string }) => {
      if (!actor) throw new Error("Not connected");
      await actor.createSubject(id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useDeleteSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteSubject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useLogStudySession() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subjectId,
      durationMinutes,
      notes,
    }: { subjectId: string; durationMinutes: number; notes: string }) => {
      if (!actor || !identity) throw new Error("Not connected");
      await actor.logStudySession(subjectId, BigInt(durationMinutes), notes);
    },
    onSuccess: () => {
      const principalStr = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({
        queryKey: ["studySessions", principalStr],
      });
      queryClient.invalidateQueries({
        queryKey: ["totalStudyTime", principalStr],
      });
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", identity?.getPrincipal().toString()],
      });
    },
  });
}
