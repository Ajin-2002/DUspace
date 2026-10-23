"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Code, CheckCircle, ArrowRight, ExternalLink } from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function DeveloperSpacePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const isDeveloper = session?.user?.isDeveloper;
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleRegisterDeveloper = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const website = formData.get("website") as string;

    try {
      const res = await fetch(getApiUrl("/api/developer/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({ displayName, bio, website }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to register as developer");
        setIsSubmitting(false);
        return;
      }

      // Registration successful — update the session with the new developer status
      const data = await res.json();
      await update({
        user: {
          isDeveloper: true,
          role: "developer",
          developerStatus: data.user?.developerStatus,
          developerProfile: data.user?.developerProfile,
          token: data.token,
        },
      });
      setRegistered(true);
      setTimeout(() => {
        router.push("/developer");
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("An error occurred");
      setIsSubmitting(false);
    }
  };

  if (isDeveloper) {
    return (
      <div className="space-y-7">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Developer space
          </h2>
          <Link
            href="/developer"
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Code className="h-4 w-4" />
            Go to Developer Portal
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.25)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Code className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900">
                {session?.user?.developerProfile?.displayName ||
                  "Developer Account"}
              </h3>
              <p className="text-sm text-neutral-500">
                Status:{" "}
                <span className="capitalize font-medium text-slate-700">
                  {session?.user?.developerStatus || "Active"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)]">
            <h3 className="text-sm font-medium text-neutral-900 mb-2">
              Publish Apps
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Manage your published applications, updates, and analytics from
              the Developer Portal.
            </p>
            <Link
              href="/developer/apps"
              className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline"
            >
              View my apps &rarr;
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)]">
            <h3 className="text-sm font-medium text-neutral-900 mb-2">
              Earnings
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Track revenue, manage payouts, and view sales history.
            </p>
            <Link
              href="/developer/earnings"
              className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline"
            >
              View earnings &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <CheckCircle className="h-9 w-9 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">
          You&apos;re a Developer! 🎉
        </h2>
        <p className="text-sm text-neutral-500 max-w-xs">
          Your developer account is ready. Redirecting you to the Developer
          Portal...
        </p>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <ArrowRight className="h-4 w-4 animate-bounce-x" />
          Taking you to the Developer Dashboard
        </div>
      </div>
    );
  }

  if (isRegistering) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <button
            onClick={() => setIsRegistering(false)}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4 flex items-center gap-1"
          >
            &larr; Back
          </button>
          <h2 className="text-2xl font-bold text-neutral-900">
            Register as a Developer
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Fill out your developer profile to start publishing apps.
          </p>
        </div>

        <form
          onSubmit={handleRegisterDeveloper}
          className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_35px_-25px_rgba(15,23,42,0.32)] sm:p-8"
        >
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Developer / Company Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
              placeholder="ByteWorks Inc."
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
              placeholder="We build productivity tools for teams..."
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Website URL
            </label>
            <input
              type="url"
              id="website"
              name="website"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
              placeholder="https://example.com"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRegistering(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isSubmitting ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-neutral-900">Developer Space</h2>

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.18)] sm:p-9">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-xl">
          <h3 className="mb-3 text-3xl font-bold tracking-tight text-slate-950">
            Become a developer
          </h3>
          <p className="mb-6 max-w-xl text-sm leading-6 text-slate-600">
            Unlock the ability to publish your own applications, manage users,
            track analytics, and monetize your creations on DUspace.
          </p>

          <ul className="mb-8 space-y-3">
            {[
              "Publish unlimited applications",
              "Access detailed analytics and metrics",
              "Monetize through paid apps or subscriptions",
              "Interact with user reviews and feedback",
            ].map((perk, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <CheckCircle className="h-4 w-4 text-slate-600" />
                {perk}
              </li>
            ))}
          </ul>

          <button
            onClick={() => setIsRegistering(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
          >
            <Code className="h-4 w-4" />
            Register as Developer
          </button>
        </div>
      </div>
    </div>
  );
}
