import { getCurrentUser } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">View your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal details and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="text-xl">
                {getInitials(user?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="text-base">{user?.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Email Address
              </p>
              <p className="text-base">{user?.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Account Role
              </p>
              <p className="text-base capitalize">{user?.role.toLowerCase()}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="text-base font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
