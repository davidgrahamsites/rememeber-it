import {
  buildMultipleChoice,
  checkAnswer,
  chooseExerciseType,
  Grade,
  isStreakAlive,
  type ExerciseType,
  type Item,
  type MultipleChoice,
} from "@rememeber-it/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Body, Card, H1, H2, Pill, PrimaryButton, ProgressBar, ScreenScroll } from "../../components/ui";
import { getCourseItems, getLevel, getLevelItems } from "../../lib/courses";
import { busSend } from "../../lib/databus";
import { canRecognizeSpeech, recognizeOnce, speak } from "../../lib/speech";
import { useStore } from "../../lib/store";
import { theme } from "../../lib/theme";
import { useKeyboard as useKeyboardEffect } from "../../lib/useKeyboard";
import { actionForKey, gradeForKey, KEY_LEGEND } from "@rememeber-it/core";

function availableFor(item: Item): ExerciseType[] {
  if (item.kind === "grammar" && item.clozeSentence) return ["cloze"];
  return ["multipleChoice", "typing", "speaking"];
}

export default function LearnLevel() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const store = useStore();
  const router = useRouter();

  const level = levelId ? getLevel(levelId) : undefined;
  const items = useMemo(() => (levelId ? getLevelItems(levelId) : []), [levelId]);

  const [idx, setIdx] = useState(0);
  const [exType, setExType] = useState<ExerciseType>("multipleChoice");
  const [phase, setPhase] = useState<"answer" | "feedback">("answer");
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [showMnem, setShowMnem] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [done, setDone] = useState(false);
  const firedDone = useRef(false);

  const current: Item | undefined = items[idx];
  const pool = useMemo(
    () => (current ? getCourseItems(current.courseId) : []),
    [current],
  );
  const mc: MultipleChoice | null = useMemo(
    () => (current && exType === "multipleChoice" ? buildMultipleChoice(current, pool) : null),
    [current, exType, pool],
  );

  // Pick the exercise type when entering each item.
  useEffect(() => {
    if (!current) return;
    setExType(chooseExerciseType(current, store.reviews[current.id] ?? null, availableFor(current)));
    setPhase("answer");
    setSelected(null);
    setTyped("");
    setCorrect(null);
    setHeard(null);
    setShowMnem(false);
  }, [idx, current]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    if (!firedDone.current && level) {
      firedDone.current = true;
      busSend(`Completed "${level.title}" — ${items.length} items reviewed.`, {
        event: "level_complete",
        levelId,
        count: items.length,
      });
    }
    setDone(true);
  }, [level, items.length, levelId]);

  const gradeAndNext = useCallback(
    (grade: Grade) => {
      if (!current) return;
      store.gradeItem(current, grade);
      if (idx + 1 < items.length) setIdx((i) => i + 1);
      else finish();
    },
    [current, idx, items.length, store, finish],
  );

  const reveal = useCallback(() => {
    setCorrect(false);
    setPhase("feedback");
  }, []);

  const evaluateTyping = useCallback(() => {
    if (!current) return;
    const ok = checkAnswer(typed, current);
    setCorrect(ok);
    setPhase("feedback");
  }, [current, typed]);

  const chooseOption = useCallback(
    (i: number) => {
      if (!mc || phase !== "answer") return;
      setSelected(i);
      setCorrect(i === mc.correctIndex);
      setPhase("feedback");
    },
    [mc, phase],
  );

  const doSpeak = useCallback(async () => {
    if (!current) return;
    try {
      const said = await recognizeOnce("zh-CN");
      setHeard(said);
      setCorrect(said.includes(current.prompt));
      setPhase("feedback");
    } catch {
      reveal();
    }
  }, [current, reveal]);

  // Keyboard controls (web).
  const onKey = useCallback(
    (key: string) => {
      if (done) return;
      if (key === "m" || key === "M") {
        setShowMnem((v) => !v);
        return;
      }
      const action = actionForKey(key);
      if (!action) return;
      switch (action.type) {
        case "help":
          setShowHelp((v) => !v);
          return;
        case "exit":
          if (showHelp) setShowHelp(false);
          else router.back();
          return;
        case "replayAudio":
          if (current) speak(current.prompt);
          return;
      }
      if (phase === "answer") {
        if (action.type === "choose" && mc) chooseOption(action.index);
        else if (action.type === "reveal") reveal();
        else if (action.type === "submit" && exType === "speaking") void doSpeak();
      } else {
        // feedback phase: 1–4 self-rate, Enter continues with auto grade
        const g = gradeForKey(key);
        if (g) gradeAndNext(g);
        else if (action.type === "submit") gradeAndNext(correct ? Grade.Good : Grade.Again);
      }
    },
    [done, showHelp, phase, mc, exType, current, correct, chooseOption, reveal, doSpeak, gradeAndNext, router],
  );

  // Web key listener.
  useKeyboardEffect(onKey, !done);

  if (!level || items.length === 0) {
    return (
      <ScreenScroll>
        <Body>Level not found.</Body>
      </ScreenScroll>
    );
  }

  if (done) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <ScreenScroll>
          <H1>Level complete 🎉</H1>
          <Card>
            <H2>{level.title}</H2>
            <Body>{items.length} items reviewed.</Body>
            <Body dim>
              Streak: {store.streak.current} day{store.streak.current === 1 ? "" : "s"}{" "}
              {isStreakAlive(store.streak) ? "🔥" : ""}
            </Body>
          </Card>
          <PrimaryButton label="Back to course" onPress={() => router.back()} />
        </ScreenScroll>
      </>
    );
  }

  if (!current) return null;

  return (
    <>
      <Stack.Screen options={{ title: `${idx + 1} / ${items.length}` }} />
      <ScreenScroll>
        <ProgressBar value={(idx + (phase === "feedback" ? 1 : 0)) / items.length} />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Pill text={labelFor(exType)} tone="accent" />
          <Pill text={current.kind} />
        </View>

        {/* Prompt */}
        <Card>
          {exType === "cloze" && current.clozeSentence ? (
            <Text style={{ color: theme.color.text, fontSize: 40, fontWeight: "800", textAlign: "center" }}>
              {current.clozeSentence.replace("___", " ____ ")}
            </Text>
          ) : (
            <Text style={{ color: theme.color.text, fontSize: theme.font.prompt, fontWeight: "800", textAlign: "center" }}>
              {current.prompt}
            </Text>
          )}
          {current.reading ? (
            <Text style={{ color: theme.color.textDim, textAlign: "center", fontSize: 18 }}>
              {phase === "feedback" || exType === "multipleChoice" ? current.reading : "•••"}
            </Text>
          ) : null}
          <Pressable onPress={() => speak(current.prompt)} style={{ alignSelf: "center", marginTop: 6 }}>
            <Text style={{ color: theme.color.primary, fontWeight: "700" }}>🔊 Play (Space)</Text>
          </Pressable>
        </Card>

        {/* Question UI */}
        {phase === "answer" && (
          <QuestionArea
            exType={exType}
            mc={mc}
            typed={typed}
            setTyped={setTyped}
            onChoose={chooseOption}
            onSubmitTyping={evaluateTyping}
            onReveal={reveal}
            onSpeak={doSpeak}
          />
        )}

        {/* Feedback UI */}
        {phase === "feedback" && (
          <Feedback
            correct={correct}
            answer={current.answer}
            reading={current.reading}
            heard={heard}
            chosenMem={chosenMemText(store, current)}
            onGrade={gradeAndNext}
            onContinue={() => gradeAndNext(correct ? Grade.Good : Grade.Again)}
          />
        )}

        {/* Mnemonics + help toggles */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <PrimaryButton label={showMnem ? "Hide mnemonics" : "Mnemonics (M)"} tone="muted" onPress={() => setShowMnem((v) => !v)} />
          <PrimaryButton label="Keys (?)" tone="muted" onPress={() => setShowHelp((v) => !v)} />
        </View>

        {showMnem && <MnemonicPanel item={current} />}
        {showHelp && <HelpPanel />}
      </ScreenScroll>
    </>
  );
}

/* ---------- sub-components ---------- */

function QuestionArea(props: {
  exType: ExerciseType;
  mc: MultipleChoice | null;
  typed: string;
  setTyped: (s: string) => void;
  onChoose: (i: number) => void;
  onSubmitTyping: () => void;
  onReveal: () => void;
  onSpeak: () => void;
}) {
  const { exType, mc, typed, setTyped, onChoose, onSubmitTyping, onReveal, onSpeak } = props;

  if (exType === "multipleChoice" && mc) {
    return (
      <View style={{ gap: 10 }}>
        {mc.options.map((opt, i) => (
          <Pressable
            key={`${opt}-${i}`}
            onPress={() => onChoose(i)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.color.surfaceAlt : theme.color.surface,
              borderColor: theme.color.border,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: 16,
              flexDirection: "row",
              gap: 12,
            })}
          >
            <Text style={{ color: theme.color.accent, fontWeight: "800", fontSize: 18 }}>{i + 1}</Text>
            <Text style={{ color: theme.color.text, fontSize: 18 }}>{opt}</Text>
          </Pressable>
        ))}
        <Body dim>Press 1–4 to choose.</Body>
      </View>
    );
  }

  if (exType === "typing" || exType === "cloze") {
    return (
      <View style={{ gap: 10 }}>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          onSubmitEditing={onSubmitTyping}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={exType === "cloze" ? "Type the missing word" : "Type the meaning"}
          placeholderTextColor={theme.color.textDim}
          style={{
            backgroundColor: theme.color.surface,
            color: theme.color.text,
            borderColor: theme.color.border,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            padding: 16,
            fontSize: 20,
          }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <PrimaryButton label="Submit (Enter)" onPress={onSubmitTyping} />
          <PrimaryButton label="Reveal (R)" tone="muted" onPress={onReveal} />
        </View>
      </View>
    );
  }

  // speaking
  return (
    <View style={{ gap: 10 }}>
      <Body>Say the prompt aloud.</Body>
      {canRecognizeSpeech() ? (
        <PrimaryButton label="🎤 Speak (Enter)" onPress={onSpeak} />
      ) : (
        <Body dim>Speech recognition isn't available here — reveal and rate yourself.</Body>
      )}
      <PrimaryButton label="Reveal (R)" tone="muted" onPress={onReveal} />
    </View>
  );
}

function Feedback(props: {
  correct: boolean | null;
  answer: string;
  reading?: string;
  heard: string | null;
  chosenMem: string | null;
  onGrade: (g: Grade) => void;
  onContinue: () => void;
}) {
  const { correct, answer, reading, heard, chosenMem, onGrade, onContinue } = props;
  const tone = correct == null ? theme.color.textDim : correct ? theme.color.correct : theme.color.wrong;
  return (
    <Card style={{ borderColor: tone }}>
      <H2>{correct == null ? "Revealed" : correct ? "Correct ✓" : "Not quite ✗"}</H2>
      <Body>
        Answer: <Text style={{ fontWeight: "800" }}>{answer}</Text>
        {reading ? `  ·  ${reading}` : ""}
      </Body>
      {heard != null && <Body dim>Heard: “{heard || "—"}”</Body>}
      {chosenMem && <Body dim>💡 {chosenMem}</Body>}
      <Body dim>How well did you know it?</Body>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <PrimaryButton label="1 · Again" tone="muted" onPress={() => onGrade(Grade.Again)} />
        <PrimaryButton label="2 · Hard" tone="muted" onPress={() => onGrade(Grade.Hard)} />
        <PrimaryButton label="3 · Good" onPress={() => onGrade(Grade.Good)} />
        <PrimaryButton label="4 · Easy" tone="accent" onPress={() => onGrade(Grade.Easy)} />
      </View>
      <PrimaryButton label="Continue (Enter)" tone="muted" onPress={onContinue} />
    </Card>
  );
}

function MnemonicPanel({ item }: { item: Item }) {
  const store = useStore();
  const mems = store.mnemonicsFor(item);
  const chosen = store.choices[item.id];
  const [draft, setDraft] = useState("");
  return (
    <Card>
      <H2>Mnemonics</H2>
      <Body dim>Pick the mem that helps you most, or add your own.</Body>
      {mems.map((m) => {
        const isChosen = chosen ? chosen === m.id : m.id === mems[0]?.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => store.chooseMnemonic(item.id, m.id)}
            style={{
              backgroundColor: isChosen ? theme.color.surfaceAlt : "transparent",
              borderColor: isChosen ? theme.color.accent : theme.color.border,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: 12,
            }}
          >
            <Text style={{ color: theme.color.text }}>
              {isChosen ? "★ " : "☆ "}
              {m.text}
            </Text>
            <Text style={{ color: theme.color.textDim, fontSize: 12, marginTop: 4 }}>
              {m.source === "ai" ? "AI seed" : "community"}
            </Text>
          </Pressable>
        );
      })}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Write your own mnemonic…"
        placeholderTextColor={theme.color.textDim}
        style={{
          backgroundColor: theme.color.surface,
          color: theme.color.text,
          borderColor: theme.color.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          padding: 12,
        }}
      />
      <PrimaryButton
        label="Add my mnemonic"
        onPress={() => {
          if (draft.trim()) {
            store.addMnemonic(item, draft.trim());
            setDraft("");
          }
        }}
      />
    </Card>
  );
}

function HelpPanel() {
  return (
    <Card>
      <H2>Keyboard</H2>
      {KEY_LEGEND.map((k) => (
        <Body key={k.keys}>
          <Text style={{ fontWeight: "800", color: theme.color.accent }}>{k.keys}</Text> — {k.label}
        </Body>
      ))}
      <Body>
        <Text style={{ fontWeight: "800", color: theme.color.accent }}>M</Text> — Toggle mnemonics
      </Body>
    </Card>
  );
}

/* ---------- helpers ---------- */

function labelFor(t: ExerciseType): string {
  return t === "multipleChoice"
    ? "Multiple choice"
    : t === "cloze"
      ? "Fill the blank"
      : t === "typing"
        ? "Type it"
        : "Speak it";
}

function chosenMemText(store: ReturnType<typeof useStore>, item: Item): string | null {
  const mems = store.mnemonicsFor(item);
  const chosenId = store.choices[item.id];
  const m = chosenId ? mems.find((x) => x.id === chosenId) : mems[0];
  return m?.text ?? null;
}
