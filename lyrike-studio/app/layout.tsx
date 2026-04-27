import "./globals.css";

import React from "react";

type Props = React.PropsWithChildren;

export default function RootLayout({ children }: Props) {
  return <>{children}</>;
}
