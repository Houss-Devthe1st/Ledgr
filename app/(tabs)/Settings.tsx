import images from "@/constants/images";
import { useBudget } from "@/lib/budget";
import { useClerk, useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="sub-row py-3 border-b border-border">
      <Text className="sub-label">{label}</Text>
      <Text className="sub-value text-right" numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const { monthlyBudget, isLoading: budgetLoading, setMonthlyBudget, clearMonthlyBudget } = useBudget();

  const [draft, setDraft] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!budgetLoading && !initialized.current) {
      initialized.current = true;
      setDraft(monthlyBudget !== null ? String(monthlyBudget) : "");
    }
  }, [budgetLoading, monthlyBudget]);

  const handleBlur = () => {
    const raw = draft.trim();
    const n = parseFloat(raw);
    if (raw !== "" && !isNaN(n) && n > 0) {
      setMonthlyBudget(n);
    } else {
      clearMonthlyBudget();
      setDraft("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/SignIn");
  };

  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "—";
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const username = user?.username ?? "—";
  const memberSince = user?.createdAt ? dayjs(user.createdAt).format("MMM D, YYYY") : "—";
  const lastSignIn = user?.lastSignInAt
    ? dayjs(user.lastSignInAt).format("MMM D, YYYY [at] h:mm A")
    : "—";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="p-5 pb-25" keyboardShouldPersistTaps="handled">
        <Text className="list-title mb-6">Settings</Text>

        {/* Profile hero */}
        <View className="items-center mb-8">
          <Image source={avatarSource} className="size-24 rounded-full mb-3" />
          <Text className="text-2xl font-sans-bold text-primary">{displayName}</Text>
          <Text className="text-sm font-sans-medium text-muted-foreground mt-1">{email}</Text>
        </View>

        {/* Account */}
        <Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground mb-3">
          Account
        </Text>
        <View className="sub-card bg-card mb-8">
          <DetailRow label="Email" value={email} />
          <DetailRow label="Username" value={username} />
          <DetailRow label="Member since" value={memberSince} />
          <View className="sub-row py-3">
            <Text className="sub-label">Last sign in</Text>
            <Text className="sub-value text-right" numberOfLines={1}>
              {lastSignIn}
            </Text>
          </View>
        </View>

        {/* Budget */}
        <Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground mb-3">
          Budget
        </Text>
        <View className="sub-card bg-card mb-8">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
            <Text style={{ fontFamily: "sans-medium", fontSize: 16, color: "rgba(0,0,0,0.6)", flex: 1, marginRight: 12 }}>
              Monthly cap
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onBlur={handleBlur}
              placeholder="No limit"
              placeholderTextColor="rgba(0,0,0,0.3)"
              keyboardType="decimal-pad"
              style={{
                fontFamily: "sans-bold",
                fontSize: 15,
                color: "#081126",
                textAlign: "right",
                minWidth: 72,
                maxWidth: 120,
              }}
            />
          </View>
        </View>

        <Pressable className="sub-cancel" onPress={handleSignOut}>
          <Text className="sub-cancel-text">Sign out</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
