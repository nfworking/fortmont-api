import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Welcome to Fortmont</h1>
      <p className="text-muted-foreground">
        Please login to access the dashboard.
      </p>
      <Button asChild>
        <Link href="/login">Go to Login</Link>
      </Button>
    </div>
  )
}