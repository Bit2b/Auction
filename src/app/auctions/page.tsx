'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PlusCircle, Home } from 'lucide-react';
import { api } from '../../../convex/_generated/api';

type AuctionStatus = 'registering' | 'live' | 'ended' | 'idle' | 'all';

export default function AuctionsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<AuctionStatus>('all');

  // Fetch auction data using correct queries
  const liveAuctions = useQuery(api.auctions.getAuctionsByStatus, { status: 'live' });
  const allAuctions = useQuery(api.auctions.getAllAuctions);
  const auctionsByStatus = useQuery(api.auctions.getAuctionsByStatus,
    statusFilter !== 'all' && statusFilter !== 'live'
      ? { status: statusFilter }
      : "skip" as const
  );

  // Determine which data to show
  let auctions = [];
  if (statusFilter === 'all') {
    auctions = allAuctions || [];
  } else if (statusFilter === 'live') {
    auctions = liveAuctions || [];
  } else {
    auctions = auctionsByStatus || [];
  }

  const statusColors: Record<string, string> = {
    live: 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    registering: 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ended: 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    idle: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  // Format date strings
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch (e) {
      return dateString; // Fallback to raw string if invalid date
    }
  };

  // Handle card click to navigate to auction detail page
  const handleCardClick = (auctionId: string) => {
    router.push(`/auctions/${auctionId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Auctions Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor auction activities
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              onClick={() => router.push('/auctions/create')}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Auction
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">Filter status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AuctionStatus)}
            >
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auctions</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="registering">Registering</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!liveAuctions && !allAuctions && !auctionsByStatus ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-2xl text-foreground font-medium mb-2">
                  No auctions available
                </div>
                <p className="text-muted-foreground text-center">
                  There are no auctions in the "{statusFilter}" status
                </p>
              </CardContent>
            </Card>
          ) : (
            auctions.map((auction) => (
              <Card
                key={auction._id}
                onClick={() => handleCardClick(auction._id)}
                className="transition-all hover:shadow-lg hover:border-primary/30 border cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-foreground group-hover:text-primary">
                      {auction.auctionName}
                    </CardTitle>
                    <Badge className={`${statusColors[auction.status]} capitalize`}>
                      {auction.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Schedule</div>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground font-medium">Start:</span>
                          <span className="text-sm">{formatDate(auction.starting)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground font-medium">End:</span>
                          <span className="text-sm">{formatDate(auction.ending)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Teams</div>
                        <div className="text-lg font-bold text-foreground">
                          {auction.teams.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Requests</div>
                        <div className="text-lg font-bold text-foreground">
                          {auction.teamRequests.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card
            onClick={() => router.push('/auctions/create')}
            className="transition-all hover:shadow-lg hover:border-primary/30 border cursor-pointer group border-dashed bg-muted/10"
          >
            <CardHeader>
              <CardTitle className="text-foreground group-hover:text-primary flex items-center gap-2">
                <PlusCircle className="h-6 w-6" />
                Create New Auction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-muted-foreground">
                  Click here to set up a new auction
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}