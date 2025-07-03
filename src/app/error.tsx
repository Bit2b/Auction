'use client'

import { Button } from "@/components/ui/button"
import { AlertTriangleIcon } from "lucide-react"
import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string },
  reset: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center space-y-6 px-4 text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangleIcon className="size-10 text-rose-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>
          <p>{error.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-x-3">
        <Button onClick={reset} className="font-medium px-6">
          Try again
        </Button>
        <Button variant="ghost" className="font-medium" asChild>
          <Link href="/">Go Back</Link>
        </Button>
      </div>
    </div>
  )
}