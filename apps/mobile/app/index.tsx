import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Card, H1, H2, Pill, ProgressBar, ScreenScroll } from "../components/ui";
import { allCourses } from "../lib/courses";
import { isStreakAlive } from "@rememeber-it/core";
import { useStore } from "../lib/store";
import { theme } from "../lib/theme";

export default function Home() {
  const store = useStore();
  if (!store.ready) {
    return (
      <ScreenScroll>
        <Body dim>Loading…</Body>
      </ScreenScroll>
    );
  }

  const alive = isStreakAlive(store.streak);

  return (
    <ScreenScroll>
      <H1>Rememeber It</H1>
      <Body dim>Spaced-repetition language learning with community mnemonics.</Body>

      <Card style={{ borderColor: alive ? theme.color.accent : theme.color.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <H2>{store.streak.current} day streak {alive ? "🔥" : "🧊"}</H2>
            <Body dim>Longest {store.streak.longest} · {store.streak.freezes} freezes left</Body>
          </View>
          <Pill text={alive ? "Active today" : "Practice to keep it"} tone={alive ? "accent" : "default"} />
        </View>
        <Link href="/social" asChild>
          <Pressable>
            <Text style={{ color: theme.color.primary, fontWeight: "700", marginTop: 4 }}>
              Friends & leaderboard →
            </Text>
          </Pressable>
        </Link>
      </Card>

      <H2>Courses</H2>
      {allCourses.map((c) => {
        const p = store.courseProgress(c.slug);
        return (
          <Link key={c.slug} href={`/course/${c.slug}`} asChild>
            <Pressable>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <H2>{c.title}</H2>
                  <Pill text={`${p.learned}/${p.total}`} />
                </View>
                <Body dim>{c.description}</Body>
                <ProgressBar value={p.total ? p.learned / p.total : 0} />
                <Text style={{ color: theme.color.primary, fontWeight: "700", marginTop: 4 }}>
                  Open course →
                </Text>
              </Card>
            </Pressable>
          </Link>
        );
      })}

      <Body dim>Tip: on web everything is keyboard-driven. Press ? during a lesson for the key map.</Body>
    </ScreenScroll>
  );
}
