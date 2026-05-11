import { formatCurrency } from "@/lib/utils";
import { clsx } from "clsx";
import { Image, Text, View } from "react-native";

const UpcomingSubscriptionCard = ({ name, price, daysLeft, icon, currency }: UpcomingSubscription) => {
  const isOverdue = daysLeft < 0;

  const label =
    daysLeft === 0   ? "Due today"
    : daysLeft === 1  ? "1 day left"
    : daysLeft > 1    ? `${daysLeft} days left`
    : daysLeft === -1 ? "1 day overdue"
    : `${Math.abs(daysLeft)} days overdue`;

  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <Image source={icon} className="upcoming-icon" />
        {/* flex-1 constrains the text block so it can't grow past the card width */}
        <View className="flex-1">
          <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
          <Text className={clsx("upcoming-meta", isOverdue && "text-red-500")}>
            {label}
          </Text>
        </View>
      </View>
      <Text className="upcoming-name">{name}</Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
