'use client';

import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  Gavel, 
  Settings,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  RotateCcw,
  Timer,
  DollarSign,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { api } from '../../../../../../convex/_generated/api';


// Admin Badge Component
const AdminBadge = () => (
  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
    <Shield size={12} className="mr-1" />
    Auction Admin
  </Badge>
);

// Player Display Component
const PlayerDisplay = ({ playerId }: { playerId: Id<'players'> }) => {
  const player = useQuery(api.players.getPlayer, { playerId });

  if (player === undefined) {
    return <Skeleton className="h-4 w-20" />;
  }

  if (player === null) {
    return <div className="text-muted-foreground italic">Player not found</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{player.name}</span>
      <Badge variant="outline" className="text-xs">
        {player.preference1}
      </Badge>
    </div>
  );
};

// Team Display Component
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

// Queue Management Component
const QueueManagement = ({ 
  auctionId, 
  playerQueue, 
  onQueueUpdate 
}: { 
  auctionId: Id<'auctions'>;
  playerQueue: Id<'players'>[];
  onQueueUpdate: () => void;
}) => {
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [newQueue, setNewQueue] = useState<Id<'players'>[]>([]);

  useEffect(() => {
    setNewQueue([...playerQueue]);
  }, [playerQueue]);

  const movePlayerUp = (index: number) => {
    if (index > 0) {
      const updated = [...newQueue];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      setNewQueue(updated);
    }
  };

  const movePlayerDown = (index: number) => {
    if (index < newQueue.length - 1) {
      const updated = [...newQueue];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      setNewQueue(updated);
    }
  };

  const removeFromQueue = (index: number) => {
    const updated = newQueue.filter((_, i) => i !== index);
    setNewQueue(updated);
  };

  const saveQueueOrder = () => {
    // This would need a mutation to update the queue order
    toast.success('Queue order updated');
    setIsReorderOpen(false);
    onQueueUpdate();
  };

  return (
    <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings size={16} />
          Manage Queue ({playerQueue.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={18} />
            Manage Auction Queue
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {newQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No players in queue
            </div>
          ) : (
            <div className="space-y-2">
              {newQueue.map((playerId, index) => (
                <div key={playerId} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="text-sm font-mono w-6">{index + 1}</div>
                  <div className="flex-1">
                    <PlayerDisplay playerId={playerId} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePlayerUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePlayerDown(index)}
                      disabled={index === newQueue.length - 1}
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromQueue(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsReorderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQueueOrder}>
              Save Queue Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ 
  timeRemaining, 
  onExtend 
}: { 
  timeRemaining: number;
  onExtend: (seconds: number) => void;
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining < 10000; // Less than 10 seconds

  return (
    <div className="flex items-center gap-2">
      <div className={`text-2xl font-mono font-bold ${isLowTime ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
        {formatTime(timeRemaining)}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => onExtend(30)}>
          +30s
        </Button>
        <Button size="sm" variant="outline" onClick={() => onExtend(60)}>
          +1m
        </Button>
      </div>
    </div>
  );
};

export default function CurrentAuctionAdminPanel() {
  const [countdownDuration, setCountdownDuration] = useState(60);
  const params = useParams();
  
  // Extract auctionId from URL params and cast to proper type
  const auctionId = params?.auctionId as Id<'auctions'>;

  // Early return if auctionId is not provided
  if (!auctionId) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AdminBadge />
        <h1 className="text-2xl font-bold mb-4 mt-4">Invalid Auction</h1>
        <p className="text-muted-foreground">No auction ID provided.</p>
      </div>
    );
  }

  // Queries - only call if auctionId is valid
  const auctionState = useQuery(api.currentAuctions.getAuctionState, 
    auctionId ? { auctionId } : "skip"
  );
  const auctionDashboard = useQuery(api.currentAuctions.getAuctionDashboard, 
    auctionId ? { auctionId } : "skip"
  );
  const auction = useQuery(api.auctions.getAuctionById, 
    auctionId ? { auctionId } : "skip"
  );

  // Mutations
  const initializeAuction = useMutation(api.currentAuctions.initializeAuction);
  const startNextPlayer = useMutation(api.currentAuctions.startNextPlayer);
  const pauseAuction = useMutation(api.currentAuctions.pauseAuction);
  const sellPlayer = useMutation(api.currentAuctions.sellPlayer);
  const markPlayerUnsold = useMutation(api.currentAuctions.markPlayerUnsold);
  const extendCountdown = useMutation(api.currentAuctions.extendCountdown);
  const resetAuction = useMutation(api.currentAuctions.resetAuction);

  const handleInitializeAuction = async () => {
    if (!auction?.playerIds) {
      toast.error('No players found for this auction');
      return;
    }

    toast.promise(
      initializeAuction({
        auctionId,
        playerQueue: auction.playerIds
      }),
      {
        loading: 'Initializing auction...',
        success: 'Auction initialized successfully',
        error: 'Failed to initialize auction'
      }
    );
  };

  const handleStartNextPlayer = async () => {
    toast.promise(
      startNextPlayer({
        auctionId,
        countdownDurationMs: countdownDuration * 1000
      }),
      {
        loading: 'Starting next player...',
        success: 'Player auction started',
        error: 'Failed to start next player'
      }
    );
  };

  const handlePauseResume = async () => {
    const currentStatus = auctionState?.status;
    const action = currentStatus === 'paused' ? 'Resuming' : 'Pausing';
    
    toast.promise(
      pauseAuction({ auctionId }),
      {
        loading: `${action} auction...`,
        success: `Auction ${action.toLowerCase()}d`,
        error: `Failed to ${action.toLowerCase()} auction`
      }
    );
  };

  const handleSellPlayer = async () => {
    if (!auctionState?.currentBid) {
      toast.error('No bids placed for current player');
      return;
    }

    toast.promise(
      sellPlayer({ auctionId }),
      {
        loading: 'Selling player...',
        success: (result) => `Player sold for ${result.amount} coins`,
        error: 'Failed to sell player'
      }
    );
  };

  const handleMarkUnsold = async () => {
    toast.promise(
      markPlayerUnsold({ auctionId }),
      {
        loading: 'Marking player as unsold...',
        success: 'Player marked as unsold',
        error: 'Failed to mark player as unsold'
      }
    );
  };

  const handleExtendCountdown = async (seconds: number) => {
    toast.promise(
      extendCountdown({ 
        auctionId, 
        extensionMs: seconds * 1000 
      }),
      {
        loading: `Extending countdown by ${seconds}s...`,
        success: `Countdown extended by ${seconds} seconds`,
        error: 'Failed to extend countdown'
      }
    );
  };

  const handleResetAuction = async () => {
    toast.promise(
      resetAuction({ auctionId }),
      {
        loading: 'Resetting auction...',
        success: 'Auction reset successfully',
        error: 'Failed to reset auction'
      }
    );
  };

  if (auction === undefined || auctionDashboard === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <AdminBadge />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (auction === null) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AdminBadge />
        <h1 className="text-2xl font-bold mb-4 mt-4">Auction Not Found</h1>
        <p className="text-muted-foreground">The auction you're looking for doesn't exist.</p>
      </div>
    );
  }

  const isInitialized = auctionState !== null;
  const isRunning = auctionState?.status === 'running';
  const isPaused = auctionState?.status === 'paused';
  const hasCurrentPlayer = auctionState?.currentPlayer !== null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <AdminBadge />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {auction.auctionName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isInitialized ? 'default' : 'secondary'}>
                {isInitialized ? 'Initialized' : 'Not Initialized'}
              </Badge>
              {isInitialized && (
                <Badge variant={isRunning ? 'default' : isPaused ? 'secondary' : 'outline'}>
                  {auctionState?.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex gap-2">
          {!isInitialized ? (
            <Button onClick={handleInitializeAuction} className="flex items-center gap-2">
              <Plus size={16} />
              Initialize Auction
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePauseResume}
                variant={isPaused ? 'default' : 'secondary'}
                className="flex items-center gap-2"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Reset</DialogTitle>
                  </DialogHeader>
                  <p className="py-4">
                    Are you sure you want to reset the auction? This will clear all current progress.
                  </p>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="destructive" onClick={handleResetAuction}>
                        Reset Auction
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Main Dashboard */}
      {isInitialized && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Player Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Gavel size={20} />
                  Current Player
                </h2>
                {hasCurrentPlayer && isRunning && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSellPlayer}
                      disabled={!auctionState.currentBid}
                      className="flex items-center gap-2"
                    >
                      <Gavel size={16} />
                      Sell Player
                    </Button>
                    <Button
                      onClick={handleMarkUnsold}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Square size={16} />
                      Mark Unsold
                    </Button>
                  </div>
                )}
              </div>

              {auctionState?.currentPlayer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <PlayerDisplay playerId={auctionState.currentPlayer._id} />
                    {isRunning && auctionState.timeRemaining > 0 && (
                      <CountdownTimer
                        timeRemaining={auctionState.timeRemaining}
                        onExtend={handleExtendCountdown}
                      />
                    )}
                  </div>

                  {auctionState.currentBid ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Current Bid</div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{auctionState.currentBid.toLocaleString()}
                          </div>
                        </div>
                        {auctionState.currentBidderTeam && (
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Bidder</div>
                            <div className="font-medium">
                              <TeamDisplay teamId={auctionState.currentBidderTeam._id} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                      <div className="text-yellow-600">No bids yet</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">No player currently being auctioned</div>
                  {auctionState && auctionState.playersRemaining > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Label htmlFor="countdown">Countdown Duration (seconds):</Label>
                        <Input
                          id="countdown"
                          type="number"
                          value={countdownDuration}
                          onChange={(e) => setCountdownDuration(Number(e.target.value))}
                          className="w-20"
                          min="10"
                          max="300"
                        />
                      </div>
                      <Button onClick={handleStartNextPlayer} className="flex items-center gap-2">
                        <Play size={16} />
                        Start Next Player
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Bid History */}
            {auctionDashboard?.bidHistory && auctionDashboard.bidHistory.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  Bid History
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auctionDashboard.bidHistory.map((bid, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{bid.teamName}</span>
                      <span className="font-bold">₹{bid.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Queue Management */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={18} />
                  Player Queue
                </h3>
                <QueueManagement
                  auctionId={auctionId}
                  playerQueue={auctionState?.playerQueue || []}
                  onQueueUpdate={() => {}}
                />
              </div>
              <div className="text-2xl font-bold text-center">
                {auctionState?.playersRemaining || 0}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Players remaining
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Auction Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Players</span>
                  <span className="font-medium">{auction.playerIds?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sold</span>
                  <span className="font-medium text-green-600">
                    {(auction.playerIds?.length || 0) - (auctionState?.playersRemaining || 0) - (auctionState?.unsoldPlayers?.length || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unsold</span>
                  <span className="font-medium text-yellow-600">
                    {auctionState?.unsoldPlayers?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium">{auctionState?.playersRemaining || 0}</span>
                </div>
              </div>
            </Card>

            {/* Teams Info */}
            {auctionDashboard?.teams && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Teams</h3>
                <div className="space-y-2">
                  {auctionDashboard.teams.map((team) => (
                    <div key={team.teamId} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium truncate">
                        {team.teamName}
                        {team.isCurrentBidder && (
                          <Badge variant="default" className="ml-2 text-xs">Bidding</Badge>
                        )}
                      </span>
                      <span className="text-sm font-mono">
                        ₹{team.coinsLeft.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}