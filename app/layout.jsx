import './globals.css';
import NavAndTicker from '../components/NavAndTicker.jsx';
import { OddsProvider } from '../components/OddsToggle.jsx';

export const metadata = {
  title: 'RaceEdge - Horse Racing Intelligence',
  description: 'Data-driven horse racing tips for UK and Ireland',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <OddsProvider>
          <NavAndTicker />
          <main>{children}</main>
        </OddsProvider>
      </body>
    </html>
  );
}
