"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type User = {
  id: string
}

export function GroupInfoCards() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)

        const res = await fetch("/api/entra/groups", {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY!,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status}`)
        }

        const data = await res.json()

        // expect array
        setUsers(Array.isArray(data) ? data : data.value ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-muted-foreground">
        Loading users...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Badge variant="destructive">{error}</Badge>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-1 w-50 mt-5">
      <Card className="transition hover:shadow-md">
        <CardHeader>
          <CardDescription>Total Groups</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {users.length}
          </CardTitle>
        </CardHeader>

        <CardFooter className="text-sm text-muted-foreground">
          Active directory group count
        </CardFooter>
      </Card>
    </div>
  )
}