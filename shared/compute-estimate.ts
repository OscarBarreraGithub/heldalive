// An authored Qwen scenario, never an input to live telemetry or scheduling.
export const PHONE_SCENARIO = {
  model: "Qwen3.5 9B",
  serverFraction: 0.1,
  phoneDuty: 0.05,
  phoneRelativeSpeed: 0.02,
} as const;

export const PHONE_EQUIVALENTS =
  PHONE_SCENARIO.serverFraction /
  (PHONE_SCENARIO.phoneDuty * PHONE_SCENARIO.phoneRelativeSpeed);

// A shared, slowly changing visual rhythm. This is not measured activity,
// user arrivals/departures, or a statistical confidence interval.
export function simulatedPhoneEquivalents(now: number) {
  const seconds = now / 1000;
  const variation =
    0.08 * Math.sin(seconds / 77) +
    0.04 * Math.sin(seconds / 191) +
    0.02 * Math.sin(seconds / 37);
  return Math.round(PHONE_EQUIVALENTS * (1 + variation));
}
