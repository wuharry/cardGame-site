import type { Metadata } from "next";
import AdminConsole from "./admin-console";

export const metadata: Metadata = {
  title: "玩家管理 · 紙鴉牌",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
