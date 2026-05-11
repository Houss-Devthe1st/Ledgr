import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from "@/lib/utils";
import { clsx } from "clsx";
import { Alert, Image, Pressable, Text, View } from "react-native";

const SubscriptionCard = ({
  name, price, currency, icon, billing, color, category, plan,
  renewalDate, expanded, onPress, paymentMethod, startDate, status,
  onEditPress, onToggleStatus, onMarkPaid, onDeletePress,
}: SubscriptionCardProps) => {

  const confirmDelete = () =>
    Alert.alert(
      "Delete Subscription",
      `Remove "${name}" from your subscriptions? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDeletePress },
      ]
    );

  return (
    <Pressable
      onPress={onPress}
      className={clsx("sub-card mb-2", expanded ? "sub-card-expanded" : "bg-card")}
      style={!expanded && color ? { backgroundColor: color } : undefined}
    >
      {/* ── Collapsed head ── */}
      <View className="sub-head">
        <View className="sub-main">
          <Image source={icon} className="sub-icon" />
          <View className="sub-copy">
            <Text numberOfLines={1} className="sub-title">{name}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
              {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : "")}
            </Text>
          </View>
        </View>
        <View className="sub-price-box">
          <Text className="sub-price">{formatCurrency(price, currency)}</Text>
          <Text className="sub-billing">{billing}</Text>
        </View>
      </View>

      {/* ── Expanded body ── */}
      {expanded && (
        <View className="sub-bdy">
          <View className="sub-details">
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Payment:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {paymentMethod?.trim() ?? "Not provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Category:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {(category?.trim() || plan?.trim()) ?? "Not provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Started:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {startDate ? formatSubscriptionDateTime(startDate) : "Not provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Renewal date:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {renewalDate ? formatSubscriptionDateTime(renewalDate) : "Not provided"}
                </Text>
              </View>
            </View>
            <View className="sub-row">
              <View className="sub-row-copy">
                <Text className="sub-label">Status:</Text>
                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                  {status ? formatStatusLabel(status) : "Not provided"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Edit + Toggle row ── */}
          {(onEditPress || onToggleStatus) && (
            <View className="flex-row gap-2 pt-3 mt-3 border-t border-black/10">
              {onEditPress && (
                <Pressable
                  onPress={onEditPress}
                  hitSlop={4}
                  className="flex-1 py-2.5 rounded-xl bg-black/10 items-center justify-center"
                >
                  <Text className="text-sm font-sans-semibold text-primary">Edit</Text>
                </Pressable>
              )}
              {onToggleStatus && status !== "cancelled" && (
                <Pressable
                  onPress={onToggleStatus}
                  hitSlop={4}
                  className={clsx(
                    "flex-1 py-2.5 rounded-xl items-center justify-center",
                    status === "active" ? "bg-amber-500/20" : "bg-green-500/20"
                  )}
                >
                  <Text className={clsx(
                    "text-sm font-sans-semibold",
                    status === "active" ? "text-amber-700" : "text-green-700"
                  )}>
                    {status === "active" ? "Pause" : "Resume"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Mark as Paid ── */}
          {onMarkPaid && status === "active" && (
            <Pressable
              onPress={onMarkPaid}
              hitSlop={4}
              className="mt-2 py-2.5 rounded-xl bg-blue-500/15 items-center justify-center"
            >
              <Text className="text-sm font-sans-semibold text-blue-600">
                Mark as Paid — advances renewal date
              </Text>
            </Pressable>
          )}

          {/* ── Delete (destructive, always last) ── */}
          {onDeletePress && (
            <Pressable
              onPress={confirmDelete}
              hitSlop={4}
              className="mt-2 py-2.5 rounded-xl bg-red-500/10 items-center justify-center"
            >
              <Text className="text-sm font-sans-semibold text-red-600">
                Delete Subscription
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
};

export default SubscriptionCard;
