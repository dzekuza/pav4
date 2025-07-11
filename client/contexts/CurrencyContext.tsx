import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number, originalCurrency?: string) => string;
  convertPrice: (
    price: number,
    fromCurrency: string,
    toCurrency?: Currency,
  ) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

// Exchange rates (in a real app, these would come from an API)
const EXCHANGE_RATES: { [key: string]: number } = {
  USD_TO_EUR: 0.92,
  EUR_TO_USD: 1.09,
  USD_TO_USD: 1,
  EUR_TO_EUR: 1,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");

  const convertPrice = (
    price: number,
    fromCurrency: string,
    toCurrency: Currency = currency,
  ): number => {
    if (price === 0) return 0;

    // Normalize currency codes
    const from =
      fromCurrency === "$"
        ? "USD"
        : fromCurrency === "€"
          ? "EUR"
          : fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return price;

    const rateKey = `${from}_TO_${to}`;
    const rate = EXCHANGE_RATES[rateKey];

    if (rate) {
      return Math.round(price * rate * 100) / 100; // Round to 2 decimal places
    }

    // Fallback: if we don't have the rate, return original price
    console.warn(`Exchange rate not found for ${from} to ${to}`);
    return price;
  };

  const formatPrice = (price: number, originalCurrency?: string): string => {
    const convertedPrice = originalCurrency
      ? convertPrice(price, originalCurrency)
      : price;
    const symbol = currency === "USD" ? "$" : "€";

    return `${symbol}${convertedPrice.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
