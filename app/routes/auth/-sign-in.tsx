import { useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function getRedirectUrl(searchStr: string) {
  return new URLSearchParams(searchStr).get("redirect_url") || "/dashboard";
}

/** Renders the Better Auth email/password sign-in form. */
export default function SignInPage() {
  const search = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const redirectUrl = getRedirectUrl(search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectUrl,
      });

      if (result.error) {
        setError(result.error.message || "Unable to sign in.");
        return;
      }

      window.location.assign(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-black uppercase tracking-normal text-[#1a1a1a]">
          Sign in
        </h1>
        <p className="mt-1 font-mono text-sm text-[#888]">
          Use your scrubs account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a]">
            Email
          </span>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a]">
            Password
          </span>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? (
          <div className="border-2 border-[#dc2626] bg-[#dc2626]/10 p-3 text-sm text-[#7f1d1d]">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !email.trim() || !password}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center font-mono text-sm text-[#888]">
        Need an account?{" "}
        <a
          href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="font-bold text-[#2d5a2d] hover:text-[#1a1a1a]"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
