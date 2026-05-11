import {
  getMonthlyBudget,
  setMonthlyBudget as dbSet,
  clearMonthlyBudget as dbClear,
} from "@/lib/db/budgets";
import { createContext, useContext, useEffect, useState } from "react";

type BudgetContextValue = {
  monthlyBudget: number | null;
  isLoading: boolean;
  setMonthlyBudget: (amount: number) => Promise<void>;
  clearMonthlyBudget: () => Promise<void>;
};

const BudgetContext = createContext<BudgetContextValue>({
  monthlyBudget: null,
  isLoading: true,
  setMonthlyBudget: async () => {},
  clearMonthlyBudget: async () => {},
});

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMonthlyBudget()
      .then(setMonthlyBudgetState)
      .catch((e) => console.error("Failed to load budget:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const setMonthlyBudget = async (amount: number) => {
    const previous = monthlyBudget;
    setMonthlyBudgetState(amount);
    try {
      await dbSet(amount);
    } catch (e) {
      console.error("Failed to save budget:", e);
      setMonthlyBudgetState(previous);
    }
  };

  const clearMonthlyBudget = async () => {
    const previous = monthlyBudget;
    setMonthlyBudgetState(null);
    try {
      await dbClear();
    } catch (e) {
      console.error("Failed to clear budget:", e);
      setMonthlyBudgetState(previous);
    }
  };

  return (
    <BudgetContext.Provider value={{ monthlyBudget, isLoading, setMonthlyBudget, clearMonthlyBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
