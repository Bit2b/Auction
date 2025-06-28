// app/teams/[teamId]/page.tsx
'use client';

import { useQuery, useMutation } from 'convex/react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, Plus, ArrowLeft, User, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../../convex/_generated/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Id } from '../../../../convex/_generated/dataModel';

// Reusable TrashButton component
const TrashButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
  >
    <Trash2 size={16} />
  </Button>
);

// Reusable AddButton component
const AddButton = ({ onClick, disabled }: { onClick: () => void, disabled?: boolean }) => (
  <Button
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-1"
  >
    <Plus size={16} /> Add
  </Button>
);

// Reusable UpdateButton component
const UpdateButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="flex items-center gap-1"
  >
    <Pencil size={16} /> Update Details
  </Button>
);

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedTeam, setUpdatedTeam] = useState({
    teamName: '',
    owners: [] as string[],
    coinsLeft: 0,
    totalCoins: 0,
  });
  const [newOwner, setNewOwner] = useState('');
  const [newPlayerId, setNewPlayerId] = useState('');
  const [auctions, setAuctions] = useState<any[]>([]);

  // Get teamId from route parameters and cast it as a Convex ID
  useEffect(() => {
    if (params && params.teamId) {
      const rawTeamId = params.teamId as string;
      // Convex IDs are typically alphanumeric strings, so we just need basic validation
      if (rawTeamId && rawTeamId.length > 0) {
        setTeamId(rawTeamId as Id<"teams">);
      } else {
        console.error('Invalid team ID format:', rawTeamId);
        router.push('/teams');
      }
    }
  }, [params, router]);

  const team = useQuery(api.teams.getTeamWithPlayers,
    teamId ? { teamId } : "skip"
  );

  const allAuctions = useQuery(api.auctions.getAllAuctions);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const updateTeam = useMutation(api.teams.updateTeam);
  const addPlayerToTeam = useMutation(api.teams.addPlayerToTeam);
  const removePlayerFromTeam = useMutation(api.teams.removePlayerFromTeam);
  const updateTeamCoins = useMutation(api.teams.updateTeamCoins);

  // Initialize form when team data is available
  useEffect(() => {
    if (team && !isEditing) {
      setUpdatedTeam({
        teamName: team.teamName,
        owners: [...team.owners],
        coinsLeft: team.coinsLeft,
        totalCoins: team.totalCoins,
      });
    }

    if (allAuctions) {
      setAuctions(allAuctions);
    }
  }, [team, isEditing, allAuctions]);

  // Get auction name
  const getAuctionName = (auctionId: string) => {
    return auctions.find(a => a._id === auctionId)?.auctionName || 'Unknown Auction';
  };

  const handleDelete = async () => {
    if (!teamId) return;

    toast.promise(deleteTeam({ teamId }), {
      loading: 'Deleting team...',
      success: () => {
        router.push('/teams');
        return 'Team deleted successfully';
      },
      error: 'Failed to delete team',
    });
  };

  const handleUpdate = async () => {
    if (!teamId || !team) return;

    toast.promise(updateTeam({
      teamId,
      ...updatedTeam
    }), {
      loading: 'Updating team details...',
      success: () => {
        setIsEditing(false);
        return 'Team updated successfully';
      },
      error: 'Failed to update team',
    });
  };

  const handleAddOwner = () => {
    if (!newOwner.trim()) return;
    setUpdatedTeam({
      ...updatedTeam,
      owners: [...updatedTeam.owners, newOwner.trim()]
    });
    setNewOwner('');
  };

  const handleRemoveOwner = (index: number) => {
    const updatedOwners = [...updatedTeam.owners];
    updatedOwners.splice(index, 1);
    setUpdatedTeam({
      ...updatedTeam,
      owners: updatedOwners
    });
  };

  const handleAddPlayer = async () => {
    if (!teamId || !newPlayerId.trim()) return;

    toast.promise(addPlayerToTeam({
      teamId,
      playerId: newPlayerId.trim()
    }), {
      loading: 'Adding player to team...',
      success: () => {
        setNewPlayerId('');
        return 'Player added successfully';
      },
      error: 'Failed to add player',
    });
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!teamId) return;

    toast.promise(removePlayerFromTeam({
      teamId,
      playerId
    }), {
      loading: 'Removing player from team...',
      success: 'Player removed successfully',
      error: 'Failed to remove player',
    });
  };

  const handleUpdateCoins = async (field: 'coinsLeft' | 'totalCoins', value: number) => {
    if (!teamId) return;

    toast.promise(updateTeamCoins({
      teamId,
      coinsLeft: field === 'coinsLeft' ? value : team?.coinsLeft || 0
    }), {
      loading: 'Updating coins...',
      success: 'Coins updated successfully',
      error: 'Failed to update coins',
    });
  };

  if (team === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The team you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/teams')}>
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        onClick={() => router.push('/teams')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Back to Teams
      </Button>

      {!team ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {team.teamName}
              </h1>
              <Badge className="bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mt-2">
                {getAuctionName(team.auctionId)}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <UpdateButton onClick={() => { }} />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Pencil size={18} /> Update Team Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input
                        id="teamName"
                        value={updatedTeam.teamName}
                        onChange={(e) => setUpdatedTeam({ ...updatedTeam, teamName: e.target.value })}
                        placeholder="Team name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Owners</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                          placeholder="Add new owner"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddOwner()}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddOwner}
                          disabled={!newOwner.trim()}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      {updatedTeam.owners.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {updatedTeam.owners.map((owner, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-1 px-2 bg-muted/30 rounded"
                            >
                              <span>{owner}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOwner(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalCoins">Total Coins</Label>
                        <Input
                          id="totalCoins"
                          type="number"
                          value={updatedTeam.totalCoins}
                          onChange={(e) => setUpdatedTeam({
                            ...updatedTeam,
                            totalCoins: Number(e.target.value)
                          })}
                          placeholder="Total coins"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coinsLeft">Coins Left</Label>
                        <Input
                          id="coinsLeft"
                          type="number"
                          value={updatedTeam.coinsLeft}
                          onChange={(e) => setUpdatedTeam({
                            ...updatedTeam,
                            coinsLeft: Number(e.target.value)
                          })}
                          placeholder="Coins left"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} className="flex items-center gap-1">
                      <Pencil size={16} /> Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-1">
                    <Trash2 size={16} /> Delete Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trash2 size={18} /> Confirm Deletion
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-foreground">
                      Are you sure you want to delete the team <span className="font-bold">"{team.teamName}"</span>?
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-1">
                        <Trash2 size={16} /> Delete Team
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Coins size={20} /> Coins Management
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Coins</div>
                    <div className="text-2xl font-bold text-foreground">
                      {team.totalCoins}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newValue = prompt("Enter new total coins", team.totalCoins.toString());
                      if (newValue) {
                        handleUpdateCoins('totalCoins', Number(newValue));
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Coins Left</div>
                    <div className="text-2xl font-bold text-foreground">
                      {team.coinsLeft}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newValue = prompt("Enter new coins left", team.coinsLeft.toString());
                      if (newValue) {
                        handleUpdateCoins('coinsLeft', Number(newValue));
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>

                <div className="pt-4">
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(team.coinsLeft / team.totalCoins) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 text-center">
                    {team.coinsLeft} / {team.totalCoins} coins remaining
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <User size={20} /> Owners
              </h2>
              {team.owners.length > 0 ? (
                <ul className="space-y-2">
                  {team.owners.map((owner, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md text-foreground"
                    >
                      <span className="truncate">{owner}</span>
                      <TrashButton onClick={() => handleRemoveOwner(index)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No owners assigned
                </p>
              )}
            </Card>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Players</h2>
            </div>

            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={newPlayerId}
                  onChange={(e) => setNewPlayerId(e.target.value)}
                  placeholder="Add player by ID"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <AddButton
                  onClick={handleAddPlayer}
                  disabled={!newPlayerId.trim()}
                />
              </div>
            </div>

            {team.players.length > 0 ? (
              <ul className="space-y-2">
                {team.players.map((player, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md text-foreground"
                  >
                    <div>
                      <div className="font-medium">{player?.name || `Player ${index + 1}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {/* {player?.role} | {player?.country} */}
                      </div>
                    </div>
                    <TrashButton onClick={() => handleRemovePlayer(player?._id || '')} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No players in this team
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}