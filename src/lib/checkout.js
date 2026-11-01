export const PRICE_LABEL = import.meta.env.VITE_GITSUM_PRICE_LABEL || "$5";
const INTENT_KEY = "gitsum:intent";

export function rememberCheckoutIntent() {
  try {
    sessionStorage.setItem(INTENT_KEY, "checkout");
  } catch {
    /* storage blocked */
  }
}

export function takeCheckoutIntent() {
  try {
    const v = sessionStorage.getItem(INTENT_KEY);
    sessionStorage.removeItem(INTENT_KEY);
    return v === "checkout";
  } catch {
    return false;
  }
}

