export type AppEnvironment = "teaser" | "production";

/** Defaults to teaser so the live waitlist site cannot touch app tables. */
export function appEnvironment(): AppEnvironment {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
    ? "production"
    : "teaser";
}

export function isTeaser(): boolean {
  return appEnvironment() === "teaser";
}

export function isProduction(): boolean {
  return appEnvironment() === "production";
}
