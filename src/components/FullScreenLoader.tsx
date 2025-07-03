import { LoaderIcon } from "lucide-react"

const FullScreenLoader = ({ label }: { label?: string }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2">
      <LoaderIcon className="size-6 text-muted-foreground animate-spin" />
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
    </div>
  )
}

export default FullScreenLoader