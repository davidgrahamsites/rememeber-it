// Shared UI primitives for the prototype.
import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { theme } from "../lib/theme";

export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}
export function Body({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <Text style={[s.body, dim && { color: theme.color.textDim }]}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "accent" | "muted";
}) {
  const bg =
    tone === "accent"
      ? theme.color.accent
      : tone === "muted"
        ? theme.color.surfaceAlt
        : theme.color.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = "default" }: { text: string; tone?: "default" | "accent" }) {
  return (
    <View
      style={[
        s.pill,
        { backgroundColor: tone === "accent" ? theme.color.accent : theme.color.surfaceAlt },
      ]}
    >
      <Text style={[s.pillText, tone === "accent" && { color: "#04201a" }]}>{text}</Text>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  screenContent: { padding: theme.space(2), gap: theme.space(2), paddingBottom: theme.space(6) },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space(2),
    borderWidth: 1,
    borderColor: theme.color.border,
    gap: theme.space(1),
  },
  h1: { color: theme.color.text, fontSize: theme.font.title, fontWeight: "800" },
  h2: { color: theme.color.text, fontSize: theme.font.h2, fontWeight: "700" },
  body: { color: theme.color.text, fontSize: theme.font.body, lineHeight: 22 },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  btnText: { color: theme.color.primaryText, fontSize: theme.font.body, fontWeight: "700" },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    alignSelf: "flex-start",
  },
  pillText: { color: theme.color.text, fontSize: theme.font.small, fontWeight: "700" },
  track: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: theme.color.accent },
});
