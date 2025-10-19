import { StyleSheet, Text, View } from "react-native";

export default function SessionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your upcoming tutoring sessions 📅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  text: { fontSize: 18, color: "#014aad", fontWeight: "600" },
});
