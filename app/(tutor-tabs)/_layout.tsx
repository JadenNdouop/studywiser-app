import { Tabs } from "expo-router";
import { SWTabBar } from "../../components/sw";

export default function TutorTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <SWTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="find" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
