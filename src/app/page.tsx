'use client';

import { useUser } from "@clerk/nextjs";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Gavel, Users, User } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const { user } = useUser();

  const navigationCards = [
    {
      title: "All Auctions",
      icon: <Gavel className="h-8 w-8" />,
      href: "/auctions",
      description: "Manage and monitor auction activities"
    },
    {
      title: "My Auctions",
      icon: <Users className="h-8 w-8" />,
      href: `/myAuctions`,
      description: "View and manage team information"
    },
    {
      title: "Teams",
      icon: <User className="h-8 w-8" />,
      href: "/teams",
      description: "Browse and manage player profiles"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      
      <div className="container mx-auto py-12 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Home className="h-9 w-9" />
            Auction Dashboard Home
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to the auction management system. Navigate to different sections using the cards below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {navigationCards.map((card) => (
            <Link key={card.title} href={card.href} passHref>
              <Card className="transition-all hover:shadow-lg hover:border-primary/50 h-full flex flex-col cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                      {card.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground mt-2 pl-1">
                    {card.description}
                  </p>
                  <div className="mt-4 text-right">
                    <span className="inline-flex items-center text-primary font-medium group-hover:underline">
                      Go to {card.title}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="ml-2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}