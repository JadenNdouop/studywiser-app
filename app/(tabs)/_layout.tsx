import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

const TAB_ICONS: Record<string, [focused: string, unfocused: string]> = {
  index:    ["home",        "home-outline"],
  chat:     ["chatbubble",  "chatbubble-outline"],
  profile:  ["person",      "person-outline"],
  sessions: ["calendar",    "calendar-outline"],
};

function FloatingTabBar({ state, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
        const iconName = isFocused ? icons[0] : icons[1];

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName as any}
              size={24}
              color={isFocused ? "#ffffff" : "rgba(255,255,255,0.45)"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="sessions" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 16,
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: "#014aad",
    borderRadius: 36,
    flexDirection: "row",
    elevation: 12,
    shadowColor: "#014aad",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
