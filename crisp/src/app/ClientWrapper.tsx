"use client";

import "antd/dist/reset.css";
import { AppProviders } from "@/app/providers";
import "@/app/suppressAntdWarning";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProviders>{children}</AppProviders>;
}


