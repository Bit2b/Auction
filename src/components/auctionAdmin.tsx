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
import { Trash2, Pencil, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

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

export default function AuctionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [updatedAuction, setUpdatedAuction] = useState({
    auctionName: '',
    starting: '',
    ending: '',
  });
  const [newTeam, setNewTeam] = useState('');

  // Get auctionId from route parameters and cast to proper ID type
  const auctionId = params?.auctionId as Id<'auctions'> | undefined;

  const auction = useQuery(api.auctions.getAuctionById,
    auctionId ? { auctionId } : "skip"
  );

  const deleteAuction = useMutation(api.auctions.deleteAuction);
  const updateAuction = useMutation(api.auctions.updateAuction);

  // Initialize form when auction data is available
  useEffect(() => {
    if (auction && !isEditing) {
      setUpdatedAuction({
        auctionName: auction.auctionName,
        starting: auction.starting,
        ending: auction.ending,
      });
    }
  }, [auction, isEditing]);

  // Format date strings
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy - hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const statusColors: Record<string, string> = {
    live: 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    registering: 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ended: 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    idle: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  const handleDelete = async () => {
    if (!auctionId) return;

    toast.promise(deleteAuction({ auctionId }), {
      loading: 'Deleting auction...',
      success: () => {
        router.push('/auctions');
        return 'Auction deleted successfully';
      },
      error: 'Failed to delete auction',
    });
  };

  const handleUpdate = async () => {
    if (!auctionId || !auction) return;

    // Validate dates
    if (updatedAuction.starting && updatedAuction.ending) {
      const startDate = new Date(updatedAuction.starting);
      const endDate = new Date(updatedAuction.ending);

      if (startDate >= endDate) {
        toast.error('Invalid schedule', {
          description: 'Ending time must be after starting time',
        });
        return;
      }
    }

    toast.promise(updateAuction({
      auctionId,
      ...updatedAuction
    }), {
      loading: 'Updating auction details...',
      success: () => {
        setIsEditing(false);
        return 'Auction updated successfully';
      },
      error: (error) => {
        console.error('Update error:', error);
        return error?.message || 'Failed to update auction';
      },
    });
  };

  const handleAddTeam = async () => {
    if (!auctionId || !newTeam.trim() || !auction) return;

    const teamName = newTeam.trim();

    // Check if team already exists
    if (auction.teams.includes(teamName)) {
      toast.error('Team already exists', {
        description: `${teamName} is already in the auction`,
      });
      return;
    }

    const updatedTeams = [...auction.teams, teamName];

    toast.promise(updateAuction({
      auctionId,
      teams: updatedTeams
    }), {
      loading: 'Adding team...',
      success: () => {
        setNewTeam('');
        return `${teamName} added successfully`;
      },
      error: 'Failed to add team',
    });
  };

  const handleRemoveTeam = async (index: number) => {
    if (!auctionId || !auction) return;

    const teamName = auction.teams[index];
    const updatedTeams = [...auction.teams];
    updatedTeams.splice(index, 1);

    toast.promise(updateAuction({
      auctionId,
      teams: updatedTeams
    }), {
      loading: 'Removing team...',
      success: `${teamName} removed successfully`,
      error: 'Failed to remove team',
    });
  };

  // Loading state
  if (auction === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="outline"
          onClick={() => router.push('/auctions')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Auctions
        </Button>

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
      </div>
    );
  }

  // Auction not found
  if (auction === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Auction Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The auction you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/auctions')}>
          Back to Auctions
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        onClick={() => router.push('/auctions')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Back to Auctions
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {auction.auctionName}
          </h1>
          <Badge
            className={`mt-2 text-base py-1.5 px-3 ${statusColors[auction.status]} capitalize`}
          >
            {auction.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <UpdateButton onClick={() => { }} />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil size={18} /> Update Auction Details
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="auctionName" className="text-right">
                    Auction Name
                  </Label>
                  <Input
                    id="auctionName"
                    value={updatedAuction.auctionName}
                    onChange={(e) => setUpdatedAuction({ ...updatedAuction, auctionName: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="starting" className="text-right">
                    Start Time
                  </Label>
                  <Input
                    id="starting"
                    type="datetime-local"
                    value={updatedAuction.starting}
                    onChange={(e) => setUpdatedAuction({ ...updatedAuction, starting: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ending" className="text-right">
                    End Time
                  </Label>
                  <Input
                    id="ending"
                    type="datetime-local"
                    value={updatedAuction.ending}
                    onChange={(e) => setUpdatedAuction({ ...updatedAuction, ending: e.target.value })}
                    className="col-span-3"
                    min={updatedAuction.starting}
                  />
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
                <Trash2 size={16} /> Delete Auction
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
                  Are you sure you want to delete the auction <span className="font-bold">"{auction.auctionName}"</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-1">
                    <Trash2 size={16} /> Delete Auction
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Schedule</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Start Time</div>
              <div className="text-lg text-foreground font-medium">
                {formatDate(auction.starting)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">End Time</div>
              <div className="text-lg text-foreground font-medium">
                {formatDate(auction.ending)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Teams</div>
              <div className="text-3xl font-bold text-foreground">
                {auction.teams.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Starting Coins</div>
              <div className="text-3xl font-bold text-foreground">
                {auction.startingCoin.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Auctioneer</div>
            <div className="text-lg font-medium text-foreground">
              {auction.auctioneer}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Teams ({auction.teams.length})</h2>
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="Add new team"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                className="flex-1"
              />
              <AddButton
                onClick={handleAddTeam}
                disabled={!newTeam.trim()}
              />
            </div>
          </div>

          {auction.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {auction.teams.map((team, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md text-foreground"
                >
                  <span className="truncate">{team}</span>
                  <TrashButton onClick={() => handleRemoveTeam(index)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No teams registered yet. Add teams to get started!
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}