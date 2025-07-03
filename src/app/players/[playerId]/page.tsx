'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Calendar,
  GraduationCap,
  Trophy,
  Target,
  DollarSign,
  Users,
  Gavel
} from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();

  const playerId = params.playerId as Id<'players'>;

  // Fetch player data
  const player = useQuery(api.players.getPlayer, { playerId });

  // Fetch auction data to get auction details
  const auction = useQuery(
    api.auctions.getAuctionById,
    player ? { auctionId: player.auctionId } : "skip"
  );

  // Fetch team data if player is sold
  const team = useQuery(
    api.teams.getTeam,
    player?.teamId ? { teamId: player.teamId } : "skip"
  );

  // Branch colors
  const branchColors: Record<string, string> = {
    CSE: 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    DSAI: 'bg-purple-500/20 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    ECE: 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };

  // Loading state
  if (!player) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
          <p className="text-muted-foreground">Player Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Player Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </Label>
                  <p className="mt-1 text-foreground font-medium">{player.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Year
                  </Label>
                  <p className="mt-1 text-foreground">{player.year}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Branch
                  </Label>
                  <div className="mt-1">
                    <Badge className={branchColors[player.branch]}>
                      {player.branch}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={player.isSold
                      ? 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }>
                      {player.isSold ? 'Sold' : 'Available'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preferences */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4" />
                  Preferences
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">First Preference</Label>
                    <p className="mt-1 text-foreground">{player.preference1}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Second Preference</Label>
                    <p className="mt-1 text-foreground">{player.preference2}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Third Preference</Label>
                    <p className="mt-1 text-foreground">{player.preference3}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Achievements */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4" />
                  Achievements
                </Label>
                <p className="text-foreground whitespace-pre-wrap">
                  {player.achievement || 'No achievements listed'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Auction Info */}
          {auction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Auction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Auction Name</Label>
                    <p className="text-sm font-medium text-foreground">{auction.auctionName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={
                        auction.status === 'live'
                          ? 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : auction.status === 'registering'
                            ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : auction.status === 'ended'
                              ? 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }>
                        {auction.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/auctions/${auction._id}`)}
                    className="w-full"
                  >
                    View Auction
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bidding Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bidding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Bid</Label>
                  <p className="text-2xl font-bold text-foreground">
                    {player.currentBid ? `₹${player.currentBid}` : 'No bids yet'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={player.isSold
                      ? 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }>
                      {player.isSold ? 'Sold' : 'Available'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Info (if sold) */}
          {player.isSold && team && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Team Name</Label>
                    <p className="text-sm font-medium text-foreground">{team.teamName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Final Bid</Label>
                    <p className="text-xl font-bold text-foreground">₹{player.currentBid}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teams/${team._id}`)}
                    className="w-full"
                  >
                    View Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}