"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, User, GitBranch, Globe, Link as LinkIcon } from "lucide-react";
import { TagInput } from "@/components/developer/tag-input";
import { getApiUrl } from "@/lib/api";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function Twitter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Go", "Rust", "Swift",
  "Flutter", "DevOps", "Machine Learning", "UI/UX", "Open Source", "APIs",
];

export default function DeveloperProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${session?.user?.token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    if (!session?.user?.token) return;
    fetch(getApiUrl("/api/developer/profile"), { headers: authHeaders })
      .then((r) => r.json())
      .then(({ developerProfile }) => {
        if (!developerProfile) return;
        setDisplayName(developerProfile.displayName || "");
        setBio(developerProfile.bio || "");
        setWebsite(developerProfile.website || "");
        setGithubUrl(developerProfile.githubUrl || "");
        setTwitterUrl(developerProfile.twitterUrl || "");
        setLinkedinUrl(developerProfile.linkedinUrl || "");
        setSkills(developerProfile.skills || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSave = async () => {
    if (!displayName.trim()) { setError("Display name is required"); return; }
    setIsSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(getApiUrl("/api/developer/profile"), {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ displayName, bio, website, githubUrl, twitterUrl, linkedinUrl, skills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "D";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Developer Profile</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Your public developer identity on DUspace.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Avatar preview + name */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 text-2xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900">{displayName || "Your Name"}</p>
                <p className="text-sm text-neutral-500">{session?.user?.email}</p>
                <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Developer
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your developer name"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1.5">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself and your work…"
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
              />
              <p className="mt-1 text-[11px] text-neutral-400">{bio.length}/500</p>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Skills & Expertise</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Technologies and areas you specialize in.</p>
            </div>
            <TagInput value={skills} onChange={setSkills} placeholder="Add skill…" suggestions={SKILL_SUGGESTIONS} maxTags={15} />
          </div>

          {/* Social links */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-900">Social links</h2>
            {[
              { id: "profile-website", label: "Website", value: website, setter: setWebsite, icon: Globe, placeholder: "https://yourwebsite.com" },
              { id: "profile-github", label: "GitHub", value: githubUrl, setter: setGithubUrl, icon: Github, placeholder: "https://github.com/username" },
              { id: "profile-twitter", label: "Twitter / X", value: twitterUrl, setter: setTwitterUrl, icon: Twitter, placeholder: "https://twitter.com/username" },
              { id: "profile-linkedin", label: "LinkedIn", value: linkedinUrl, setter: setLinkedinUrl, icon: LinkIcon, placeholder: "https://linkedin.com/in/username" },
            ].map(({ id: fid, label, value, setter, icon: Icon, placeholder }) => (
              <div key={fid}>
                <label htmlFor={fid} className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id={fid}
                    type="url"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}
          {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-medium text-emerald-800">✓ Profile saved successfully</p></div>}

          <button
            id="save-profile-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition"
          >
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save profile</>}
          </button>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Profile preview</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{displayName || "—"}</p>
                <p className="text-xs text-neutral-500 truncate max-w-[140px]">{bio || "No bio"}</p>
              </div>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skills.slice(0, 5).map((s) => (
                  <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">{s}</span>
                ))}
                {skills.length > 5 && <span className="text-[10px] text-neutral-400">+{skills.length - 5} more</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
