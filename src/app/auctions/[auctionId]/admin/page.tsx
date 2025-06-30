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
import { Separator } from '@/components/ui/separator';
import { Trash2, Pencil, Plus, ArrowLeft, Settings, Check, X, Clock, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useConvex } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';


// Utility function to get team name
const useTeamNameResolver = () => {
  const convex = useConvex();

  const getTeamName = async (teamId: string): Promise<string> => {
    try {
      const team = await convex.query(api.teams.getTeam, { teamId: teamId as Id<'teams'> });
      return team?.teamName || teamId;
    } catch (error) {
      console.error('Error fetching team name:', error);
      return teamId; // Fallback to team ID
    }
  };

  return { getTeamName };
};

// Admin Badge Component
const AdminBadge = () => (
  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
    <Shield size={12} className="mr-1" />
    Admin Panel
  </Badge>
);

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

// Status Change Button Component
const StatusChangeButton = ({ currentStatus, onStatusChange }: {
  currentStatus: string,
  onStatusChange: (status: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'idle', label: 'Idle', icon: Clock },
    { value: 'registering', label: 'Registering', icon: Users },
    { value: 'live', label: 'Live', icon: Settings },
    { value: 'ended', label: 'Ended', icon: X }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings size={16} />
          Change Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={18} />
            Change Auction Status
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Current Status: <Badge className="ml-2 capitalize">{currentStatus}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={currentStatus === option.value ? "default" : "outline"}
                  onClick={() => {
                    onStatusChange(option.value);
                    setIsOpen(false);
                  }}
                  disabled={currentStatus === option.value}
                  className="flex items-center gap-2 h-12"
                >
                  <Icon size={16} />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Team Request Card Component - Updated to always show team names
const TeamRequestCard = ({
  request,
  onApprove,
  onReject
}: {
  request: string,
  onApprove: () => void,
  onReject: () => void
}) => (
  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <div className="flex items-center gap-3">
      <Clock size={16} className="text-yellow-600" />
      <span className="font-medium text-foreground">
        <TeamDisplay teamId={request as Id<'teams'>} />
      </span>
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
        Pending
      </Badge>
    </div>
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={onApprove}
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
      >
        <Check size={14} />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={onReject}
        className="flex items-center gap-1"
      >
        <X size={14} />
        Reject
      </Button>
    </div>
  </div>
);

// Team Display Component with name resolution
const TeamDisplay = ({ teamId }: { teamId: Id<'teams'> }) => {
  const team = useQuery(api.teams.getTeam, { teamId });

  if (team === undefined) {
    return <Skeleton className="h-4 w-20" />;
  }

  if (team === null) {
    return <div className="text-muted-foreground italic">Team not found</div>;
  }

  return <span>{team.teamName}</span>;
};

// Enhanced Team Display Component that handles both team IDs and regular strings
const SmartTeamDisplay = ({ teamId }: { teamId: string }) => {
  return <TeamDisplay teamId={teamId as Id<'teams'>} />;
};

// Auctioneer Display Component with name resolution
const AuctioneerDisplay = ({ auctioneerId }: { auctioneerId: string }) => {
  const auctioneer = useQuery(api.users.getUserById, { userId: auctioneerId });

  if (auctioneer === undefined) {
    return <Skeleton className="h-4 w-24" />;
  }

  if (auctioneer === null) {
    return <span className="text-muted-foreground italic">User not found</span>;
  }

  return <span>{auctioneer.name || auctioneerId}</span>;
};

export default function AdminAuctionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [updatedAuction, setUpdatedAuction] = useState({
    auctionName: '',
    starting: '',
    ending: '',
  });
  const [newTeam, setNewTeam] = useState('');

  // Get the team name resolver utility
  const { getTeamName } = useTeamNameResolver();

  // Get auctionId from route parameters and cast to proper ID type
  const auctionId = params?.auctionId as Id<'auctions'> | undefined;

  const auction = useQuery(api.auctions.getAuctionById,
    auctionId ? { auctionId } : "skip"
  );

  const deleteAuction = useMutation(api.auctions.deleteAuction);
  const updateAuction = useMutation(api.auctions.updateAuction);
  const updateAuctionStatus = useMutation(api.auctions.updateAuctionStatus);
  const removeTeamRequest = useMutation(api.auctions.removeTeamRequest);

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
        router.push('/admin/auctions');
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

  const handleStatusChange = async (newStatus: string) => {
    if (!auctionId) return;

    const statusMap = {
      'idle': 'idle',
      'registering': 'registering',
      'live': 'live',
      'ended': 'ended'
    } as const;

    toast.promise(updateAuctionStatus({
      id: auctionId,
      status: statusMap[newStatus as keyof typeof statusMap]
    }), {
      loading: 'Updating auction status...',
      success: `Auction status changed to ${newStatus}`,
      error: 'Failed to update auction status',
    });
  };

  const handleRemoveTeam = async (index: number) => {
    if (!auctionId || !auction) return;

    const updatedTeams = [...auction.teams];
    updatedTeams.splice(index, 1);

    toast.promise(updateAuction({
      auctionId,
      teams: updatedTeams
    }), {
      loading: 'Removing team...',
      success: 'Team removed successfully',
      error: 'Failed to remove team',
    });
  };

  const handleApproveTeamRequest = async (teamRequest: string) => {
    if (!auctionId || !auction) return;

    // Add to teams and remove from requests
    const updatedTeams = [...auction.teams, teamRequest];

    // Get team name for better toast message
    const teamName = await getTeamName(teamRequest);

    toast.promise(Promise.all([
      updateAuction({ auctionId, teams: updatedTeams }),
      removeTeamRequest({ id: auctionId, teamId: teamRequest })
    ]), {
      loading: 'Approving team request...',
      success: `${teamName} approved and added to auction`,
      error: 'Failed to approve team request',
    });
  };

  const handleRejectTeamRequest = async (teamRequest: string) => {
    if (!auctionId) return;

    // Get team name for better toast message
    const teamName = await getTeamName(teamRequest);

    toast.promise(removeTeamRequest({ id: auctionId, teamId: teamRequest }), {
      loading: 'Rejecting team request...',
      success: `${teamName} request rejected`,
      error: 'Failed to reject team request',
    });
  };

  // Loading state
  if (auction === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/auctions')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Admin
          </Button>
          <AdminBadge />
        </div>

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
        </div>
      </div>
    );
  }

  // Auction not found
  if (auction === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <AdminBadge />
        </div>
        <h1 className="text-2xl font-bold mb-4">Auction Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The auction you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push(`/auctions/${auctionId}`)}>
          Back to Auction
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <AdminBadge />
      </div>

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
          <StatusChangeButton
            currentStatus={auction.status}
            onStatusChange={handleStatusChange}
          />

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
                  This action cannot be undone and will remove all associated data.
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

      {/* Team Requests Section */}
      {auction.teamRequests && auction.teamRequests.length > 0 && (
        <Card className="p-6 mb-6 border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <Clock size={20} className="text-yellow-600" />
            Pending Team Requests ({auction.teamRequests.length})
          </h2>
          <div className="space-y-3">
            {auction.teamRequests.map((request, index) => (
              <TeamRequestCard
                key={index}
                request={request}
                onApprove={() => handleApproveTeamRequest(request)}
                onReject={() => handleRejectTeamRequest(request)}
              />
            ))}
          </div>
        </Card>
      )}

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
              <div className="text-sm text-muted-foreground">Confirmed Teams</div>
              <div className="text-3xl font-bold text-foreground">
                {auction.teams.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pending Requests</div>
              <div className="text-3xl font-bold text-yellow-600">
                {auction.teamRequests?.length || 0}
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Starting Coins</div>
              <div className="text-2xl font-bold text-foreground">
                {auction.startingCoin.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Auctioneer</div>
              <div className="text-lg font-medium text-foreground">
                <AuctioneerDisplay auctioneerId={auction.auctioneer} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Confirmed Teams ({auction.teams.length})</h2>
          </div>
          {auction.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {auction.teams.map((teamId, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <span className="truncate">
                      <SmartTeamDisplay teamId={teamId} />
                    </span>
                  </div>
                  <TrashButton onClick={() => handleRemoveTeam(index)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No confirmed teams yet. Approve pending requests or add teams directly.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}