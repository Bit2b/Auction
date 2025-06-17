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
      <header className="flex justify-end items-center p-4 gap-4 h-16 bg-sidebar">
        <ModeToggle />
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
      </header>
      <Separator />
    </div>
  )
}

export default Topbar