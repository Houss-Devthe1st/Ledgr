import { useClerk, useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";

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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/SignIn");
  };

  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "—";
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const username = user?.username ?? "—";
  const memberSince = user?.createdAt ? dayjs(user.createdAt).format("MMM D, YYYY") : "—";
  const lastSignIn = user?.lastSignInAt ? dayjs(user.lastSignInAt).format("MMM D, YYYY [at] h:mm A") : "—";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-5 pb-12">
        <Text className="list-title mb-6">Settings</Text>

        {/* Profile hero */}
        <View className="items-center mb-8">
          <Image source={avatarSource} className="size-24 rounded-full mb-3" />
          <Text className="text-2xl font-sans-bold text-primary">{displayName}</Text>
          <Text className="text-sm font-sans-medium text-muted-foreground mt-1">{email}</Text>
        </View>

        {/* Account details card */}
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

        <Pressable className="sub-cancel" onPress={handleSignOut}>
          <Text className="sub-cancel-text">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
