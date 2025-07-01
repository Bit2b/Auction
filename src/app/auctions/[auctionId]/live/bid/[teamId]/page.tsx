'use client';

import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Timer,
  DollarSign,
  Gavel,
  Users,
  Trophy,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  Target,
  User,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../../../../../../convex/_generated/dataModel';
import { api } from '../../../../../../../convex/_generated/api';
// Quick bid amounts (in thousands)
const QUICK_BID_AMOUNTS = [10, 25, 50, 100, 250, 500];

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
              {player.name}
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
          <Label className="text-sm font-medium text-muted-foreground">Preferences</Label>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{player.preference1}</Badge>
            <Badge variant="outline" className="text-xs">{player.preference2}</Badge>
            <Badge variant="outline" className="text-xs">{player.preference3}</Badge>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Achievements</Label>
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
                <span className="font-medium">{bid.teamName}</span>
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

// Team Status Component
const TeamStatus = ({ team, isCurrentBidder }: { team: any; isCurrentBidder: boolean }) => {
  return (
    <Card className={`${isCurrentBidder ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy size={18} />
            {team.teamName}
          </span>
          {isCurrentBidder && (
            <Badge variant="default" className="animate-pulse">
              Current Bidder
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Coins Left</span>
          <span className="font-bold text-lg">₹{team.coinsLeft.toLocaleString()}k</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Players Owned</span>
          <span className="font-medium">{team.totalPlayers}</span>
        </div>
        <Progress
          value={(team.coinsLeft / team.totalCoins) * 100}
          className="h-2"
        />
      </CardContent>
    </Card>
  );
};

export default function AuctionBiddingPage() {
  const [bidAmount, setBidAmount] = useState('');
  const [customBid, setCustomBid] = useState('');
  const params = useParams();
  
  const auctionId = params?.auctionId as Id<'auctions'>;
  const teamId = params?.teamId as Id<'teams'>;
  console.log(params,auctionId,teamId);

  // Queries
  const auctionDashboard = useQuery(api.currentAuctions.getAuctionDashboard,
    auctionId ? { auctionId } : "skip"
  );
  const auction = useQuery(api.auctions.getAuctionById,
    auctionId ? { auctionId } : "skip"
  );
  const team = useQuery(api.teams.getTeam,
    teamId ? { teamId } : "skip"
  );
  const upcomingPlayers = useQuery(api.currentAuctions.getPlayerQueue,
    auctionId ? { auctionId, limit: 5 } : "skip"
  );

  // Mutations
  const placeBid = useMutation(api.currentAuctions.placeBid);

  // Auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-fetch by accessing the query
      if (auctionDashboard) {
        // Data will automatically refresh due to Convex reactivity
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionDashboard]);

  const handlePlaceBid = async (amount: number) => {
    if (!teamId || !team) {
      toast.error('Team information not found');
      return;
    }

    if (amount > team.coinsLeft) {
      toast.error('Insufficient coins');
      return;
    }

    if (auctionDashboard?.currentBid && amount <= auctionDashboard.currentBid) {
      toast.error('Bid must be higher than current bid');
      return;
    }

    toast.promise(
      placeBid({
        auctionId,
        teamId,
        amount
      }),
      {
        loading: 'Placing bid...',
        success: `Bid placed: ₹${amount.toLocaleString()}k`,
        error: 'Failed to place bid'
      }
    );
  };

  const handleQuickBid = (amount: number) => {
    const bidValue = auctionDashboard?.currentBid ?
      auctionDashboard.currentBid + amount :
      amount;
    handlePlaceBid(bidValue);
  };

  const handleCustomBid = () => {
    const amount = parseInt(customBid);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    handlePlaceBid(amount);
    setCustomBid('');
  };

  if (!auctionId || !teamId) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Invalid URL</h1>
          <p className="text-muted-foreground">
            Please check the auction and team IDs in the URL.
          </p>
        </div>
      </div>
    );
  }

  if (auction === undefined || auctionDashboard === undefined || team === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (auction === null || team === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="text-muted-foreground">
            The auction or team you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const isAuctionActive = auctionDashboard?.status === 'running';
  const currentPlayer = auctionDashboard?.currentPlayer;
  const currentBid = auctionDashboard?.currentBid;
  const timeRemaining = auctionDashboard?.timeRemaining || 0;
  const isCurrentBidder = team._id === auctionDashboard?.teams?.find(t => t.isCurrentBidder)?.teamId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {auction.auctionName}
          </h1>
          <p className="text-muted-foreground">
            Bidding as <span className="font-semibold text-blue-600">{team.teamName}</span>
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
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
                          {isCurrentBidder && (
                            <Badge variant="default" className="animate-pulse">
                              <Zap size={12} className="mr-1" />
                              You're the highest bidder!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bidding Controls */}
                {isAuctionActive && timeRemaining > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target size={18} />
                        Place Your Bid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quick Bid Buttons */}
                      <div>
                        <Label className="text-sm font-medium">Quick Bid (+amount)</Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                          {QUICK_BID_AMOUNTS.map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              onClick={() => handleQuickBid(amount)}
                              disabled={team.coinsLeft < (currentBid || 0) + amount}
                              className="text-sm"
                            >
                              +₹{amount}k
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Custom Bid */}
                      <div>
                        <Label className="text-sm font-medium">Custom Bid</Label>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Enter amount in thousands"
                              value={customBid}
                              onChange={(e) => setCustomBid(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <Button
                            onClick={handleCustomBid}
                            disabled={!customBid || team.coinsLeft < parseInt(customBid || '0')}
                            className="px-6"
                          >
                            <Gavel size={16} className="mr-2" />
                            Bid
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount in thousands (e.g., 100 = ₹100k)
                        </p>
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
            {/* Team Status */}
            <TeamStatus team={team} isCurrentBidder={isCurrentBidder} />

            {/* All Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} />
                  All Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auctionDashboard?.teams?.map((auctionTeam) => (
                    <div
                      key={auctionTeam.teamId}
                      className={`p-3 rounded-lg border ${auctionTeam.teamId === team._id ? 'bg-blue-50 border-blue-200' : 'bg-muted'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {auctionTeam.teamName}
                          {auctionTeam.isCurrentBidder && (
                            <Badge variant="default" className="ml-2 text-xs">Leading</Badge>
                          )}
                        </span>
                        <span className="text-sm font-mono">
                          ₹{auctionTeam.coinsLeft.toLocaleString()}k
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Players */}
            {upcomingPlayers && upcomingPlayers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={18} />
                    Coming Up Next
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingPlayers.slice(0, 3).map((player, index) => (
                      <div key={player?._id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{player?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {player?.year} • {player?.preference1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}