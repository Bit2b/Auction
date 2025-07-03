'use client';

import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Users,
  Coins,
  User,
  ArrowLeft,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export default function TeamViewPage() {
  const router = useRouter();
  const params = useParams();

  // Get teamId from route parameters and cast to proper ID type
  const teamId = params?.teamId as Id<'teams'> | undefined;

  const team = useQuery(api.teams.getTeam,
    teamId ? { teamId } : "skip"
  );

  // Get current user - adjust this based on your auth implementation
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get auction details
  const auction = useQuery(api.auctions.getAuctionById,
    team ? { auctionId: team.auctionId } : "skip"
  );

  // Get team owner details
  const teamOwner = useQuery(api.users.getUserById,
    team ? { userId: team.ownerId } : "skip"
  );

  // Get team players
  const teamPlayers = useQuery(api.players.getPlayersByTeam,
    teamId ? { teamId } : "skip"
  );

  // Get team statistics
  const teamStats = useQuery(api.teams.getTeamStats,
    teamId ? { teamId } : "skip"
  );

  // Get all teams in the auction for ranking
  const allTeams = useQuery(api.teams.getTeamsByAuction,
    team ? { auctionId: team.auctionId } : "skip"
  );

  // Check if current user is the team owner
  const isTeamOwner = currentUser && team &&
    (currentUser.userId === team.ownerId);

  // Check if current user is the auctioneer
  const isAuctioneer = currentUser && auction &&
    (currentUser.userId === auction.auctioneer);

  // Calculate team ranking by total spent
  const getTeamRanking = () => {
    if (!allTeams || !team) return null;

    const teamsWithSpent = allTeams.map(t => ({
      ...t,
      totalSpent: t.totalCoins - t.coinsLeft
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    const rank = teamsWithSpent.findIndex(t => t._id === team._id) + 1;
    return { rank, total: teamsWithSpent.length };
  };

  const ranking = getTeamRanking();

  const handleViewAuction = () => {
    if (team) {
      router.push(`/auctions/${team.auctionId}`);
    }
  };

  const handleLiveBidding = () => {
    if (team && auction?.status === 'live') {
      router.push(`/auctions/${team.auctionId}/live/bid/${teamId}`);
    }
  };

  const handlePlayerClick = (playerId: string) => {
    router.push(`/players/${playerId}`);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString();
  };

  // Get branch color
  const getBranchColor = (branch: string) => {
    switch (branch) {
      case 'CSE':
        return 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/50';
      case 'DSAI':
        return 'bg-purple-500/20 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-500/50';
      case 'ECE':
        return 'bg-orange-500/20 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-500/50';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-500/50';
    }
  };

  // Loading state
  if (team === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>

          <div className="space-y-8">
            <div>
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
              </div>
              <div>
                <Skeleton className="h-64" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Team not found
  if (team === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The team you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/teams')}>
            View All Teams
          </Button>
        </div>
      </div>
    );
  }

  // Render action buttons
  const renderActionButtons = () => {
    if (isTeamOwner && auction?.status === 'live') {
      return (
        <Button
          onClick={handleLiveBidding}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
        >
          <Activity size={18} />
          Live Bidding
        </Button>
      );
    }

    return (
      <Button
        onClick={handleViewAuction}
        size="lg"
        variant="outline"
        className="px-6 py-3 flex items-center gap-2"
      >
        <Calendar size={18} />
        View Auction
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-bold text-primary text-xl">
                    {team.teamName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {team.teamName}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm py-1 px-3">
                  {auction?.auctionName || 'Unknown Auction'}
                </Badge>
                {ranking && (
                  <Badge
                    variant="outline"
                    className="text-sm py-1 px-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
                  >
                    <Trophy size={12} className="mr-1" />
                    Rank #{ranking.rank} of {ranking.total}
                  </Badge>
                )}
              </div>
            </div>

            {renderActionButtons()}
          </div>

          <p className="text-muted-foreground mt-3 text-lg">
            Owned by {teamOwner?.name || team.ownerId}
            {isTeamOwner && (
              <span className="ml-2 text-primary font-medium">
                · This is your team
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Statistics Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={24} />
                Team Statistics
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span className="text-sm font-medium">PLAYERS</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {team.totalPlayers}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coins size={16} />
                    <span className="text-sm font-medium">COINS LEFT</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(team.coinsLeft)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target size={16} />
                    <span className="text-sm font-medium">SPENT</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(team.totalCoins - team.coinsLeft)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp size={16} />
                    <span className="text-sm font-medium">AVG COST</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {team.totalPlayers > 0
                      ? formatCurrency(Math.round((team.totalCoins - team.coinsLeft) / team.totalPlayers))
                      : '0'
                    }
                  </div>
                </div>
              </div>

              {/* Progress bar for budget utilization */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Budget Utilization</span>
                  <span className="text-sm font-bold">
                    {Math.round(((team.totalCoins - team.coinsLeft) / team.totalCoins) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((team.totalCoins - team.coinsLeft) / team.totalCoins) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </Card>

            {/* Players Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Users size={24} />
                Team Players ({team.totalPlayers})
              </h2>

              {teamPlayers && teamPlayers.length > 0 ? (
                <div className="space-y-4">
                  {teamPlayers.map((player, index) => (
                    <div
                      key={player._id}
                      className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePlayerClick(player._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-lg">
                              {player.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Year: {player.year}</span>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getBranchColor(player.branch)}`}
                              >
                                {player.branch}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(player.currentBid || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Purchase Price
                          </div>
                        </div>
                      </div>

                      {/* Player preferences */}
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="text-sm text-muted-foreground mb-2">Preferences:</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            1. {player.preference1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            2. {player.preference2}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            3. {player.preference3}
                          </Badge>
                        </div>
                      </div>

                      {/* Achievement */}
                      {player.achievement && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <div className="text-sm text-muted-foreground mb-1">Achievement:</div>
                          <div className="text-sm">{player.achievement}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No players acquired yet
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-1">
                    {auction?.status === 'live'
                      ? 'Start bidding to add players to your team!'
                      : 'Players will appear here once the auction begins.'
                    }
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Actions Card - Show when auction is live and user is team owner */}
            {auction?.status === 'live' && isTeamOwner && (
              <Card className="p-6 border-green-500/20 bg-green-50/50 dark:bg-green-900/10">
                <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Activity size={20} />
                  Live Bidding
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  The auction is live! Start bidding on players to build your team.
                </p>
                <Button
                  onClick={handleLiveBidding}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Activity size={16} className="mr-2" />
                  Start Bidding
                </Button>
              </Card>
            )}

            {/* Team Details Card */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Team Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Team Owner</div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {teamOwner?.name || team.ownerId}
                      {isTeamOwner && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Auction</div>
                    <div className="font-semibold text-foreground">
                      {auction?.auctionName || 'Loading...'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Coins size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="font-semibold text-foreground">
                      {formatCurrency(team.totalCoins)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Trophy size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Team Rank</div>
                    <div className="font-semibold text-foreground">
                      {ranking ? `#${ranking.rank} of ${ranking.total}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Budget Breakdown Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Budget Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="font-semibold">{formatCurrency(team.totalCoins)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Spent</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(team.totalCoins - team.coinsLeft)}
                  </span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(team.coinsLeft)}
                    </span>
                  </div>
                </div>
                {team.totalPlayers > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Avg per Player</span>
                      <span className="font-semibold text-sm">
                        {formatCurrency(Math.round((team.totalCoins - team.coinsLeft) / team.totalPlayers))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Auction Status Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Auction Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${auction?.status === 'live' ? 'bg-green-500' :
                      auction?.status === 'registering' ? 'bg-blue-500' :
                        auction?.status === 'ended' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                  <span className="font-medium">
                    {auction?.status === 'live' && 'Live Now'}
                    {auction?.status === 'registering' && 'Registration Open'}
                    {auction?.status === 'ended' && 'Ended'}
                    {auction?.status === 'idle' && 'Scheduled'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {auction?.status === 'live' && 'The auction is currently in progress.'}
                  {auction?.status === 'registering' && 'Teams can still register for this auction.'}
                  {auction?.status === 'ended' && 'This auction has been completed.'}
                  {auction?.status === 'idle' && 'The auction is scheduled but has not started yet.'}
                </p>
                <Button
                  onClick={handleViewAuction}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  View Auction Details
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}