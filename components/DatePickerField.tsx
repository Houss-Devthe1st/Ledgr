import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

interface Props {
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  error?: string;
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Select a date",
  minimumDate,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  const formatted = value ? dayjs(value).format("MM/DD/YYYY") : "";

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setOpen(false);
      if (selected && event.type !== "dismissed") onChange(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => { setTempDate(value ?? new Date()); setOpen(true); }}
        className={clsx(
          "auth-input flex-row items-center justify-between",
          error && "auth-input-error"
        )}
      >
        <Text className={clsx(
          "text-base font-sans-medium",
          formatted ? "text-primary" : "text-muted-foreground"
        )}>
          {formatted || placeholder}
        </Text>
        <Text className="text-sm text-muted-foreground">▾</Text>
      </Pressable>

      {error ? <Text className="auth-error">{error}</Text> : null}

      {/* Android — renders as native dialog */}
      {Platform.OS === "android" && open && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS — bottom-sheet modal with spinner wheel */}
      {Platform.OS === "ios" && (
        <Modal visible={open} transparent animationType="slide">
          <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
          <View className="bg-background rounded-t-3xl">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text className="text-base font-sans-semibold text-muted-foreground">Cancel</Text>
              </Pressable>
              <Text className="text-base font-sans-bold text-primary">Select Date</Text>
              <Pressable onPress={() => { onChange(tempDate); setOpen(false); }} hitSlop={8}>
                <Text className="text-base font-sans-bold text-accent">Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              style={{ height: 216 }}
              textColor="#081126"
            />
          </View>
        </Modal>
      )}
    </>
  );
}
