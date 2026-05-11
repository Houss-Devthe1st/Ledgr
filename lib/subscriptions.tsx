import {
  getAllSubscriptions,
  insertSubscription,
  updateSubscription as dbUpdate,
  deleteSubscription as dbDelete,
} from "@/lib/db/subscriptions";
import { computeNextRenewalDate, generateId } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";

const CARD_COLORS = [
  "#FFE4E6", "#FEF3C7", "#D1FAE5", "#DBEAFE", "#EDE9FE",
  "#FCE7F3", "#FEF9C3", "#ECFDF5", "#EFF6FF", "#F5F3FF",
  "#FFF7ED", "#F0FDF4", "#F0F9FF", "#FDF4FF", "#FFFBEB",
];

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  isLoading: boolean;
  addSubscription: (s: Omit<Subscription, "id">) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Omit<Subscription, "id">>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue>({
  subscriptions: [],
  isLoading: true,
  addSubscription: async () => {},
  updateSubscription: async () => {},
  deleteSubscription: async () => {},
});

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllSubscriptions()
      .then(setSubscriptions)
      .catch((e) => console.error("Failed to load subscriptions:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const addSubscription = async (s: Omit<Subscription, "id">) => {
    const color = s.color ?? CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
    const renewalDate = s.renewalDate ?? computeNextRenewalDate(s.startDate, s.billing);
    const newSub: Subscription = { ...s, id: generateId(), color, renewalDate };

    setSubscriptions((prev) => [newSub, ...prev]);
    try {
      await insertSubscription(newSub);
    } catch (e) {
      // Rollback optimistic add
      setSubscriptions((prev) => prev.filter((s) => s.id !== newSub.id));
      throw e;
    }
  };

  const updateSubscription = async (
    id: string,
    updates: Partial<Omit<Subscription, "id">>
  ) => {
    const previous = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      await dbUpdate(id, updates);
    } catch (e) {
      // Rollback optimistic update
      if (previous) setSubscriptions((prev) => prev.map((s) => (s.id === id ? previous : s)));
      throw e;
    }
  };

  const deleteSubscription = async (id: string) => {
    const previous = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    try {
      await dbDelete(id);
    } catch (e) {
      // Rollback optimistic delete
      if (previous) setSubscriptions((prev) => [previous, ...prev]);
      throw e;
    }
  };

  return (
    <SubscriptionsContext.Provider
      value={{ subscriptions, isLoading, addSubscription, updateSubscription, deleteSubscription }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
}

export const useSubscriptions = () => useContext(SubscriptionsContext);
