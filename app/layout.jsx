import "./globals.css";
import NavAndTicker from "@/components/NavAndTicker";
import GambleAware from "@/components/GambleAware";
import { OddsProvider } from "@/components/OddsToggle";

export const metadata = {
  title: "RaceEdge | AI Horse Racing Tips",
  description: "Data-driven UK horse racing tips. Rambling Robbie and Punter Pat. 18+ BeGambleAware.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <OddsProvider>
          <NavAndTicker />
          <div className="page-shell">
            <main className="main-col">{children}</main>
          </div>
          <GambleAware />
        </OddsProvider>
      </body>
    </html>
  );
}