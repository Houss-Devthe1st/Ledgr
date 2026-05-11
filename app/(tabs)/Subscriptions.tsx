import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/lib/subscriptions";
import { computeNextRenewalDate, formatCurrency, toMonthly } from "@/lib/utils";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function StatsRow({ subscriptions }: { subscriptions: Subscription[] }) {
  const { activeCount, pausedCount, monthlyTotal } = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const paused = subscriptions.filter((s) => s.status === "paused");
    const monthly = active.reduce((sum, s) => sum + toMonthly(s), 0);
    return { activeCount: active.length, pausedCount: paused.length, monthlyTotal: monthly };
  }, [subscriptions]);

  return (
    <View className="flex-row gap-3 mb-5">
      <View className="flex-1 bg-muted rounded-2xl p-4">
        <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Active</Text>
        <Text className="text-2xl font-sans-bold text-primary">{activeCount}</Text>
        <Text className="text-xs text-muted-foreground">subscriptions</Text>
      </View>
      <View className="flex-1 bg-muted rounded-2xl p-4">
        <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Paused</Text>
        <Text className="text-2xl font-sans-bold text-amber-500">{pausedCount}</Text>
        <Text className="text-xs text-muted-foreground">subscriptions</Text>
      </View>
      <View className="flex-1 bg-muted rounded-2xl p-4">
        <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Monthly</Text>
        <Text className="text-xl font-sans-bold text-primary">{formatCurrency(monthlyTotal)}</Text>
        <Text className="text-xs text-muted-foreground">est. spend</Text>
      </View>
    </View>
  );
}

export default function Subscriptions() {
  const { subscriptions, isLoading, updateSubscription, deleteSubscription } = useSubscriptions();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ListHeader = useCallback(
    () => (
      <>
        <ListHeading title="My Subscriptions" />
        <StatsRow subscriptions={subscriptions} />
      </>
    ),
    [subscriptions]
  );

  if (isLoading) return null;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
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
          <Text className="home-empty-state">
            No subscriptions yet. Tap + on the home screen to add one.
          </Text>
        )}
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
