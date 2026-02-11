import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/db/connection";
import User from "@/lib/db/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          const user = await User.findOne({ 
            email: (credentials.email as string).toLowerCase() 
          });

          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password as string, 
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for production behind proxies
});
