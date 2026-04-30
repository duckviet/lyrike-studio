import "./globals.css";

import React from "react";
import { Providers } from "./providers";

type Props = React.PropsWithChildren;

export default function RootLayout({ children }: Props) {
  return <Providers>{children}</Providers>;
}