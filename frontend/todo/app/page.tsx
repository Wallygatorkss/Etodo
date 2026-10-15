"use client";

import { Corps } from "@/components/ui/corps";
import Inbox from "@/components/ui/inbox";
import Board from "@/components/ui/board";
import { Header } from "@/components/ui/header";

export default function Home() {
  return (
    <div className="bg-slate-200 dark:bg-[#0d1117] py-1.5 min-h-screen">
      <Header />
      <Corps>
        <Inbox />
        <Board />
      </Corps>
    </div>
  );
}
