"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-content-primary text-center mb-6">
          Support Portal Login
        </h1>

        {sent ? (
          <div className="text-center">
            <p className="text-[13px] text-content-secondary mb-2">
              Check your email for a login link.
            </p>
            <p className="text-[12px] text-content-muted">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-content-primary block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary"
              />
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={!email.trim()}
              className="w-full px-4 py-2 text-[13px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Send Login Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
