import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiUrl } from "@/lib/api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(getApiUrl("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          // Read as text first to handle empty or HTML responses gracefully
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error("Failed to parse JSON response from auth API:", text);
            return null;
          }

          if (res.ok && data?.user) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              isDeveloper: data.user.isDeveloper,
              developerStatus: data.user.developerStatus,
              developerProfile: data.user.developerProfile,
              token: data.token,
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // If updating session manually
      if (trigger === "update" && session) {
        if (session.user?.isDeveloper !== undefined) {
          token.isDeveloper = session.user.isDeveloper;
        }
        if (session.user?.role) {
          token.role = session.user.role;
        }
        if (session.user?.developerStatus) {
          token.developerStatus = session.user.developerStatus;
        }
        if (session.user?.developerProfile) {
          token.developerProfile = session.user.developerProfile;
        }
        if (session.user?.token) {
          token.token = session.user.token;
        }
      }

      // On first sign in, populate token from user
      if (user) {
        token.id = user.id;
        token.role = (user.role as "user" | "developer") ?? "user";
        token.isDeveloper = user.isDeveloper ?? false;
        token.developerStatus = user.developerStatus;
        token.developerProfile = user.developerProfile;
        if (user.token) {
          token.token = user.token;
        } else if (account?.provider === "google") {
          // For Google OAuth users, create/get them in the backend and get a token
          try {
            const res = await fetch(getApiUrl("/api/auth/oauth"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: user.name,
                email: user.email,
                image: user.image,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              token.token = data.token;

              // Sync developer status from the database so it persists
              // across sign-out → re-login cycles for OAuth users
              if (data.user) {
                token.isDeveloper = data.user.isDeveloper ?? false;
                token.role = data.user.role ?? "user";
                if (data.user.developerStatus) {
                  token.developerStatus = data.user.developerStatus;
                }
                if (data.user.developerProfile) {
                  token.developerProfile = data.user.developerProfile;
                }
              }
            }
          } catch (err) {
            console.error("Failed to get OAuth token:", err);
          }
        }
      }

      // Guard: if no API token exists on a persisted session, invalidate it so
      // the user is forced to re-sign-in instead of silently sending "Bearer undefined"
      // to the API. This happens when the API was down during the original login.
      if (!token.token && !user) {
        console.warn("[auth] Session has no API token — invalidating to force re-login");
        return { ...token, error: "NoApiToken" };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "developer") ?? "user";
        session.user.isDeveloper = token.isDeveloper as boolean;
        
        if (token.developerStatus) {
          session.user.developerStatus = token.developerStatus as "none" | "pending" | "approved" | "rejected";
        }
        if (token.developerProfile) {
          session.user.developerProfile = token.developerProfile as any;
        }
        if (token.token) {
          session.user.token = token.token as string;
        }
      }
      return session;
    },

    async signIn({ user, account }) {
      // Allow all Google sign-ins
      if (account?.provider === "google") {
        return true;
      }
      // Allow credentials sign-in
      if (account?.provider === "credentials") {
        return true;
      }
      return false;
    },

    async redirect({ url, baseUrl }) {
      // After sign-in, redirect to dashboard
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

