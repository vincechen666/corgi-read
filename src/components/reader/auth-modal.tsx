"use client";

import { useState, type FormEvent } from "react";

import {
  startEmailLoginCode,
  startEmailSignupLink,
  verifyEmailLoginCode,
} from "@/features/auth/auth-client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type AuthStep = "email-entry" | "signup-link-sent" | "code-entry";

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<AuthStep>("email-entry");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setToken("");
    setStep("email-entry");
    setIsSubmitting(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/email-flow", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to start login");
      }

      const { flow } = (await response.json()) as {
        flow: "signup-link" | "login-code";
      };

      if (flow === "signup-link") {
        await startEmailSignupLink(email);
        setStep("signup-link-sent");
      } else {
        await startEmailLoginCode(email);
        setToken("");
        setStep("code-entry");
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to start login",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await verifyEmailLoginCode(email, token);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to verify code",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await startEmailLoginCode(email);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to resend code",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          Continue with your email address. We will either send a verification
          link or a login code.
        </p>

        {step === "signup-link-sent" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[18px] border border-[#d8e3dc] bg-[#f6fbf8] p-4">
              <p className="text-sm font-medium text-[#44615a]">
                Check your inbox to continue.
              </p>
              <p className="mt-1 text-sm leading-6 text-[#5c6f67]">
                We sent a verification link to {email}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="h-11 flex-1 border border-[#e7ded4] bg-white text-sm font-medium text-[#514942]"
                onClick={handleClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={step === "code-entry" ? submitCode : submitEmail}
          >
            <label className="block">
              <span className="sr-only">
                {step === "code-entry" ? "Verification code" : "Email address"}
              </span>
              {step === "code-entry" ? (
                <input
                  autoComplete="one-time-code"
                  className="h-[54px] w-full border border-[#e7ded4] bg-white px-4 text-sm outline-none placeholder:text-[#9a9188]"
                  inputMode="numeric"
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="123456"
                  type="text"
                  value={token}
                />
              ) : (
                <input
                  autoComplete="email"
                  className="h-[54px] w-full border border-[#e7ded4] bg-white px-4 text-sm outline-none placeholder:text-[#9a9188]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@corgiread.app"
                  type="email"
                  value={email}
                />
              )}
            </label>

            {error ? <p className="text-sm text-[#b44d28]">{error}</p> : null}

            <div className="flex gap-3">
              <button
                className="h-11 flex-1 border border-[#e7ded4] bg-white text-sm font-medium text-[#514942]"
                onClick={handleClose}
                type="button"
              >
                Close
              </button>
              {step === "code-entry" ? (
                <>
                  <button
                    className="h-11 flex-1 border border-[#e7ded4] bg-white text-sm font-medium text-[#514942] disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={resendCode}
                    type="button"
                  >
                    Resend code
                  </button>
                  <button
                    className="h-11 flex-1 bg-[#e07b54] text-sm font-semibold text-white disabled:opacity-50"
                    disabled={!token || isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Verifying…" : "Verify code"}
                  </button>
                </>
              ) : (
                <button
                  className="h-11 flex-1 bg-[#e07b54] text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!email || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Sending…" : "Continue"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
