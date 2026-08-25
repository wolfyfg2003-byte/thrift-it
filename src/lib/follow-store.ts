import { useSyncExternalStore } from "react";

type FollowState = {
  usernames: string[];
};

const listeners = new Set<() => void>();

let state: FollowState = {
  usernames: ["sarah-dxb"],
};
const SERVER_FOLLOW: FollowState = {
  usernames: ["sarah-dxb"],
};

function emit() {
  listeners.forEach((listener) => listener());
}

export function getFollowState(): FollowState {
  return state;
}

export function subscribeFollow(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFollowing(username: string): boolean {
  return state.usernames.includes(username);
}

export function toggleFollow(username: string) {
  const slug = username.replace(/^@/, "").toLowerCase().replace(/_/g, "-");
  const next = state.usernames.includes(slug)
    ? state.usernames.filter((item) => item !== slug)
    : [...state.usernames, slug];
  state = { usernames: next };
  emit();
}

export function useFollowState(): FollowState {
  return useSyncExternalStore(subscribeFollow, getFollowState, () => SERVER_FOLLOW);
}

export function useIsFollowing(username: string): boolean {
  const snapshot = useFollowState();
  return snapshot.usernames.includes(username);
}
