import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";

const Topbar = () => {
  return (
    <div>
      <header className="flex justify-between items-center px-12 py-4 gap-4 h-16 bg-sidebar/50 rounded-2xl shadow-md border border-white/10">
        <h1 className="text font-sans text-lg tracking-widest">
          IIITNR AUCTIONS
        </h1>
        <div className="flex justify-end">
          <ModeToggle />
          <Separator orientation='vertical' />
          <SignedOut>
            <SignInButton>
              <Button asChild variant={'outline'}>
                <span>Sign In</span>
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button asChild variant={'outline'}>
                <span>Sign Up</span>
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
    </div>
  )
}

export default Topbar