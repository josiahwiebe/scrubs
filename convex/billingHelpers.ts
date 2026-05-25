import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export type TeamPlan = "basic" | "pro";

const GIBIBYTE = 1024 ** 3;
const UNLIMITED_STORAGE_LIMIT_BYTES = Number.MAX_SAFE_INTEGER;

export const TEAM_PLAN_MONTHLY_PRICE_USD: Record<TeamPlan, number> = {
  basic: 5,
  pro: 25,
};

export const TEAM_PLAN_STORAGE_LIMIT_BYTES: Record<TeamPlan, number> = {
  basic: 100 * GIBIBYTE,
  pro: 1024 * GIBIBYTE,
};

function hasText(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readCsvEnv(name: string) {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getPersonalTeamOwnerEmails() {
  return readCsvEnv("PERSONAL_TEAM_OWNER_EMAILS");
}

export function getPersonalTeamSlugs() {
  return readCsvEnv("PERSONAL_TEAM_SLUGS");
}

export async function isPersonalUnlimitedTeam(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const team = await ctx.db.get(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  if (getPersonalTeamSlugs().has(team.slug.toLowerCase())) {
    return { team, isPersonal: true };
  }

  const owner = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userClerkId", team.ownerClerkId),
    )
    .unique();

  const ownerEmail = owner?.userEmail.toLowerCase();
  return {
    team,
    isPersonal: Boolean(ownerEmail && getPersonalTeamOwnerEmails().has(ownerEmail)),
  };
}

export function normalizeStoredTeamPlan(plan: string): TeamPlan {
  if (plan === "pro" || plan === "team") return "pro";
  return "basic";
}

export function resolvePlanFromStripePriceId(
  stripePriceId: string | undefined | null,
): TeamPlan | null {
  if (!hasText(stripePriceId)) return null;

  const basicPriceId = process.env.STRIPE_PRICE_BASIC_MONTHLY;
  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (hasText(basicPriceId) && stripePriceId === basicPriceId) return "basic";
  if (hasText(proPriceId) && stripePriceId === proPriceId) return "pro";
  return null;
}

export function getStripePriceIdForPlan(plan: TeamPlan): string {
  const variableName =
    plan === "basic" ? "STRIPE_PRICE_BASIC_MONTHLY" : "STRIPE_PRICE_PRO_MONTHLY";
  const value = process.env[variableName];
  if (!hasText(value)) {
    throw new Error(`${variableName} is not configured`);
  }
  return value;
}

export function hasActiveTeamSubscriptionStatus(
  status: string | undefined | null,
): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

type BillingCtx = QueryCtx | MutationCtx;

export async function getTeamSubscriptionByOrgId(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  return await ctx.runQuery(components.stripe.public.getSubscriptionByOrgId, {
    orgId: teamId,
  });
}

export async function getTeamSubscriptionState(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const personalTeam = await isPersonalUnlimitedTeam(ctx, teamId);
  if (personalTeam.isPersonal) {
    return {
      team: personalTeam.team,
      subscription: null,
      plan: "pro" as const,
      hasActiveSubscription: true,
      isPersonalUnlimited: true,
    };
  }

  const team = personalTeam.team;
  const subscription = await getTeamSubscriptionByOrgId(ctx, teamId);
  const subscriptionPlan = resolvePlanFromStripePriceId(subscription?.priceId);
  const plan = subscriptionPlan ?? normalizeStoredTeamPlan(team.plan);
  const hasActiveSubscription = hasActiveTeamSubscriptionStatus(
    subscription?.status,
  );

  return { team, subscription, plan, hasActiveSubscription, isPersonalUnlimited: false };
}

export async function getTeamStorageUsedBytes(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  const videosByProject = await Promise.all(
    projects.map((project) =>
      ctx.db
        .query("videos")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect(),
    ),
  );

  let total = 0;
  for (const videos of videosByProject) {
    for (const video of videos) {
      if (video.status === "failed") continue;
      if (typeof video.fileSize === "number" && Number.isFinite(video.fileSize)) {
        total += video.fileSize;
      }
    }
  }

  return total;
}

export async function assertTeamHasActiveSubscription(
  ctx: BillingCtx,
  teamId: Id<"teams">,
) {
  const state = await getTeamSubscriptionState(ctx, teamId);
  if (!state.hasActiveSubscription) {
    throw new Error("An active Basic or Pro subscription is required.");
  }
  return state;
}

export async function assertTeamCanStoreBytes(
  ctx: BillingCtx,
  teamId: Id<"teams">,
  incomingBytes: number,
) {
  const state = await assertTeamHasActiveSubscription(ctx, teamId);
  const storageUsedBytes = await getTeamStorageUsedBytes(ctx, teamId);
  const storageLimitBytes = state.isPersonalUnlimited
    ? UNLIMITED_STORAGE_LIMIT_BYTES
    : TEAM_PLAN_STORAGE_LIMIT_BYTES[state.plan];
  const requestedBytes = Number.isFinite(incomingBytes) ? Math.max(0, incomingBytes) : 0;

  if (storageUsedBytes + requestedBytes > storageLimitBytes) {
    throw new Error(
      `Storage limit reached for the ${state.plan} plan. Upgrade to continue uploading.`,
    );
  }

  return {
    ...state,
    storageUsedBytes,
    storageLimitBytes,
  };
}
