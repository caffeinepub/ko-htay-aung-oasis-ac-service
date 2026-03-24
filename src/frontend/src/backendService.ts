import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

export type AppBackend = backendInterface;

// Do not cache the actor to avoid stale connections after canister upgrades.
// Config is already cached in config.ts so this is still fast.
export async function getBackend(): Promise<AppBackend> {
  return (await createActorWithConfig()) as AppBackend;
}
