import { useBudget } from "@/lib/budget";
import { useSubscriptions } from "@/lib/subscriptions";
import { formatCurrency, formatSubscriptionDateTime, toMonthly } from "@/lib/utils";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

const SafeAreaView = styled(RNSafeAreaView);

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#ea7a53", "#8fd1bd", "#f59e0b", "#6366f1", "#ec4899",
  "#14b8a6", "#f97316", "#8b5cf6",
];

// ─── Metrics hook ────────────────────────────────────────────────────────────

function useInsightsMetrics(subscriptions: Subscription[]) {
  return useMemo(() => {
    const now = dayjs();
    const active = subscriptions.filter((s) => s.status === "active");
    const monthlyTotal = active.reduce((sum, s) => sum + toMonthly(s), 0);
    const activeCount = active.length;

    const statusCounts = {
      active: activeCount,
      paused: subscriptions.filter((s) => s.status === "paused").length,
      cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    };

    // Category bars
    const catMap = new Map<string, number>();
    for (const s of active) {
      const key = s.category?.trim() || "Uncategorized";
      catMap.set(key, (catMap.get(key) ?? 0) + toMonthly(s));
    }
    const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.slice(0, 5);
    const otherTotal = sortedCats.slice(5).reduce((sum, [, v]) => sum + v, 0);
    const categories: [string, number][] =
      otherTotal > 0 ? [...topCats, ["Other", otherTotal]] : topCats;

    // Top spenders
    const topSpenders = [...active]
      .map((s) => ({ ...s, monthly: toMonthly(s) }))
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 5);

    // Billing grid
    const billingBreakdown = (["Monthly", "Yearly", "Weekly", "Daily"] as const).map(
      (cycle) => {
        const group = active.filter((s) => s.billing === cycle);
        return {
          cycle,
          count: group.length,
          monthlyContribution: group.reduce((sum, s) => sum + toMonthly(s), 0),
        };
      }
    );

    // Upcoming 30 days
    const in30 = now.add(30, "day");
    const upcoming30 = active
      .filter(
        (s) =>
          s.renewalDate &&
          dayjs(s.renewalDate).isAfter(now) &&
          dayjs(s.renewalDate).isBefore(in30)
      )
      .sort((a, b) => dayjs(a.renewalDate).valueOf() - dayjs(b.renewalDate).valueOf());
    const upcoming30Total = upcoming30.reduce((sum, s) => sum + s.price, 0);

    // A — Subscription longevity (active subs with a start date, oldest first)
    const longevity = [...active]
      .filter((s) => s.startDate)
      .map((s) => {
        const totalMonths = now.diff(dayjs(s.startDate), "month");
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        const ageLabel =
          years > 0
            ? months > 0 ? `${years}y ${months}mo` : `${years}y`
            : totalMonths > 0 ? `${totalMonths}mo` : "< 1mo";
        return { ...s, totalMonths, ageLabel };
      })
      .sort((a, b) => b.totalMonths - a.totalMonths)
      .slice(0, 5);

    // B — Monthly heatmap (next 12 months from current month)
    const heatmapMonths = Array.from({ length: 12 }, (_, i) => {
      const m = now.startOf("month").add(i, "month");
      return { label: m.format("MMM"), month: m.month(), total: 0 };
    });
    for (const s of active) {
      if (s.billing === "Monthly") {
        heatmapMonths.forEach((m) => { m.total += s.price; });
      } else if (s.billing === "Yearly" && s.renewalDate) {
        const renewalMonth = dayjs(s.renewalDate).month();
        const idx = heatmapMonths.findIndex((m) => m.month === renewalMonth);
        if (idx !== -1) heatmapMonths[idx].total += s.price;
      } else if (s.billing === "Weekly") {
        heatmapMonths.forEach((m) => { m.total += (s.price * 52) / 12; });
      } else if (s.billing === "Daily") {
        heatmapMonths.forEach((m) => { m.total += s.price * 30; });
      }
    }

    // D — Paused savings
    const pausedSubs = subscriptions.filter((s) => s.status === "paused");
    const pausedSavings = pausedSubs.reduce((sum, s) => sum + toMonthly(s), 0);

    // E — Payment method breakdown (active subs only)
    const methodMap = new Map<string, number>();
    for (const s of active) {
      const key = s.paymentMethod?.trim() || "Unspecified";
      methodMap.set(key, (methodMap.get(key) ?? 0) + toMonthly(s));
    }
    const paymentMethods = [...methodMap.entries()].sort((a, b) => b[1] - a[1]);

    return {
      monthlyTotal,
      activeCount,
      statusCounts,
      categories,
      topSpenders,
      billingBreakdown,
      upcoming30,
      upcoming30Total,
      longevity,
      heatmapMonths,
      pausedSubs,
      pausedSavings,
      paymentMethods,
    };
  }, [subscriptions]);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5">
      <Text className="list-title mb-1">{title}</Text>
      {subtitle && (
        <Text className="text-xs font-sans-medium text-muted-foreground mb-3">{subtitle}</Text>
      )}
      <View className="bg-muted rounded-2xl p-4">{children}</View>
    </View>
  );
}

function KPIBar({
  monthlyTotal,
  activeCount,
}: {
  monthlyTotal: number;
  activeCount: number;
}) {
  const chips = [
    { label: "Avg / sub", value: formatCurrency(activeCount > 0 ? monthlyTotal / activeCount : 0) },
    { label: "Per day", value: formatCurrency(monthlyTotal / 30) },
    { label: "Yearly", value: formatCurrency(monthlyTotal * 12) },
  ];
  return (
    <View className="flex-row gap-3 mb-5">
      {chips.map(({ label, value }) => (
        <View key={label} className="flex-1 bg-muted rounded-2xl p-4">
          <Text className="text-xs font-sans-medium text-muted-foreground mb-1">{label}</Text>
          <Text
            className="text-base font-sans-bold text-primary"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StatusDonut({
  statusCounts,
}: {
  statusCounts: { active: number; paused: number; cancelled: number };
}) {
  const total = statusCounts.active + statusCounts.paused + statusCounts.cancelled;
  const r = 45;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { count: statusCounts.active, color: "#16a34a", label: "Active" },
    { count: statusCounts.paused, color: "#f59e0b", label: "Paused" },
    { count: statusCounts.cancelled, color: "#d1d5db", label: "Cancelled" },
  ];

  let offsetAngle = -90;

  return (
    <View className="items-center">
      <View style={{ width: 160, height: 160 }}>
        <Svg width={160} height={160}>
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {total === 0 ? null : segments.map(({ count, color }) => {
            const proportion = count / total;
            if (proportion === 0) return null;
            const dashLength = proportion * circumference;
            const rotation = offsetAngle;
            offsetAngle += proportion * 360;
            return (
              <G key={color} rotation={rotation} origin={`${cx},${cy}`}>
                <Circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeLinecap="butt"
                />
              </G>
            );
          })}
        </Svg>
        <View
          style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text className="text-3xl font-sans-bold text-primary">{total}</Text>
          <Text className="text-xs font-sans-medium text-muted-foreground">total</Text>
        </View>
      </View>

      <View className="flex-row gap-10 mt-4">
        {segments.map(({ count, color, label }) => (
          <View key={label} className="items-center gap-1">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
            <Text className="text-lg font-sans-bold text-primary">{count}</Text>
            <Text className="text-xs font-sans-medium text-muted-foreground">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CategoryBars({
  categories,
  monthlyTotal,
}: {
  categories: [string, number][];
  monthlyTotal: number;
}) {
  if (categories.length === 0) {
    return <Text className="text-sm font-sans-medium text-muted-foreground">No category data yet.</Text>;
  }
  return (
    <View className="gap-4">
      {categories.map(([label, amount], i) => {
        const pct = monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0;
        const color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          <View key={label}>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-sm font-sans-semibold text-primary">{label}</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground">
                {formatCurrency(amount)}/mo
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "#e5e7eb" }}>
              <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TopSpenders({
  topSpenders,
}: {
  topSpenders: (Subscription & { monthly: number })[];
}) {
  if (topSpenders.length === 0) {
    return <Text className="text-sm font-sans-medium text-muted-foreground">No subscriptions yet.</Text>;
  }
  const max = topSpenders[0].monthly;
  return (
    <View className="gap-4">
      {topSpenders.map((s, i) => {
        const pct = max > 0 ? (s.monthly / max) * 100 : 0;
        const barColor = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <View key={s.id}>
            <View className="flex-row items-center gap-3 mb-1.5">
              <Image source={s.icon} style={{ width: 28, height: 28, borderRadius: 6 }} />
              <Text className="flex-1 text-sm font-sans-semibold text-primary" numberOfLines={1}>
                {s.name}
              </Text>
              <Text className="text-sm font-sans-medium text-muted-foreground">
                {formatCurrency(s.monthly)}/mo
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: "#e5e7eb" }}>
              <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: barColor }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BillingGrid({
  billingBreakdown,
}: {
  billingBreakdown: { cycle: string; count: number; monthlyContribution: number }[];
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {billingBreakdown.map(({ cycle, count, monthlyContribution }) => (
        <View key={cycle} className="rounded-xl bg-background p-4" style={{ minWidth: "45%", flex: 1 }}>
          <Text className="text-xs font-sans-medium text-muted-foreground mb-1">{cycle}</Text>
          <Text className="text-xl font-sans-bold text-primary">{count}</Text>
          <Text className="text-xs text-muted-foreground">
            {formatCurrency(monthlyContribution)}/mo
          </Text>
        </View>
      ))}
    </View>
  );
}

function UpcomingSpend({
  upcoming30,
  upcoming30Total,
}: {
  upcoming30: Subscription[];
  upcoming30Total: number;
}) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between rounded-xl bg-accent/10 px-4 py-3">
        <Text className="text-sm font-sans-semibold text-accent">Total due in 30 days</Text>
        <Text className="text-base font-sans-bold text-accent">{formatCurrency(upcoming30Total)}</Text>
      </View>
      {upcoming30.length === 0 ? (
        <Text className="text-sm font-sans-medium text-muted-foreground">
          No renewals in the next 30 days.
        </Text>
      ) : (
        upcoming30.map((s) => (
          <View key={s.id} className="flex-row items-center gap-3">
            <Image source={s.icon} style={{ width: 32, height: 32, borderRadius: 8 }} />
            <View className="flex-1">
              <Text className="text-sm font-sans-semibold text-primary" numberOfLines={1}>
                {s.name}
              </Text>
              <Text className="text-xs font-sans-medium text-muted-foreground">
                {formatSubscriptionDateTime(s.renewalDate)}
              </Text>
            </View>
            <Text className="text-sm font-sans-bold text-primary">
              {formatCurrency(s.price, s.currency)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// A — Subscription longevity

type LongevityItem = Subscription & { totalMonths: number; ageLabel: string };

function LongevityList({ longevity }: { longevity: LongevityItem[] }) {
  if (longevity.length === 0) {
    return (
      <Text className="text-sm font-sans-medium text-muted-foreground">
        Add start dates to your subscriptions to see longevity.
      </Text>
    );
  }
  return (
    <View className="gap-3">
      {longevity.map((s, i) => (
        <View key={s.id} className="flex-row items-center gap-3">
          <Text style={{ width: 20, fontFamily: "sans-bold", fontSize: 13, color: "#9ca3af" }}>
            {i + 1}
          </Text>
          <Image source={s.icon} style={{ width: 32, height: 32, borderRadius: 8 }} />
          <Text className="flex-1 text-sm font-sans-semibold text-primary" numberOfLines={1}>
            {s.name}
          </Text>
          <View style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: "sans-bold", fontSize: 12, color: "#081126" }}>
              {s.ageLabel}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// B — Monthly spend heatmap

function MonthlyHeatmap({ months }: { months: { label: string; total: number }[] }) {
  const max = Math.max(...months.map((m) => m.total), 1);
  return (
    <View className="gap-2">
      {[0, 1, 2].map((row) => (
        <View key={row} className="flex-row gap-2">
          {months.slice(row * 4, row * 4 + 4).map(({ label, total }) => {
            const intensity = total / max;
            const bgColor = `rgba(8, 17, 38, ${0.06 + intensity * 0.88})`;
            const textColor = intensity > 0.5 ? "#ffffff" : "#081126";
            const subColor = intensity > 0.5 ? "rgba(255,255,255,0.65)" : "rgba(8,17,38,0.45)";
            return (
              <View
                key={label}
                style={{
                  flex: 1,
                  backgroundColor: bgColor,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: "sans-medium", fontSize: 11, color: subColor }}>
                  {label}
                </Text>
                <Text style={{ fontFamily: "sans-bold", fontSize: 12, color: textColor, marginTop: 3 }}>
                  {formatCurrency(total)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// D — Paused savings

function PausedSavings({
  pausedSubs,
  pausedSavings,
}: {
  pausedSubs: Subscription[];
  pausedSavings: number;
}) {
  return (
    <View className="gap-3">
      <View
        className="flex-row items-center justify-between rounded-xl px-4 py-3"
        style={{ backgroundColor: "#f0fdf4" }}
      >
        <Text style={{ fontFamily: "sans-semibold", fontSize: 14, color: "#15803d" }}>
          Saving per month
        </Text>
        <Text style={{ fontFamily: "sans-bold", fontSize: 16, color: "#15803d" }}>
          {formatCurrency(pausedSavings)}
        </Text>
      </View>
      {pausedSubs.map((s) => (
        <View key={s.id} className="flex-row items-center gap-3">
          <Image source={s.icon} style={{ width: 32, height: 32, borderRadius: 8 }} />
          <Text className="flex-1 text-sm font-sans-semibold text-primary" numberOfLines={1}>
            {s.name}
          </Text>
          <Text className="text-sm font-sans-medium text-muted-foreground">
            {formatCurrency(toMonthly(s))}/mo
          </Text>
        </View>
      ))}
    </View>
  );
}

// E — Payment method breakdown

function PaymentMethodGrid({ paymentMethods }: { paymentMethods: [string, number][] }) {
  if (paymentMethods.length === 0) {
    return (
      <Text className="text-sm font-sans-medium text-muted-foreground">
        No payment method data. Add payment methods to your subscriptions.
      </Text>
    );
  }
  return (
    <View className="flex-row flex-wrap gap-3">
      {paymentMethods.map(([method, amount]) => (
        <View
          key={method}
          className="rounded-xl bg-background p-4"
          style={{ minWidth: "45%", flex: 1 }}
        >
          <Text className="text-xs font-sans-medium text-muted-foreground mb-1">{method}</Text>
          <Text className="text-xl font-sans-bold text-primary">{formatCurrency(amount)}</Text>
          <Text className="text-xs text-muted-foreground">per month</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function Insights() {
  const { subscriptions, isLoading } = useSubscriptions();
  const { monthlyBudget } = useBudget();
  const metrics = useInsightsMetrics(subscriptions);

  if (isLoading) return null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="p-5 pb-36"
        showsVerticalScrollIndicator={false}
      >
        <Text className="list-title mb-5">Insights</Text>

        {subscriptions.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-sm font-sans-medium text-muted-foreground text-center">
              Add your first subscription to see insights.
            </Text>
          </View>
        ) : (
          <>
            <KPIBar
              monthlyTotal={metrics.monthlyTotal}
              activeCount={metrics.activeCount}
            />

            {monthlyBudget !== null && (() => {
              const pct = (metrics.monthlyTotal / monthlyBudget) * 100;
              const fillColor = pct >= 100 ? "#dc2626" : pct >= 75 ? "#f59e0b" : "#16a34a";
              const overBy = metrics.monthlyTotal - monthlyBudget;
              return (
                <SectionCard
                  title="Monthly Budget"
                  subtitle={`${formatCurrency(metrics.monthlyTotal)} of ${formatCurrency(monthlyBudget)}`}
                >
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: "#e5e7eb" }}>
                    <View style={{ height: 12, borderRadius: 6, width: `${Math.min(pct, 100)}%`, backgroundColor: fillColor }} />
                  </View>
                  {overBy > 0 ? (
                    <Text className="text-xs font-sans-semibold text-destructive mt-2">
                      Over budget by {formatCurrency(overBy)}
                    </Text>
                  ) : (
                    <Text className="text-xs font-sans-medium text-muted-foreground mt-2">
                      {formatCurrency(monthlyBudget - metrics.monthlyTotal)} remaining
                    </Text>
                  )}
                </SectionCard>
              );
            })()}

            <SectionCard title="Portfolio" subtitle="Active · Paused · Cancelled">
              <StatusDonut statusCounts={metrics.statusCounts} />
            </SectionCard>

            {metrics.pausedSubs.length > 0 && (
              <SectionCard title="Paused Savings" subtitle="What you're saving by pausing these">
                <PausedSavings
                  pausedSubs={metrics.pausedSubs}
                  pausedSavings={metrics.pausedSavings}
                />
              </SectionCard>
            )}

            <SectionCard title="Spend Calendar" subtitle="Estimated spend over the next 12 months">
              <MonthlyHeatmap months={metrics.heatmapMonths} />
            </SectionCard>

            <SectionCard title="Spend by Category" subtitle="Monthly equivalent, active only">
              <CategoryBars
                categories={metrics.categories}
                monthlyTotal={metrics.monthlyTotal}
              />
            </SectionCard>

            <SectionCard title="Payment Methods" subtitle="Monthly spend per payment method">
              <PaymentMethodGrid paymentMethods={metrics.paymentMethods} />
            </SectionCard>

            <SectionCard title="Top Spenders" subtitle="Highest monthly cost">
              <TopSpenders topSpenders={metrics.topSpenders} />
            </SectionCard>

            <SectionCard title="Subscription Longevity" subtitle="Your longest-held active subscriptions">
              <LongevityList longevity={metrics.longevity} />
            </SectionCard>

            <SectionCard title="Billing Cycles" subtitle="How subscriptions are billed">
              <BillingGrid billingBreakdown={metrics.billingBreakdown} />
            </SectionCard>

            <SectionCard title="Upcoming 30 Days" subtitle="Scheduled renewals">
              <UpcomingSpend
                upcoming30={metrics.upcoming30}
                upcoming30Total={metrics.upcoming30Total}
              />
            </SectionCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
