import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: 'MyReminder',
  description: 'Create and share a countdown in seconds.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', siteName: 'MyReminder' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header style={{ maxWidth: 960, margin: "16px auto", padding: "0 16px", display: "flex", justifyContent: "space-between" }}>
          <a href="/" style={{ fontWeight: 600 }}>MyReminder</a>
          <nav style={{ display: "flex", gap: 12 }}>
            <a href="/new">Create</a>
            <a href="/dashboard">My Countdowns</a>
            <a href="/api/auth/signin">Sign in</a>
            <a href="/api/auth/signout">Sign out</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
