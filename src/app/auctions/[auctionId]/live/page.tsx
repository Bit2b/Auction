'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Timer,
  Gavel,
  Users,
  Trophy,
  Clock,
  AlertCircle,
  User,
  Star,
  Eye,
  ExternalLink
} from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

// Countdown Timer Component
const CountdownTimer = ({ timeRemaining }: { timeRemaining: number }) => {
  const [time, setTime] = useState(timeRemaining);

  useEffect(() => {
    setTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (time <= 0) return;

    const interval = setInterval(() => {
      setTime(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = timeRemaining > 0 ? (time / timeRemaining) * 100 : 0;
  const isLowTime = time < 10000;
  const isVeryLowTime = time < 5000;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={18} />
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        <div className={`text-2xl font-mono font-bold ${isVeryLowTime ? 'text-red-500 animate-pulse' :
          isLowTime ? 'text-orange-500' :
            'text-green-500'
          }`}>
          {formatTime(time)}
        </div>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isVeryLowTime ? 'bg-red-100' : isLowTime ? 'bg-orange-100' : 'bg-green-100'}`}
      />
    </div>
  );
};

// Player Display Component
const PlayerCard = ({ player }: { player: any }) => {
  if (!player) return null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <User size={24} />
              <Link
                href={`/players/${player._id}`}
                className="hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                {player.name}
                <ExternalLink size={16} className="opacity-50" />
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{player.year} Year</span>
              <span>•</span>
              <Badge variant="outline">{player.branch}</Badge>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Star size={12} className="mr-1" />
            {player.preference1}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium text-muted-foreground">Preferences</span>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{player.preference1}</Badge>
            <Badge variant="outline" className="text-xs">{player.preference2}</Badge>
            <Badge variant="outline" className="text-xs">{player.preference3}</Badge>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-muted-foreground">Achievements</span>
          <p className="text-sm mt-1 bg-muted p-2 rounded">{player.achievement}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Bid History Component
const BidHistory = ({ bidHistory }: { bidHistory: any[] }) => {
  if (!bidHistory || bidHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No bids placed yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={18} />
          Bid History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bidHistory.map((bid, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <Link
                  href={`/teams/${bid.teamId}`}
                  className="font-medium hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  {bid.teamName}
                  <ExternalLink size={12} className="opacity-50" />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600">
                  ₹{bid.amount.toLocaleString()}k
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(bid.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AuctionViewOnlyPage() {
  const params = useParams();

  const auctionId = params?.auctionId as Id<'auctions'>;

  // Queries
  const auctionDashboard = useQuery(api.currentAuctions.getAuctionDashboard,
    auctionId ? { auctionId } : "skip"
  );
  const auction = useQuery(api.auctions.getAuctionById,
    auctionId ? { auctionId } : "skip"
  );

  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (auctionDashboard) {
        // Data will automatically refresh due to Convex reactivity
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionDashboard]);

  if (!auctionId) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Invalid URL</h1>
          <p className="text-muted-foreground">
            Please check the auction ID in the URL.
          </p>
        </div>
      </div>
    );
  }

  if (auction === undefined || auctionDashboard === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (auction === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Auction Not Found</h1>
          <p className="text-muted-foreground">
            The auction you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const isAuctionActive = auctionDashboard?.status === 'running';
  const currentPlayer = auctionDashboard?.currentPlayer;
  const currentBid = auctionDashboard?.currentBid;
  const timeRemaining = auctionDashboard?.timeRemaining || 0;
  const leadingTeam = auctionDashboard?.teams?.find(t => t.isCurrentBidder);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Eye size={24} className="text-blue-600" />
            <h1 className="text-4xl font-bold text-foreground">
              {auction.auctionName}
            </h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Live Auction View
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant={isAuctionActive ? 'default' : 'secondary'} className="text-sm">
              {auctionDashboard?.status?.toUpperCase() || 'IDLE'}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {auctionDashboard?.playersRemaining || 0} players remaining
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Player */}
            {currentPlayer ? (
              <div className="space-y-4">
                <PlayerCard player={currentPlayer} />

                {/* Countdown and Current Bid */}
                {isAuctionActive && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <CountdownTimer timeRemaining={timeRemaining} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Gavel size={18} />
                            <span className="text-sm font-medium">Current Bid</span>
                          </div>
                          <div className="text-3xl font-bold text-green-600">
                            {currentBid ? `₹${currentBid.toLocaleString()}k` : 'No bids'}
                          </div>
                          {leadingTeam && (
                            <Badge variant="default" className="animate-pulse">
                              <Trophy size={12} className="mr-1" />
                              <Link
                                href={`/teams/${leadingTeam.teamId}`}
                                className="hover:underline flex items-center gap-1"
                              >
                                {leadingTeam.teamName} leading
                                <ExternalLink size={10} className="opacity-50" />
                              </Link>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="space-y-4">
                    <Clock size={48} className="mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Active Auction</h3>
                    <p className="text-muted-foreground">
                      Waiting for the next player to be put up for auction...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bid History */}
            <BidHistory bidHistory={auctionDashboard?.bidHistory || []} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leading Team Highlight */}
            {leadingTeam && currentBid && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Trophy size={18} />
                    Leading Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      <Link
                        href={`/teams/${leadingTeam.teamId}`}
                        className="hover:text-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        {leadingTeam.teamName}
                        <ExternalLink size={16} className="opacity-50" />
                      </Link>
                    </div>
                    <div className="text-lg font-semibold text-green-700">
                      ₹{currentBid.toLocaleString()}k
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} />
                  Teams Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auctionDashboard?.teams?.map((team) => (
                    <div
                      key={team.teamId}
                      className={`p-3 rounded-lg border ${team.isCurrentBidder ? 'bg-blue-50 border-blue-200' : 'bg-muted'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          <Link
                            href={`/teams/${team.teamId}`}
                            className="hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                            {team.teamName}
                            <ExternalLink size={12} className="opacity-50" />
                          </Link>
                          {team.isCurrentBidder && (
                            <Badge variant="default" className="ml-2 text-xs">Leading</Badge>
                          )}
                        </span>
                        <span className="text-sm font-mono">
                          ₹{team.coinsLeft.toLocaleString()}k
                        </span>
                      </div>
                      <Progress
                        value={(team.coinsLeft / (auction.startingCoin || 1)) * 100}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}