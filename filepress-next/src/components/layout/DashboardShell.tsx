"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { CreateLibraryModal } from "@/components/modals/CreateLibraryModal";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { Library } from "@/types";

interface Props {
  user: SessionUser;
  libraries: Library[];
  children: React.ReactNode;
}

export function DashboardShell({ user, libraries: initialLibraries, children }: Props) {
  const router = useRouter();
  const [libraries, setLibraries] = useState<Library[]>(initialLibraries);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function handleCreateLibrary(name: string, desc: string) {
    const res = await fetch("/api/libraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appname: name, appdesc: desc }),
    });
    const data = await res.json();
    if (data.code === 0 && data.data) {
      const newLib: Library = { ...data.data, filecount: 0 };
      setLibraries((prev) => [newLib, ...prev]);
      router.push(`/dashboard/library/${data.data.appid}`);
    }
    setShowCreateModal(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={user}
        libraries={libraries}
        onCreateLibrary={() => setShowCreateModal(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      {showCreateModal && (
        <CreateLibraryModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateLibrary}
        />
      )}
    </div>
  );
}
