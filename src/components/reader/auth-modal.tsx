"use client";

import { useState, type FormEvent } from "react";

import {
  startEmailLoginCode,
  verifyEmailLoginCode,
} from "@/features/auth/auth-client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type AuthStep = "email-entry" | "code-entry";

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
      await startEmailLoginCode(email);
      setToken("");
      setStep("code-entry");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to send code",
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
          Email Login
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6a625a]">
          Continue with your email address. We will send a one-time verification
          code that you can enter here to sign in or create your account.
        </p>

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

          {step === "code-entry" ? (
            <p className="text-sm leading-6 text-[#6a625a]">
              Enter the 6-digit code we sent to {email}.
            </p>
          ) : null}

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
                {isSubmitting ? "Sending…" : "Send code"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
