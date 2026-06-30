import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Body, Card, H2, Pill, ProgressBar, ScreenScroll } from "../../components/ui";
import { getCourse } from "../../lib/courses";
import { useStore } from "../../lib/store";
import { theme } from "../../lib/theme";

export default function CoursePath() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const store = useStore();
  const built = slug ? getCourse(slug) : undefined;

  if (!built) {
    return (
      <ScreenScroll>
        <Body>Course not found.</Body>
      </ScreenScroll>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: built.course.title }} />
      <ScreenScroll>
        <Body dim>{built.course.description}</Body>
        {built.levels.map((lv, i) => {
          const p = store.levelProgress(lv.id);
          const unlocked = store.isLevelUnlocked(built.course.slug, i);
          const done = p.total > 0 && p.learned >= p.total;
          return (
            <Card
              key={lv.id}
              style={{
                opacity: unlocked ? 1 : 0.55,
                borderColor: done ? theme.color.accent : theme.color.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <H2>
                  {done ? "✓ " : ""}
                  {lv.title}
                </H2>
                <Pill
                  text={!unlocked ? "Locked" : `${p.learned}/${p.total}`}
                  tone={done ? "accent" : "default"}
                />
              </View>
              <ProgressBar value={p.total ? p.learned / p.total : 0} />
              {unlocked ? (
                <Link href={`/learn/${lv.id}`} asChild>
                  <Pressable>
                    <Text style={{ color: theme.color.primary, fontWeight: "700", marginTop: 6 }}>
                      {done ? "Review level →" : p.learned > 0 ? "Continue →" : "Start level →"}
                    </Text>
                  </Pressable>
                </Link>
              ) : (
                <Body dim>Finish the previous level to unlock.</Body>
              )}
            </Card>
          );
        })}
      </ScreenScroll>
    </>
  );
}
