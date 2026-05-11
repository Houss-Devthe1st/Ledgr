import { Text, View } from "react-native";

export default function AuthBrandBlock() {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">L</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Ledgr</Text>
          <Text className="auth-wordmark-sub">Subscription Tracker</Text>
        </View>
      </View>
    </View>
  );
}
