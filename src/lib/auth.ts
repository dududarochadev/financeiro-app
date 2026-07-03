import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // On first sign-in, store the user's email in the token
      // and look up the stable profile UUID by email.
      if (account && user?.email) {
        token.email = user.email.toLowerCase();
        try {
          // Dynamic import to avoid bundling pg in edge runtime
          const pool = (await import('@/lib/db')).default;
          const result = await pool.query(
            'SELECT id FROM public.profiles WHERE email = $1',
            [token.email]
          );
          if (result.rows.length > 0) {
            // Existing user — use the stored profile UUID
            token.sub = result.rows[0].id;
          }
          // New user: token.sub stays as NextAuth's random UUID,
          // which signIn will use as the profile id — they match.
        } catch (err) {
          console.error('Error looking up profile in JWT:', err);
        }
      }
      return token;
    },
    async signIn({ user, account }) {
      // Look up or create profile by email (stable across devices)
      if (account?.provider === 'google' && user.email) {
        try {
          const pool = (await import('@/lib/db')).default;
          const existing = await pool.query(
            'SELECT id FROM public.profiles WHERE email = $1',
            [user.email.toLowerCase()]
          );

          if (existing.rows.length > 0) {
            // Existing user — update display_name / avatar
            await pool.query(
              `UPDATE public.profiles
               SET display_name = COALESCE($1, display_name),
                   avatar_url = COALESCE($2, avatar_url),
                   updated_at = NOW()
               WHERE id = $3`,
              [user.name, user.image, existing.rows[0].id]
            );
          } else {
            // New user — create profile with the same UUID NextAuth
            // put in token.sub (both come from the same user.id)
            await pool.query(
              `INSERT INTO public.profiles (id, display_name, avatar_url, email)
               VALUES ($1, $2, $3, $4)`,
              [user.id, user.name, user.image, user.email.toLowerCase()]
            );
          }
        } catch (err) {
          console.error('Error upserting profile:', err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
