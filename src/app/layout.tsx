import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy Dashboard",
  description: "Quick-look fantasy league dashboard with charts and leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <style>{`
          .site-nav {
            display: flex;
            align-items: center;
            gap: 0;
            padding: 0 clamp(20px, 3vw, 32px);
            background: rgba(10, 18, 36, 0.92);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .site-nav a {
            display: inline-flex;
            align-items: center;
            padding: 14px 18px;
            font-size: 14px;
            font-weight: 600;
            color: var(--muted);
            text-decoration: none;
            border-bottom: 2px solid transparent;
            transition: color 0.15s, border-color 0.15s;
          }
          .site-nav a:hover {
            color: var(--text);
          }
          .site-nav a[data-active="true"] {
            color: var(--text);
            border-bottom-color: var(--accent);
          }
        `}</style>
        <NavBar />
        {children}
      </body>
    </html>
  );
}

// Server-side nav that marks the active link based on the current path.
// We use an inline script approach with pathname detection via a client island.
function NavBar() {
  return (
    <>
      <nav className="site-nav" id="site-nav">
        <a href="/" id="nav-dashboard">Dashboard</a>
        <a href="/roster" id="nav-roster">Player History</a>
      </nav>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var path = window.location.pathname;
              var dashboard = document.getElementById('nav-dashboard');
              var roster = document.getElementById('nav-roster');
              if (path === '/' || path === '') {
                dashboard && dashboard.setAttribute('data-active', 'true');
              } else if (path.startsWith('/roster')) {
                roster && roster.setAttribute('data-active', 'true');
              }
            })();
          `,
        }}
      />
    </>
  );
}
