"use client";

import { ReactNode } from "react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ClerkProvider, SignIn, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import FullScreenLoader from "@/components/FullScreenLoader";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (<ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
    <ConvexProviderWithClerk
      useAuth={useAuth}
      client={convex}
    >
      <Authenticated>
        {children}
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <SignIn routing="hash" />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <FullScreenLoader label="Auth Loading..." />
      </AuthLoading>
    </ConvexProviderWithClerk>
  </ClerkProvider>
  );
}