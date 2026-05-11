import DatePickerField from "@/components/DatePickerField";
import { icons } from "@/constants/icons";
import { useSubscriptions } from "@/lib/subscriptions";
import { clsx } from "clsx";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

// ─── Constants ────────────────────────────────────────────────────────────────

const BILLING_OPTIONS = ["Monthly", "Yearly", "Weekly", "Daily"];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

const CATEGORIES = [
  "AI Tools", "Cloud Storage", "Communication", "Design", "Developer Tools",
  "Entertainment", "Finance", "Fitness & Health", "Gaming", "Productivity",
  "Streaming", "Telecom & Internet", "Other",
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Cancelled", value: "cancelled" },
];

const APP_ICON = require("@/assets/images/icon.png");

const SERVICE_ICONS = [
  { key: "app",      icon: APP_ICON },       // default — app icon
  { key: "spotify",  icon: icons.spotify },
  { key: "notion",   icon: icons.notion },
  { key: "figma",    icon: icons.figma },
  { key: "adobe",    icon: icons.adobe },
  { key: "github",   icon: icons.github },
  { key: "claude",   icon: icons.claude },
  { key: "canva",    icon: icons.canva },
  { key: "openai",   icon: icons.openai },
  { key: "dropbox",  icon: icons.dropbox },
  { key: "medium",   icon: icons.medium },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mt-6 mb-3 text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
      {label}
    </Text>
  );
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="auth-field">
      <Text className="auth-label">
        {label}
        {optional && <Text className="auth-helper"> (optional)</Text>}
      </Text>
      {children}
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateSubscription() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { subscriptions, addSubscription, updateSubscription } = useSubscriptions();

  const existing = id ? subscriptions.find((s) => s.id === id) : undefined;

  // Resolve icon key from existing subscription
  const existingIconKey = (() => {
    if (!existing?.icon) return "app";
    const match = SERVICE_ICONS.find((s) => s.icon === existing.icon);
    return match ? match.key : "custom";
  })();

  const existingCustomUri =
    existingIconKey === "custom" &&
    existing?.icon &&
    typeof existing.icon === "object" &&
    "uri" in (existing.icon as object)
      ? (existing.icon as { uri: string }).uri
      : null;

  const [selectedIconKey, setSelectedIconKey] = useState<string>(existingIconKey ?? "app");
  const [customIconUri, setCustomIconUri] = useState<string | null>(existingCustomUri);
  const [name, setName] = useState(existing?.name ?? "");
  const [price, setPrice] = useState(existing?.price?.toString() ?? "");
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [billing, setBilling] = useState(existing?.billing ?? "Monthly");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [status, setStatus] = useState(existing?.status ?? "active");
  const [plan, setPlan] = useState(existing?.plan ?? "");
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    existing?.startDate ? new Date(existing.startDate) : undefined
  );
  const [renewalDate, setRenewalDate] = useState<Date | undefined>(
    existing?.renewalDate ? new Date(existing.renewalDate) : undefined
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: "" }));

  const pickCustomIcon = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomIconUri(result.assets[0].uri);
      setSelectedIconKey("custom");
    }
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!price.trim()) errs.price = "Price is required";
    else if (isNaN(Number(price)) || Number(price) < 0)
      errs.price = "Enter a valid price";
    if (startDate && renewalDate && renewalDate <= startDate)
      errs.renewalDate = "Renewal date must be after the start date";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const iconSource =
      selectedIconKey === "custom" && customIconUri
        ? { uri: customIconUri }
        : SERVICE_ICONS.find((s) => s.key === selectedIconKey)?.icon ?? APP_ICON;

    const data: Omit<Subscription, "id"> = {
      icon: iconSource,
      name: name.trim(),
      price: Number(price),
      currency,
      billing,
      category: category || undefined,
      plan: plan.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      status,
      startDate: startDate?.toISOString(),
      renewalDate: renewalDate?.toISOString(),
    };

    try {
      if (existing) {
        await updateSubscription(existing.id, data);
      } else {
        await addSubscription(data);
      }
      router.back();
    } catch (e) {
      console.error("Failed to save subscription:", e);
      setErrors({ submit: "Failed to save. Please try again." });
    }
  };

  const isEditing = !!existing;

  return (
    <SafeAreaView className="flex-1 bg-background">

      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={8} className="size-10 items-center justify-center">
          <Image source={icons.back} className="size-6" />
        </Pressable>
        <Text className="text-lg font-sans-bold text-primary">
          {isEditing ? "Edit Subscription" : "New Subscription"}
        </Text>
        <Pressable onPress={handleSubmit} hitSlop={8} className="px-1">
          <Text className="text-base font-sans-bold text-accent">
            {isEditing ? "Update" : "Save"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Service icon picker ── */}
          <SectionLabel label="Service Icon" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {SERVICE_ICONS.map(({ key, icon }) => (
              <Pressable
                key={key}
                onPress={() => setSelectedIconKey(key)}
                className={clsx(
                  "mx-1 size-[72px] items-center justify-center rounded-2xl border-2",
                  selectedIconKey === key ? "border-accent bg-accent/10" : "border-transparent bg-muted"
                )}
              >
                <Image source={icon} className="size-12 rounded-xl" />
              </Pressable>
            ))}

            {/* Custom icon slot */}
            <Pressable
              onPress={pickCustomIcon}
              className={clsx(
                "mx-1 size-[72px] items-center justify-center rounded-2xl border-2",
                selectedIconKey === "custom" ? "border-accent bg-accent/10" : "border-dashed border-border bg-muted"
              )}
            >
              {customIconUri ? (
                <Image source={{ uri: customIconUri }} className="size-12 rounded-xl" />
              ) : (
                <Text className="text-2xl text-muted-foreground">+</Text>
              )}
            </Pressable>
          </ScrollView>

          {/* ── Basic info ── */}
          <SectionLabel label="Basic Info" />
          <View className="auth-card">
            <View className="auth-form">

              <Field label="Service name" error={errors.name}>
                <TextInput
                  className={clsx("auth-input", errors.name && "auth-input-error")}
                  value={name}
                  onChangeText={(v) => { setName(v); clearError("name"); }}
                  placeholder="e.g. Spotify"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </Field>

              <Field label="Price" error={errors.price}>
                <TextInput
                  className={clsx("auth-input", errors.price && "auth-input-error")}
                  value={price}
                  onChangeText={(v) => { setPrice(v); clearError("price"); }}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  keyboardType="decimal-pad"
                />
              </Field>

              <Field label="Currency">
                <View className="flex-row flex-wrap gap-2">
                  {CURRENCY_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCurrency(c)}
                      className={clsx(
                        "category-chip",
                        currency === c && "category-chip-active"
                      )}
                    >
                      <Text className={clsx(
                        "category-chip-text",
                        currency === c && "category-chip-text-active"
                      )}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Billing cycle">
                <View className="picker-row">
                  {BILLING_OPTIONS.map((b) => (
                    <Pressable
                      key={b}
                      onPress={() => setBilling(b)}
                      className={clsx("picker-option", billing === b && "picker-option-active")}
                    >
                      <Text className={clsx("picker-option-text", billing === b && "picker-option-text-active")}>
                        {b}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

            </View>
          </View>

          {/* ── Details ── */}
          <SectionLabel label="Details" />
          <View className="auth-card">
            <View className="auth-form">

              <Field label="Category" optional>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(category === cat ? "" : cat)}
                      className={clsx("category-chip", category === cat && "category-chip-active")}
                    >
                      <Text className={clsx("category-chip-text", category === cat && "category-chip-text-active")}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Status">
                <View className="picker-row">
                  {STATUS_OPTIONS.map(({ label, value }) => (
                    <Pressable
                      key={value}
                      onPress={() => setStatus(value)}
                      className={clsx("picker-option", status === value && "picker-option-active")}
                    >
                      <Text className={clsx("picker-option-text", status === value && "picker-option-text-active")}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Plan" optional>
                <TextInput
                  className="auth-input"
                  value={plan}
                  onChangeText={setPlan}
                  placeholder="e.g. Pro Plan"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Field>

              <Field label="Payment method" optional>
                <TextInput
                  className="auth-input"
                  value={paymentMethod}
                  onChangeText={setPaymentMethod}
                  placeholder="e.g. Visa ending in 1234"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  autoCapitalize="words"
                  autoComplete="off"
                  returnKeyType="next"
                />
              </Field>

            </View>
          </View>

          {/* ── Dates ── */}
          <SectionLabel label="Dates" />
          <View className="auth-card">
            <View className="auth-form">

              <Field label="Start date" optional>
                <DatePickerField
                  value={startDate}
                  onChange={(date) => { setStartDate(date); clearError("startDate"); }}
                  placeholder="Select start date"
                />
              </Field>

              <Field label="Renewal date" optional>
                <DatePickerField
                  value={renewalDate}
                  onChange={(date) => { setRenewalDate(date); clearError("renewalDate"); }}
                  placeholder="Select renewal date"
                  minimumDate={startDate}
                  error={errors.renewalDate}
                />
              </Field>

            </View>
          </View>

          {/* ── Submit ── */}
          {errors.submit ? (
            <Text className="auth-error text-center mt-4">{errors.submit}</Text>
          ) : null}
          <Pressable className="auth-button mt-4" onPress={handleSubmit}>
            <Text className="auth-button-text">
              {isEditing ? "Save Changes" : "Add Subscription"}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
