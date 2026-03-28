"use client";

import { useEffect, useState } from "react";

interface SidebarProject {
  id: string;
  code: string | null;
  name: string;
  color: string;
}

export function useSidebarProjects() {
  const [projects, setProjects] = useState<SidebarProject[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setProjects(res.data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  return { projects };
}
