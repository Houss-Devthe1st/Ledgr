import { Link } from "expo-router";
import "@/global.css"
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      <Link href="/onboarding" className="mt-4 rounded bg-primary text-white p-4">Go to Onboarding </Link>

      <Link href="/(auth)/SignIn" className="mt-4 rounded bg-primary text-white p-4">Go to Sign In </Link>

      <Link href="/(auth)/SignUp" className="mt-4 rounded bg-primary text-white p-4">Go to Sign Up </Link>

      <Link href="./subscriptions/spotify" className="mt-4 rounded bg-primary text-white p-4">Spotify Subscription </Link>
      <Link href={{ pathname: "./subscriptions/[id]", params: { id: "claude" } }} className="mt-4 rounded bg-primary text-white p-4">
        Claude Max Subscription
      </Link>

    </View>
  );
}