import { betterAuth } from "better-auth/minimal";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { query, type QueryCtx, type MutationCtx, type ActionCtx } from "./_generated/server";
import { type DataModel, type Id } from "./_generated/dataModel";
import authConfig from "./auth.config";

type AuthIdentity = NonNullable<
  Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
>;

const siteUrl = process.env.SITE_URL!;
const trustedOrigins = [
  siteUrl,
  "http://100.93.227.9:5297",
];

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwt: {
          definePayload: ({ user }) => ({
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            pictureUrl: user.image,
          }),
        },
      }),
    ],
  });

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function getOptionalString(identity: AuthIdentity, key: string): string | undefined {
  const value = (identity as Record<string, unknown>)[key];
  return hasString(value) ? value : undefined;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

export function identityName(identity: AuthIdentity): string {
  const name = getOptionalString(identity, "name");
  if (name) return name;

  const firstName = getOptionalString(identity, "firstName");
  const lastName = getOptionalString(identity, "lastName");
  if (firstName && lastName) return `${firstName} ${lastName}`;

  const email = getOptionalString(identity, "email");
  if (email) return email;

  return "Unknown";
}

export function identityEmail(identity: AuthIdentity): string {
  return getOptionalString(identity, "email") ?? "";
}

export function identityAvatarUrl(identity: AuthIdentity): string | undefined {
  return getOptionalString(identity, "pictureUrl");
}

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return identity;
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function getIdentity(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

export async function requireTeamAccess(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userClerkId", user.subject)
    )
    .unique();

  if (!membership) {
    throw new Error("Not a team member");
  }

  if (requiredRole && ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[requiredRole]) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }

  return { user, membership };
}

export async function requireProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const { membership } = await requireTeamAccess(ctx, project.teamId, requiredRole);

  return { user, membership, project };
}

export async function requireVideoAccess(
  ctx: QueryCtx | MutationCtx,
  videoId: Id<"videos">,
  requiredRole?: Role
) {
  const user = await requireUser(ctx);

  const video = await ctx.db.get(videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  const { membership, project } = await requireProjectAccess(ctx, video.projectId, requiredRole);

  return { user, membership, project, video };
}
