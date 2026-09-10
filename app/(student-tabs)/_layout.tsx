import { Tabs } from "expo-router";
import { SWTabBar } from "../../components/sw";

export default function StudentTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <SWTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
