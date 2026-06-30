import { useState } from "react";
import { TextInput, View } from "react-native";
import { Body, Card, H1, H2, Pill, PrimaryButton, ScreenScroll } from "../components/ui";
import { useStore } from "../lib/store";
import { theme } from "../lib/theme";

export default function Social() {
  const store = useStore();
  const [name, setName] = useState("");
  if (!store.ready) {
    return (
      <ScreenScroll>
        <Body dim>Loading…</Body>
      </ScreenScroll>
    );
  }

  const rows = store.leaderboard();

  return (
    <ScreenScroll>
      <H1>Friends</H1>
      <Body dim>Local prototype — cloud sync & real accounts arrive in the rollout phases.</Body>

      <Card>
        <H2>Leaderboard</H2>
        {rows.map((r, i) => (
          <View
            key={`${r.name}-${i}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: i < rows.length - 1 ? 1 : 0,
              borderBottomColor: theme.color.border,
            }}
          >
            <Body>
              <Body>{`${i + 1}. `}</Body>
              {r.isMe ? `${r.name} ⭐` : r.name}
            </Body>
            <Pill text={`${r.streak} 🔥`} tone={r.isMe ? "accent" : "default"} />
          </View>
        ))}
      </Card>

      <Card>
        <H2>Add a friend</H2>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={() => {
            store.addFriend(name);
            setName("");
          }}
          placeholder="Friend's name or username"
          placeholderTextColor={theme.color.textDim}
          autoCapitalize="none"
          style={{
            backgroundColor: theme.color.surface,
            color: theme.color.text,
            borderColor: theme.color.border,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            padding: 14,
            fontSize: 16,
          }}
        />
        <PrimaryButton
          label="Add friend"
          onPress={() => {
            store.addFriend(name);
            setName("");
          }}
        />
      </Card>

      <Card>
        <H2>Your friends ({store.friends.length})</H2>
        {store.friends.map((f) => (
          <View
            key={f.id}
            style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
          >
            <Body>{f.name}</Body>
            <Body dim>{f.streak} day streak</Body>
          </View>
        ))}
      </Card>
    </ScreenScroll>
  );
}
