import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeToggle";
import React from "react";
import { useConvex } from "convex/react";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmDashboardIndex } from "../../app/routes/dashboard/-index.data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

function getUserInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name || email || "User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

/** Renders the Better Auth account menu used in the dashboard header. */
function UserMenuButton() {
  const { data: session, isPending } = authClient.useSession();
  const { theme, toggleTheme, mounted } = useTheme();
  const user = session?.user;

  if (isPending) {
    return <div className="h-8 w-8 border-2 border-[#1a1a1a] bg-[#e8e8e0]" />;
  }

  if (!user) {
    return null;
  }

  const label = user.name || user.email || "Account";
  const themeLabel = mounted
    ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    : "Theme";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.replace("/sign-in");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-8 w-8 border-2 border-[#1a1a1a] bg-[#e8e8e0] text-[#1a1a1a] outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a2d]"
          aria-label="Open account menu"
        >
          <Avatar className="h-full w-full rounded-md ring-0">
            {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
            <AvatarFallback className="rounded-md text-xs">
              {getUserInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block truncate text-sm text-[#1a1a1a]">{label}</span>
          {user.email ? (
            <span className="block truncate text-xs font-normal normal-case text-[#888]">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!mounted} onSelect={toggleTheme}>
          <ThemeIcon className="mr-2 h-4 w-4" />
          {themeLabel}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PathSegment = {
  label: React.ReactNode;
  href?: string;
  prewarmIntentHandlers?: ReturnType<typeof useRoutePrewarmIntent>;
};

export function DashboardHeader({
  children,
  paths = [],
}: {
  children?: React.ReactNode;
  paths?: PathSegment[];
}) {
  const convex = useConvex();
  const prewarmHomeIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmDashboardIndex(convex),
  );

  return (
    <header className="flex-shrink-0 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-xl font-black tracking-tighter text-[#1a1a1a] min-w-0 h-11 sm:h-14">
        <Link
          to="/dashboard"
          preload="intent"
          className="hover:text-[#2d5a2d] transition-colors mr-2 flex-shrink-0"
          {...prewarmHomeIntentHandlers}
        >
          scrubs.
        </Link>
        {paths.map((path, index) => {
          const isIntermediate = paths.length >= 2 && index < paths.length - 1;
          return (
          <div key={index} className={`${isIntermediate ? 'hidden sm:flex' : 'flex'} items-center min-w-0 flex-shrink`}>
            <span className="text-[#888] mr-2 flex-shrink-0">/</span>
            {path.href ? (
              <Link
                to={path.href}
                preload="intent"
                className="hover:text-[#2d5a2d] transition-colors truncate mr-2"
                {...path.prewarmIntentHandlers}
              >
                {path.label}
              </Link>
            ) : (
              <div className="truncate flex items-center gap-3">
                {path.label}
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* User controls — pinned top-right */}
      <div className="row-start-1 col-start-2 sm:col-start-3 flex items-center pl-4 border-l-2 border-[#1a1a1a]/10 h-8">
        <UserMenuButton />
      </div>

      {/* Children — second row on mobile, middle column on desktop */}
      {children && (
        <div className="col-span-full pb-2 sm:pb-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center gap-2 sm:gap-3 sm:justify-end sm:h-14 sm:pl-4 min-w-0">
          {children}
        </div>
      )}
    </header>
  );
}
