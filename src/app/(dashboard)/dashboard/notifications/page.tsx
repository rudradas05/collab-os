import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>View and manage your notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              You&apos;re all caught up! New notifications will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
