// app/teams/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
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
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Home } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';

export default function TeamsPage() {
  const router = useRouter();
  const [auctionFilter, setAuctionFilter] = useState<string>('all');
  const [newTeam, setNewTeam] = useState({
    auctionId: '',
    teamName: '',
    owners: '',
    coinsLeft: 0,
    totalCoins: 0,
    TotalPlayers: 0,
    playerIds: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch data
  const auctions = useQuery(api.auctions.getAllAuctions);
  const allTeams = useQuery(api.teams.getAllTeams);
  const teamsByAuction = useQuery(api.teams.getTeamsByAuction, 
    auctionFilter !== 'all' ? { auctionId: auctionFilter } : "skip"
  );

  // Create team mutation
  const createTeam = useMutation(api.teams.createTeam);

  // Determine which teams to show
  let teams = [];
  if (auctionFilter === 'all') {
    teams = allTeams || [];
  } else {
    teams = teamsByAuction || [];
  }

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!newTeam.teamName || !newTeam.auctionId) {
      toast.error('Team name and auction are required');
      return;
    }

    toast.promise(createTeam({
      ...newTeam,
      owners: newTeam.owners.split(',').map(owner => owner.trim()).filter(owner => owner),
      auctionId: newTeam.auctionId as any, // Type workaround
    }), {
      loading: 'Creating team...',
      success: () => {
        setIsCreating(false);
        setNewTeam({
          auctionId: '',
          teamName: '',
          owners: '',
          coinsLeft: 0,
          totalCoins: 0,
          TotalPlayers: 0,
          playerIds: [],
        });
        return 'Team created successfully!';
      },
      error: 'Failed to create team',
    });
  };

  // Handle card click to navigate to team detail page (if implemented)
  const handleCardClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams Management</h1>
          <p className="text-muted-foreground">
            View and manage all teams across auctions
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
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Team
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">Filter by auction:</span>
            <Select
              value={auctionFilter}
              onValueChange={setAuctionFilter}
            >
              <SelectTrigger className="min-w-[180px] bg-background">
                <SelectValue placeholder="Select Auction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auctions</SelectItem>
                {auctions?.map(auction => (
                  <SelectItem key={auction._id} value={auction._id}>
                    {auction.auctionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Create New Team
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={newTeam.teamName}
                onChange={(e) => setNewTeam({...newTeam, teamName: e.target.value})}
                placeholder="Enter team name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auctionId">Auction *</Label>
              <Select
                value={newTeam.auctionId}
                onValueChange={(value) => setNewTeam({...newTeam, auctionId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auction" />
                </SelectTrigger>
                <SelectContent>
                  {auctions?.map(auction => (
                    <SelectItem key={auction._id} value={auction._id}>
                      {auction.auctionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owners">Owners (comma separated)</Label>
              <Input
                id="owners"
                value={newTeam.owners}
                onChange={(e) => setNewTeam({...newTeam, owners: e.target.value})}
                placeholder="Owner1, Owner2, ..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCoins">Total Coins</Label>
                <Input
                  id="totalCoins"
                  type="number"
                  value={newTeam.totalCoins}
                  onChange={(e) => setNewTeam({...newTeam, totalCoins: Number(e.target.value)})}
                  placeholder="Total coins"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coinsLeft">Coins Left</Label>
                <Input
                  id="coinsLeft"
                  type="number"
                  value={newTeam.coinsLeft}
                  onChange={(e) => setNewTeam({...newTeam, coinsLeft: Number(e.target.value)})}
                  placeholder="Coins left"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </div>
        </DialogContent>
      </Dialog>

      {!allTeams && !teamsByAuction ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Team Cards */}
          {teams.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-2xl text-foreground font-medium mb-2">
                  No teams available
                </div>
                <p className="text-muted-foreground text-center">
                  {auctionFilter === 'all' 
                    ? "No teams found across all auctions" 
                    : "No teams found for the selected auction"}
                </p>
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => {
              const auction = auctions?.find(a => a._id === team.auctionId);
              return (
                <Card
                  key={team._id}
                  onClick={() => handleCardClick(team._id)}
                  className="transition-all hover:shadow-lg hover:border-primary/30 border cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-foreground group-hover:text-primary">
                        {team.teamName}
                      </CardTitle>
                      <Badge className="bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {auction?.auctionName || 'No Auction'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Owners</div>
                        <div className="text-sm text-foreground font-medium">
                          {team.owners.join(', ') || 'No owners'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Coins</div>
                          <div className="text-lg font-bold text-foreground">
                            {team.coinsLeft} / {team.totalCoins}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Players</div>
                          <div className="text-lg font-bold text-foreground">
                            {team.playerIds.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Create New Team Card */}
          <Card
            onClick={() => setIsCreating(true)}
            className="transition-all hover:shadow-lg hover:border-primary/30 border cursor-pointer group border-dashed bg-muted/10"
          >
            <CardHeader>
              <CardTitle className="text-foreground group-hover:text-primary flex items-center gap-2">
                <PlusCircle className="h-6 w-6" />
                Create New Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-center text-muted-foreground">
                  Click here to create a new team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}