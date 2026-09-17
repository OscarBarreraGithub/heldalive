import { useEffect, useState } from "react";
import { simulatedPhoneEquivalents } from "../shared/compute-estimate";

export function useSimulatedCompute() {
  const [value, setValue] = useState(() =>
    simulatedPhoneEquivalents(Date.now()),
  );
  useEffect(() => {
    // Two inexpensive updates per ten seconds, with no work in hidden tabs.
    const update = () => {
      if (!document.hidden) setValue(simulatedPhoneEquivalents(Date.now()));
    };
    const timer = setInterval(update, 5000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return value;
}
