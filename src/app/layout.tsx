import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мишпуха",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}if(window.caches){caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k);});});}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
