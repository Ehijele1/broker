import './globals.css';

export const metadata = {
  title: 'SecureProTrading',
  description: 'Professional Trading Platform',
  icons: {
    icon: '/logo.png',  // or whatever you named it
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}