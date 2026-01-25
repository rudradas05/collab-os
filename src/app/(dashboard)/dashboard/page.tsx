import { getCurrentUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Your registered email address</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{user?.email}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Role</CardTitle>
            <CardDescription>Your current account role</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium capitalize">
              {user?.role.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your account is active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-lg font-medium">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
