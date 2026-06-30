// Local, no-auth persistent store for the prototype (Phase 0).
// Holds FSRS review state, the learning streak, and community mnemonics +
// the learner's chosen mem per item. Backed by AsyncStorage (localStorage on web).
// In the rollout phase this same surface is backed by Supabase.
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Grade,
  newStreak,
  recordActivity,
  schedule,
  type FsrsState,
  type Item,
  type Mnemonic,
  type StreakState,
} from "@rememeber-it/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCourse, getLevel, getLevelItems } from "./courses";
import { seedMnemonics } from "./mnemonics";

const STORAGE_KEY = "rememeber-it/state/v1";

export interface Friend {
  id: string;
  name: string;
  streak: number; // stub streak for the prototype leaderboard
}

export interface LeaderRow {
  name: string;
  streak: number;
  isMe: boolean;
}

interface PersistedState {
  reviews: Record<string, FsrsState>;
  streak: StreakState;
  userMnemonics: Mnemonic[];
  choices: Record<string, string>; // itemId -> mnemonicId
  friends: Friend[];
}

const empty: PersistedState = {
  reviews: {},
  streak: newStreak(2), // start with 2 streak freezes
  userMnemonics: [],
  choices: {},
  friends: [
    { id: "f-mei", name: "Mei", streak: 21 },
    { id: "f-lars", name: "Lars", streak: 8 },
    { id: "f-priya", name: "Priya", streak: 13 },
  ],
};

interface Store extends PersistedState {
  ready: boolean;
  gradeItem: (item: Item, grade: Grade) => void;
  isItemLearned: (itemId: string) => boolean;
  levelProgress: (levelId: string) => { learned: number; total: number };
  isLevelUnlocked: (courseSlug: string, levelIndex: number) => boolean;
  courseProgress: (courseSlug: string) => { learned: number; total: number };
  mnemonicsFor: (item: Item) => Mnemonic[];
  chooseMnemonic: (itemId: string, mnemonicId: string) => void;
  addMnemonic: (item: Item, text: string) => void;
  addFriend: (name: string) => void;
  leaderboard: () => LeaderRow[];
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (alive && raw) setState({ ...empty, ...(JSON.parse(raw) as PersistedState) });
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: PersistedState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const gradeItem = useCallback(
    (item: Item, grade: Grade) => {
      setState((prev) => {
        const current = prev.reviews[item.id] ?? null;
        const nextReview = schedule(current, grade);
        const next: PersistedState = {
          ...prev,
          reviews: { ...prev.reviews, [item.id]: nextReview },
          streak: recordActivity(prev.streak),
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const isItemLearned = useCallback(
    (itemId: string) => (state.reviews[itemId]?.reps ?? 0) >= 1,
    [state.reviews],
  );

  const levelProgress = useCallback(
    (levelId: string) => {
      const items = getLevelItems(levelId);
      const learned = items.filter((it) => (state.reviews[it.id]?.reps ?? 0) >= 1).length;
      return { learned, total: items.length };
    },
    [state.reviews],
  );

  const isLevelUnlocked = useCallback(
    (courseSlug: string, levelIndex: number) => {
      if (levelIndex <= 0) return true;
      const built = getCourse(courseSlug);
      const prev = built?.levels[levelIndex - 1];
      if (!prev) return false;
      const p = levelProgress(prev.id);
      return p.total > 0 && p.learned >= p.total;
    },
    [levelProgress],
  );

  const courseProgress = useCallback(
    (courseSlug: string) => {
      const items = getCourse(courseSlug)?.items ?? [];
      const learned = items.filter((it) => (state.reviews[it.id]?.reps ?? 0) >= 1).length;
      return { learned, total: items.length };
    },
    [state.reviews],
  );

  const mnemonicsFor = useCallback(
    (item: Item) => [
      ...seedMnemonics(item),
      ...state.userMnemonics.filter((m) => m.itemId === item.id),
    ],
    [state.userMnemonics],
  );

  const chooseMnemonic = useCallback(
    (itemId: string, mnemonicId: string) => {
      persist({ ...state, choices: { ...state.choices, [itemId]: mnemonicId } });
    },
    [persist, state],
  );

  const addMnemonic = useCallback(
    (item: Item, text: string) => {
      const mem: Mnemonic = {
        id: `${item.id}-user-${Date.now()}`,
        itemId: item.id,
        authorId: "me",
        text,
        source: "user",
        status: "approved",
        upvotes: 0,
      };
      persist({
        ...state,
        userMnemonics: [...state.userMnemonics, mem],
        choices: { ...state.choices, [item.id]: mem.id },
      });
    },
    [persist, state],
  );

  const addFriend = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      const friend: Friend = {
        id: `f-${Date.now()}`,
        name: clean,
        streak: 0,
      };
      persist({ ...state, friends: [...state.friends, friend] });
    },
    [persist, state],
  );

  const leaderboard = useCallback((): LeaderRow[] => {
    const rows: LeaderRow[] = [
      { name: "You", streak: state.streak.current, isMe: true },
      ...state.friends.map((f) => ({ name: f.name, streak: f.streak, isMe: false })),
    ];
    return rows.sort((a, b) => b.streak - a.streak);
  }, [state.friends, state.streak.current]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      gradeItem,
      isItemLearned,
      levelProgress,
      isLevelUnlocked,
      courseProgress,
      mnemonicsFor,
      chooseMnemonic,
      addMnemonic,
      addFriend,
      leaderboard,
    }),
    [
      state,
      ready,
      gradeItem,
      isItemLearned,
      levelProgress,
      isLevelUnlocked,
      courseProgress,
      mnemonicsFor,
      chooseMnemonic,
      addMnemonic,
      addFriend,
      leaderboard,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { Grade } from "@rememeber-it/core";
export { getLevel };
