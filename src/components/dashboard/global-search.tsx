"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, Building2, ListTodo, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  workspaceId: string;
  workspaceName?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  projectId: string;
  projectName?: string;
  workspaceId?: string;
}

interface SearchResult {
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    workspaces: [],
    projects: [],
    tasks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchData = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ workspaces: [], projects: [], tasks: [] });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch workspaces
      const workspacesRes = await fetch("/api/workspaces");
      const workspacesData = await workspacesRes.json();
      const workspaces = (workspacesData.workspaces || []).filter(
        (w: Workspace) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      // Fetch projects from all workspaces
      const allProjects: Project[] = [];
      const allTasks: Task[] = [];

      for (const workspace of workspacesData.workspaces || []) {
        const projectsRes = await fetch(
          `/api/projects?workspaceId=${workspace.id}`,
        );
        const projectsData = await projectsRes.json();

        const matchingProjects = (projectsData.projects || [])
          .filter((p: Project) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((p: Project) => ({
            ...p,
            workspaceName: workspace.name,
          }));

        allProjects.push(...matchingProjects);

        // Fetch tasks for each project
        for (const project of projectsData.projects || []) {
          const tasksRes = await fetch(`/api/tasks?projectId=${project.id}`);
          const tasksData = await tasksRes.json();

          const matchingTasks = (tasksData.tasks || [])
            .filter((t: Task) =>
              t.title.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((t: Task) => ({
              ...t,
              projectName: project.name,
              workspaceId: workspace.id,
            }));

          allTasks.push(...matchingTasks);
        }
      }

      setResults({
        workspaces: workspaces.slice(0, 3),
        projects: allProjects.slice(0, 3),
        tasks: allTasks.slice(0, 5),
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchData(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (type: string, item: Workspace | Project | Task) => {
    setIsOpen(false);
    setQuery("");

    if (type === "workspace") {
      router.push(`/workspace/${(item as Workspace).id}`);
    } else if (type === "project") {
      const project = item as Project;
      router.push(`/workspace/${project.workspaceId}/projects/${project.id}`);
    } else if (type === "task") {
      const task = item as Task;
      router.push(`/workspace/${task.workspaceId}/projects/${task.projectId}`);
    }
  };

  const hasResults =
    results.workspaces.length > 0 ||
    results.projects.length > 0 ||
    results.tasks.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search projects, tasks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-12 bg-muted/50"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults({ workspaces: [], projects: [], tasks: [] });
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (query || hasResults) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full rounded-lg border bg-popover shadow-lg z-50 overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !hasResults && query ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.workspaces.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      Workspaces
                    </p>
                    {results.workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleSelect("workspace", workspace)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-muted transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {workspace.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {results.projects.length > 0 && (
                  <div className="p-2 border-t">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      Projects
                    </p>
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelect("project", project)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-muted transition-colors"
                      >
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.workspaceName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.tasks.length > 0 && (
                  <div className="p-2 border-t">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      Tasks
                    </p>
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleSelect("task", task)}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-muted transition-colors"
                      >
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.projectName}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            task.status === "DONE" &&
                              "bg-emerald-100 text-emerald-700",
                            task.status === "IN_PROGRESS" &&
                              "bg-amber-100 text-amber-700",
                            task.status === "TODO" &&
                              "bg-slate-100 text-slate-700",
                          )}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
