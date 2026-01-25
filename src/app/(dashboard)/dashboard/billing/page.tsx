import { CreditCard, Receipt, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  Basic features for getting started
                </p>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />1
                  Workspace
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />5
                  Projects
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Basic Support
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Your saved payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                No payment method added
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View your past invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No billing history available
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
