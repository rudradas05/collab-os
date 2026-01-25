import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getWorkspaceWithMembership } from "@/lib/workspace";
import { WorkspaceSidebar } from "@/components/workspace/sidebar";
import { WorkspaceNavbar } from "@/components/workspace/navbar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { workspaceId } = await params;
  const workspace = await getWorkspaceWithMembership(workspaceId, user.id);

  if (!workspace) {
    redirect("/dashboard/workspaces");
  }

  return (
    <div className="flex h-screen">
      <WorkspaceSidebar
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceNavbar
          user={user}
          workspace={{ id: workspace.id, name: workspace.name }}
          workspaceRole={workspace.role}
        />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
