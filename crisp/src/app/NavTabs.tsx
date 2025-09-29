"use client";

import { Tabs } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NavTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = pathname?.startsWith("/interviewer")
    ? "interviewer"
    : "interviewee";

  useEffect(() => {
    // nothing, just to bind pathname
  }, [pathname]);

  return (
    <div className="w-full bg-white/70 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Tabs
          activeKey={activeKey}
          onChange={(key) => router.push(key === "interviewer" ? "/interviewer" : "/interviewee")}
          items={[
            { key: "interviewee", label: "Interviewee (Chat)" },
            { key: "interviewer", label: "Interviewer (Dashboard)" },
          ]}
          />
        </div>
      </div>
    </div>
  );
}


