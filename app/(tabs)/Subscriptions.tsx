import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useBudget } from "@/lib/budget";
import { useSubscriptions } from "@/lib/subscriptions";
import { computeNextRenewalDate, formatCurrency, toMonthly } from "@/lib/utils";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type FilterStatus = "all" | "active" | "paused" | "cancelled";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Cancelled", value: "cancelled" },
];

function StatsRow({ subscriptions }: { subscriptions: Subscription[] }) {
  const { monthlyBudget } = useBudget();

  const { activeCount, monthlyTotal } = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const monthly = active.reduce((sum, s) => sum + toMonthly(s), 0);
    return { activeCount: active.length, monthlyTotal: monthly };
  }, [subscriptions]);

  const budgetPct = monthlyBudget !== null
    ? Math.min((monthlyTotal / monthlyBudget) * 100, 100)
    : 0;
  const budgetColor = budgetPct >= 100 ? "#dc2626" : budgetPct >= 75 ? "#f59e0b" : "#16a34a";

  return (
    <View className="flex-row gap-3 mb-5">
      <View className="flex-1 bg-muted rounded-2xl p-4">
        <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Active</Text>
        <Text className="text-2xl font-sans-bold text-primary">{activeCount}</Text>
        <Text className="text-xs text-muted-foreground">subscriptions</Text>
      </View>

      {monthlyBudget !== null && (
        <View className="flex-1 bg-muted rounded-2xl p-4">
          <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Budget</Text>
          <Text className="text-xl font-sans-bold text-primary" numberOfLines={1}>
            {formatCurrency(monthlyTotal)}
          </Text>
          <Text className="text-xs text-muted-foreground mb-2">
            of {formatCurrency(monthlyBudget)}
          </Text>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: "#e5e7eb" }}>
            <View style={{ height: 4, borderRadius: 2, width: `${budgetPct}%`, backgroundColor: budgetColor }} />
          </View>
        </View>
      )}

      <View className="flex-1 bg-muted rounded-2xl p-4">
        <Text className="text-xs font-sans-medium text-muted-foreground mb-1">Monthly</Text>
        <Text className="text-xl font-sans-bold text-primary">{formatCurrency(monthlyTotal)}</Text>
        <Text className="text-xs text-muted-foreground">est. spend</Text>
      </View>
    </View>
  );
}

function FilterBar({
  selected,
  onChange,
}: {
  selected: FilterStatus;
  onChange: (v: FilterStatus) => void;
}) {
  return (
    <View className="flex-row gap-2 mb-4">
      {FILTERS.map(({ label, value }) => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: selected === value ? "#081126" : "#f3f4f6",
          }}
        >
          <Text
            style={{
              fontFamily: "sans-semibold",
              fontSize: 13,
              color: selected === value ? "#ffffff" : "#6b7280",
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Subscriptions() {
  const { subscriptions, isLoading, updateSubscription, deleteSubscription } = useSubscriptions();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filtered = useMemo(
    () =>
      filterStatus === "all"
        ? subscriptions
        : subscriptions.filter((s) => s.status === filterStatus),
    [subscriptions, filterStatus]
  );

  if (isLoading) return null;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ListHeading title="My Subscriptions" />
      <StatsRow subscriptions={subscriptions} />
      <FilterBar selected={filterStatus} onChange={setFilterStatus} />
      <FlatList
        data={filtered}
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
          <Text className="home-empty-state">
            {filterStatus === "all"
              ? "No subscriptions yet. Tap + on the home screen to add one."
              : `No ${filterStatus} subscriptions.`}
          </Text>
        )}
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
