import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { useUser } from "@clerk/expo";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import "@/global.css";
import { computeNextRenewalDate, formatCurrency, toMonthly } from "@/lib/utils";
import { useSubscriptions } from "@/lib/subscriptions";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const { user } = useUser();
  const router = useRouter();
  const { subscriptions, isLoading, updateSubscription, deleteSubscription } = useSubscriptions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayName = user?.firstName ?? user?.fullName ?? user?.username ?? "Hello";
  const avatarSource = useMemo(
    () => (user?.imageUrl ? { uri: user.imageUrl } : images.avatar),
    [user?.imageUrl]
  );

  const monthlySpend = useMemo(
    () =>
      subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + toMonthly(s), 0),
    [subscriptions]
  );

  // Subscriptions renewing within the next 10 days (inclusive of today)
  const upcomingSubscriptions = useMemo((): UpcomingSubscription[] => {
    const now = dayjs();
    return subscriptions
      .filter((s) => s.renewalDate && s.status === "active")
      .map((s) => ({
        id: s.id,
        icon: s.icon,
        name: s.name,
        price: s.price,
        currency: s.currency,
        daysLeft: dayjs(s.renewalDate).diff(now, "day"),
      }))
      .filter((s) => s.daysLeft >= 0 && s.daysLeft <= 10)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  // Active subscriptions whose renewal date has already passed
  const overdueSubscriptions = useMemo((): UpcomingSubscription[] => {
    const now = dayjs();
    return subscriptions
      .filter((s) => s.renewalDate && s.status === "active")
      .map((s) => ({
        id: s.id,
        icon: s.icon,
        name: s.name,
        price: s.price,
        currency: s.currency,
        daysLeft: dayjs(s.renewalDate).diff(now, "day"),
      }))
      .filter((s) => s.daysLeft < 0)
      .sort((a, b) => b.daysLeft - a.daysLeft); // most recently overdue first
  }, [subscriptions]);

  const nextRenewalDate = useMemo(() => {
    const now = dayjs();
    const sorted = subscriptions
      .filter((s) => s.renewalDate && s.status !== "cancelled")
      .map((s) => dayjs(s.renewalDate))
      .filter((d) => d.isAfter(now))
      .sort((a, b) => a.valueOf() - b.valueOf());
    return sorted[0] ?? null;
  }, [subscriptions]);

  const ListHeader = useCallback(
    () => (
      <>
        <View className="home-header">
          <View className="home-user">
            <Image source={avatarSource} className="home-avatar" />
            <Text className="home-user-name">{displayName}</Text>
          </View>
          <Pressable onPress={() => router.push("/subscriptions/create")} hitSlop={8}>
            <Image source={icons.add} className="home-add-icon" />
          </Pressable>
        </View>

        <View className="home-balance-card">
          <Text className="home-balance-label">Monthly Spend</Text>
          <View className="home-balance-row">
            <Text className="home-balance-amount">{formatCurrency(monthlySpend)}</Text>
            {nextRenewalDate && (
              <View className="items-end">
                <Text className="home-balance-date">{nextRenewalDate.format("MMM DD")}</Text>
                <Text className="text-xs text-muted-foreground">next renewal</Text>
              </View>
            )}
          </View>
        </View>

        {overdueSubscriptions.length > 0 && (
          <View className="mb-5">
            <ListHeading title="Overdue" />
            <FlatList
              data={overdueSubscriptions}
              renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <View className="mb-5">
          <ListHeading title="Upcoming" />
          <FlatList
            data={upcomingSubscriptions}
            renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={() => (
              <Text className="home-empty-state">No renewals in the next 10 days</Text>
            )}
          />
        </View>

        <ListHeading
          title="All Subscriptions"
          onViewAll={() => router.navigate("/(tabs)/Subscriptions")}
        />
      </>
    ),
    [displayName, avatarSource, router, monthlySpend, nextRenewalDate,
     upcomingSubscriptions, overdueSubscriptions]
  );

  if (isLoading) return null;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={subscriptions}
        ListHeaderComponent={ListHeader}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() => setExpandedId((curr) => (curr === item.id ? null : item.id))}
            onEditPress={() =>
              router.push({ pathname: "/subscriptions/create", params: { id: item.id } })
            }
            onToggleStatus={() =>
              updateSubscription(item.id, {
                status: item.status === "active" ? "paused" : "active",
              })
            }
            onMarkPaid={() =>
              updateSubscription(item.id, {
                renewalDate: computeNextRenewalDate(item.renewalDate, item.billing),
              })
            }
            onDeletePress={() => deleteSubscription(item.id)}
          />
        )}
        ListEmptyComponent={() => (
          <Text className="home-empty-state">No subscriptions yet. Tap + to add one.</Text>
        )}
        contentContainerClassName="pb-20"
      />
    </SafeAreaView>
  );
}
