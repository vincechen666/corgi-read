"use client";

import { useState } from "react";

import { startEmailLogin } from "@/features/auth/auth-client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setStatus("idle");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(43,35,32,0.72)] px-4">
      <div className="w-full max-w-[480px] border border-[#e7ded4] bg-[#fffdf9] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#8a8178]">
          EMAIL LOGIN
        </p>
        <h2 className="mt-2 font-serif text-[30px] font-medium text-[#1a1a1a]">
          Email Verification
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6a625a]">
          Log in with a verification link. Your PDFs and learning records will
          stay in your cloud workspace.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setStatus("submitting");
            setError(null);

            try {
              await startEmailLogin(email);
              setStatus("sent");
            } catch (submissionError) {
              setStatus("idle");
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : "Failed to start login",
              );
            }
          }}
        >
          <label className="block">
            <span className="sr-only">Email address</span>
            <input
              autoComplete="email"
              className="h-[54px] w-full border border-[#e7ded4] bg-white px-4 text-sm outline-none placeholder:text-[#9a9188]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@corgiread.app"
              type="email"
              value={email}
            />
          </label>

          {error ? (
            <p className="text-sm text-[#b44d28]">{error}</p>
          ) : status === "sent" ? (
            <p className="text-sm text-[#44615a]">
              Verification email sent. Check your inbox to continue.
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              className="h-11 flex-1 border border-[#e7ded4] bg-white text-sm font-medium text-[#514942]"
              onClick={handleClose}
              type="button"
            >
              Close
            </button>
            <button
              className="h-11 flex-1 bg-[#e07b54] text-sm font-semibold text-white disabled:opacity-50"
              disabled={!email || status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? "Sending…" : "Send link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
