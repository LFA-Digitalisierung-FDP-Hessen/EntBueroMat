import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* TypeKit Fonts for Field Gothic */}
        <link rel="stylesheet" href="https://use.typekit.net/fdy3gof.css" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#e5007d" />
        <meta name="msapplication-TileColor" content="#e5007d" />
        
        {/* Basic Security headers */}
        <meta httpEquiv="Content-Security-Policy" content={`default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com use.typekit.net p.typekit.net; font-src 'self' fonts.gstatic.com use.typekit.net p.typekit.net; img-src 'self' data: https:; connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')} ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('http://', 'https://')} ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('http://', 'ws://')} ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('http://', 'wss://')};`} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 