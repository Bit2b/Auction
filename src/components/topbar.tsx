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
    <header className="flex justify-between items-center px-8 py-3 h-20 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg">
      {/* Brand Title */}
      <h1 className="text-xl font-semibold tracking-wide text-black dark:text-white drop-shadow-sm">
        IIITNR AUCTIONS
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Separator orientation="vertical" className="h-6 bg-white/20" />

        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Topbar;
