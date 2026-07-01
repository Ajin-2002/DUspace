import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Mock DB lookup/creation
        const role = (credentials.role === "developer" ? "developer" : "user") as "user" | "developer";

        return {
          id: `mock-id-${credentials.email}`,
          name: credentials.email.split("@")[0],
          email: credentials.email,
          role,
        };
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
    async jwt({ token, user, account }) {
      // On first sign in, populate token from user
      if (user) {
        token.id = user.id;
        // Check if a role was pre-selected during registration (stored in a cookie)
        // Default to "user" if nothing set
        token.role = (user.role as "user" | "developer") ?? "user";
      }

      // If account is present (OAuth flow), we can also read role from account
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "developer") ?? "user";
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
