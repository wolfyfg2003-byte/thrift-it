"use client";

import { DockBar } from "@/components/brand/DockBar";
import { usePathname } from "next/navigation";

export const APP_DOCK_HEIGHT =
  "calc(4.15rem + env(safe-area-inset-bottom, 0px))";

export default function AppDock() {
  const pathname = usePathname();
  const threadOpen = /^\/chats\/[^/]+/.test(pathname);

  if (threadOpen || pathname.startsWith("/seller/")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30">
      <DockBar label="Thrift It" interactive pathname={pathname} />
    </div>
  );
}
