import './globals.css';

export const metadata = {
  title: "SecureProTrading",
  description: "Professional Trading Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}