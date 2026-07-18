import "./globals.css";

import React from "react";
import { Providers } from "./providers";

type Props = React.PropsWithChildren;

export default function RootLayout({ children }: Props) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}