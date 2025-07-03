'use client';

import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Home, Users, Coins } from 'lucide-react';
import { api } from '../../../convex/_generated/api';

type TeamFilterType = 'all' | 'full' | 'empty';

// Helper functions moved outside component to avoid recreating on each render
const getBudgetStatusColor = (coinsLeft: number, totalCoins: number): string => {
  const percentage = totalCoins > 0 ? (coinsLeft / totalCoins) * 100 : 0;
  if (percentage > 75) return 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (percentage > 50) return 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  if (percentage > 25) return 'bg-orange-500/20 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
  return 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300';
};

const getBudgetStatus = (coinsLeft: number, totalCoins: number): string => {
  const percentage = totalCoins > 0 ? (coinsLeft / totalCoins) * 100 : 0;
  if (percentage > 75) return 'High Budget';
  if (percentage > 50) return 'Good Budget';
  if (percentage > 25) return 'Low Budget';
  return 'Critical Budget';
};

const filterTeams = (teams: any[], filterType: TeamFilterType) => {
  if (filterType === 'all') return teams;
  
  switch (filterType) {
    case 'full':
      return teams.filter(team => team.totalPlayers >= 10);
    case 'empty':
      return teams.filter(team => team.totalPlayers === 0);
    default:
      return teams;
  }
};

export default function TeamsPage() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<TeamFilterType>('all');
  const [selectedAuction, setSelectedAuction] = useState<string>('all');

  // Fetch all data upfront - no conditional hooks
  const allAuctions = useQuery(api.auctions.getAllAuctions);
  const allTeamsData = useQuery(api.teams.getAllTeams);
  const auctionTeams = useQuery(
    api.teams.getTeamsByAuction,
    selectedAuction !== 'all' ? { auctionId: selectedAuction as any } : "skip"
  );

  // Determine which teams to show using useMemo for optimization
  const teams = useMemo(() => {
    if (selectedAuction === 'all') {
      return allTeamsData || [];
    } else {
      return auctionTeams || [];
    }
  }, [selectedAuction, allTeamsData, auctionTeams]);

  // Get unique owner IDs - always call the same number of hooks
  const uniqueOwnerIds = useMemo(() => {
    return [...new Set(teams.map(team => team.ownerId).filter(Boolean))];
  }, [teams]);

  // Always call the same number of useQuery hooks by using a fixed array
  // This ensures hooks are called in the same order every time
  const MAX_OWNERS = 50; // Adjust based on your expected maximum
  const ownerQueries = Array.from({ length: MAX_OWNERS }, (_, index) => {
    const ownerId = uniqueOwnerIds[index];
    return useQuery(
      api.users.getUserById, 
      ownerId ? { userId: ownerId } : "skip"
    );
  });

  // Create owner lookup map
  const ownerLookup = useMemo(() => {
    return uniqueOwnerIds.reduce((acc, ownerId, index) => {
      if (ownerId && ownerQueries[index]) {
        acc[ownerId] = ownerQueries[index];
      }
      return acc;
    }, {} as Record<string, any>);
  }, [uniqueOwnerIds, ownerQueries]);

  // Helper function to get owner name
  const getOwnerName = (ownerId: string): string => {
    const owner = ownerLookup[ownerId];
    return owner?.name || owner?.email || 'Unknown Owner';
  };

  // Apply filters using useMemo for performance
  const filteredTeams = useMemo(() => {
    return filterTeams(teams, filterType);
  }, [teams, filterType]);

  // Handle card click to navigate to team detail page
  const handleCardClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  const isLoading = !teams && !allTeamsData;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor team performance across auctions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">Auction:</span>
              <Select
                value={selectedAuction}
                onValueChange={setSelectedAuction}
              >
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Select Auction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Auctions</SelectItem>
                  {allAuctions?.map((auction) => (
                    <SelectItem key={auction._id} value={auction._id}>
                      {auction.auctionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">Filter:</span>
              <Select
                value={filterType}
                onValueChange={(value) => setFilterType(value as TeamFilterType)}
              >
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="full">Full Teams</SelectItem>
                  <SelectItem value="empty">Empty Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-2xl text-foreground font-medium mb-2">
                  No teams found
                </div>
                <p className="text-muted-foreground text-center">
                  {selectedAuction === 'all' 
                    ? `No teams match the "${filterType}" filter`
                    : `No teams found for the selected auction with "${filterType}" filter`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                ownerName={getOwnerName(team.ownerId)}
                onClick={() => handleCardClick(team._id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Separate component for team card to improve readability and performance
interface TeamCardProps {
  team: any;
  ownerName: string;
  onClick: () => void;
}

function TeamCard({ team, ownerName, onClick }: TeamCardProps) {
  const totalSpent = team.totalCoins - team.coinsLeft;
  const avgPerPlayer = team.totalPlayers > 0 
    ? Math.round(totalSpent / team.totalPlayers) 
    : 0;

  return (
    <Card
      onClick={onClick}
      className="transition-all hover:shadow-lg hover:border-primary/30 border cursor-pointer group"
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-foreground group-hover:text-primary">
            {team.teamName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Owner Information */}
          <div>
            <div className="text-xs text-muted-foreground">Owner</div>
            <div className="text-sm font-medium text-foreground mt-1">
              {ownerName}
            </div>
          </div>

          {/* Team Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3" />
                Coins Left
              </div>
              <div className="text-lg font-bold text-foreground">
                {team.coinsLeft.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Players
              </div>
              <div className="text-lg font-bold text-foreground">
                {team.totalPlayers}
              </div>
            </div>
          </div>

          {/* Spending Information */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Spent:</span>
              <span className="font-semibold text-foreground">
                {totalSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Total Budget:</span>
              <span className="font-semibold text-foreground">
                {team.totalCoins.toLocaleString()}
              </span>
            </div>
            {team.totalPlayers > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Avg per player:</span>
                <span className="text-xs font-medium text-foreground">
                  {avgPerPlayer.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}