import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext.js';
import { CampusProvider } from '../context/CampusContext.js';
import { Header } from '../components/layout/Header.js';
import { Footer } from '../components/layout/Footer.js';

export const metadata: Metadata = {
  title: 'YouColiva — Logement & Colocation pour la communauté YouCode',
  description:
    'Trouvez votre logement ou votre colocataire idéal sur les campus YouCode de Youssoufia, Safi et Nador.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr" className="h-full">
      <body className="flex flex-col min-h-screen bg-white text-gray-900">
        <AuthProvider>
          <CampusProvider>
            <Header />
            <main className="flex-1 flex flex-col min-h-0">{children}</main>
            <Footer />
          </CampusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
