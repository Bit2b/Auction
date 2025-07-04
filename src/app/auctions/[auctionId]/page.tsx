'use client';

import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CalendarIcon, Users, Coins, User, Clock, ArrowLeft, Settings, CheckCircle, Gavel, Eye } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export default function AuctionViewPage() {
  const router = useRouter();
  const params = useParams();

  // Get auctionId from route parameters and cast to proper ID type
  const auctionId = params?.auctionId as Id<'auctions'> | undefined;

  const auction = useQuery(api.auctions.getAuctionById,
    auctionId ? { auctionId } : "skip"
  );

  // Get current user - adjust this based on your auth implementation
  const currentUser = useQuery(api.users.getCurrentUser);

  // Get auctioneer details
  const auctioneer = useQuery(api.users.getUserById,
    auction ? { userId: auction.auctioneer } : "skip"
  );

  // Get team details for all registered teams
  const teamDetails = useQuery(api.teams.getTeamsByIds,
    auction && auction.teams.length > 0 ? { teamIds: auction.teams } : "skip"
  );

  // Check if current user is registered as a team or player
  const userTeamRegistration = useQuery(api.auctions.getUserTeamRegistration,
    currentUser && auctionId ? { auctionId, userId: currentUser.userId } : "skip"
  );

  const userPlayerRegistration = useQuery(api.auctions.getUserPlayerRegistration,
    currentUser && auctionId ? { auctionId, userId: currentUser.userId } : "skip"
  );

  // Format date strings
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const statusConfig = {
    live: {
      color: 'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-500/50',
      label: 'Live Now',
      description: 'The auction is currently active'
    },
    registering: {
      color: 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/50',
      label: 'Registration Open',
      description: 'Teams can register for this auction'
    },
    ended: {
      color: 'bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-500/50',
      label: 'Ended',
      description: 'This auction has concluded'
    },
    idle: {
      color: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-500/50',
      label: 'Scheduled',
      description: 'Auction is scheduled but not yet active'
    },
  };

  const handleRegisterTeam = () => {
    if (auctionId) {
      router.push(`/auctions/${auctionId}/register/team`);
    }
  };

  const handleRegisterPlayer = () => {
    if (auctionId) {
      router.push(`/auctions/${auctionId}/register/player`);
    }
  };

  const handleAdminPanel = () => {
    if (auctionId) {
      router.push(`/auctions/${auctionId}/admin`);
    }
  };

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

const handleLiveBidding = () => {
  if (auctionId && userTeamRegistration) {
    // Get the team ID from the user's team registration
    const teamId = userTeamRegistration._id;
    
    // Navigate to the live bidding page with the team ID as a query parameter
    router.push(`/auctions/${auctionId}/live/bid/${teamId}`);
  }
};
  const handleViewLiveAuction = () => {
    if (auctionId) {
      router.push(`/auctions/${auctionId}/live`);
    }
  };

  // Check if current user is the auctioneer
  const isAuctioneer = currentUser && auction &&
    (currentUser.userId === auction.auctioneer);

  // Check registration status
  const isRegisteredAsTeam = userTeamRegistration !== null && userTeamRegistration !== undefined;
  const isRegisteredAsPlayer = userPlayerRegistration !== null && userPlayerRegistration !== undefined;
  const isAlreadyRegistered = isRegisteredAsTeam || isRegisteredAsPlayer;

  // Check if auction is live and user is registered as team
  const canBid = auction?.status === 'live' && isRegisteredAsTeam;
  const canViewLive = auction?.status === 'live';

  // Loading state
  if (auction === undefined || currentUser === undefined) {
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

  // Auction not found
  if (auction === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Auction Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The auction you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/auctions')}>
            View All Auctions
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[auction.status];

  // Render registration buttons or status
  const renderRegistrationSection = () => {
    if (isAuctioneer) return null;

    // Show live auction actions if auction is live
    if (auction.status === 'live') {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          {canBid && (
            <Button
              onClick={handleLiveBidding}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
            >
              <Gavel size={18} />
              Start Bidding
            </Button>
          )}
          {canViewLive && (
            <Button
              onClick={handleViewLiveAuction}
              size="lg"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-6 py-3 flex items-center gap-2"
            >
              <Eye size={18} />
              View Live Auction
            </Button>
          )}
        </div>
      );
    }

    if (auction.status !== 'registering') return null;

    if (isRegisteredAsTeam) {
      return (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          <div>
            <div className="font-semibold text-green-800 dark:text-green-200">
              Registered as Team
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              You're all set! Team: {userTeamRegistration?.teamName || 'Your Team'}
            </div>
          </div>
        </div>
      );
    }

    if (isRegisteredAsPlayer) {
      return (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
          <div>
            <div className="font-semibold text-blue-800 dark:text-blue-200">
              Registered as Player
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              You're registered and ready to be auctioned!
            </div>
          </div>
        </div>
      );
    }

    // Show registration buttons if not registered
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleRegisterTeam}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3"
        >
          Register as Team
        </Button>
        <Button
          onClick={handleRegisterPlayer}
          size="lg"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 px-6 py-3"
        >
          Register as Player
        </Button>
      </div>
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

          {/* Admin Panel Link for Auctioneer */}
          {isAuctioneer && (
            <Button
              variant="outline"
              onClick={handleAdminPanel}
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
            >
              <Settings size={16} /> Admin Panel
            </Button>
          )}
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                {auction.auctionName}
              </h1>
              <Badge
                className={`text-sm py-2 px-4 border ${currentStatus.color}`}
                variant="outline"
              >
                {currentStatus.label}
              </Badge>
            </div>

            {renderRegistrationSection()}
          </div>

          <p className="text-muted-foreground mt-3 text-lg">
            {currentStatus.description}
            {isAuctioneer && (
              <span className="ml-2 text-primary font-medium">
                · You are the auctioneer
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Schedule Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <CalendarIcon size={24} />
                Schedule
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    <span className="text-sm font-medium">START TIME</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">
                      {formatDate(auction.starting)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {formatTime(auction.starting)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    <span className="text-sm font-medium">END TIME</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">
                      {formatDate(auction.ending)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {formatTime(auction.ending)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Teams Card */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Users size={24} />
                Registered Teams ({auction.teams.length})
              </h2>

              {auction.teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {auction.teams.map((teamId, index) => {
                    const team = Array.isArray(teamDetails)
                      ? teamDetails.find(t => t?._id === teamId) : null;

                    const teamName = team?.teamName || `Team ${index + 1}`;
                    const teamOwner = team?.ownerId || null;

                    return (
                      <div
                        key={teamId}
                        onClick={() => handleTeamClick(teamId)}
                        className="p-4 bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {teamName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{teamName}</div>
                            <div className="text-sm text-muted-foreground">Team #{index + 1}</div>
                            {teamOwner && (
                              <div className="text-xs text-muted-foreground">
                                Owner: {teamOwner}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No teams registered yet
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-1">
                    Be the first to register your team!
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Auction Actions Card - Show when auction is live */}
            {auction.status === 'live' && !isAuctioneer && (
              <Card className="p-6 border-green-500/20 bg-green-50/50 dark:bg-green-900/10">
                <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Gavel size={20} />
                  Live Auction
                </h3>

                {isRegisteredAsTeam ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      The auction is live! You can start bidding on players or watch the auction.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={handleLiveBidding}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        <Gavel size={16} className="mr-2" />
                        Start Bidding
                      </Button>
                      <Button
                        onClick={handleViewLiveAuction}
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        size="lg"
                      >
                        <Eye size={16} className="mr-2" />
                        View Live Auction
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      The auction is live! You can watch the auction in progress.
                    </p>
                    <Button
                      onClick={handleViewLiveAuction}
                      className="w-full"
                      size="lg"
                    >
                      <Eye size={16} className="mr-2" />
                      View Live Auction
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Admin Panel Card for Auctioneer */}
            {isAuctioneer && (
              <Card className="p-6 border-primary/20 bg-primary/5">
                <h3 className="text-xl font-semibold mb-3 text-primary flex items-center gap-2">
                  <Settings size={20} />
                  Auctioneer Panel
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  You are the auctioneer for this auction. Access the admin panel to manage the auction.
                </p>
                <Button
                  onClick={handleAdminPanel}
                  className="w-full"
                  size="lg"
                >
                  <Settings size={16} className="mr-2" />
                  Open Admin Panel
                </Button>
              </Card>
            )}

            {/* Auction Details Card */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Auction Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Auctioneer</div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {auctioneer?.name || auction.auctioneer}
                      {isAuctioneer && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Coins size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Starting Coins</div>
                    <div className="font-semibold text-foreground">
                      {auction.startingCoin.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Total Teams</div>
                    <div className="font-semibold text-foreground">{auction.teams.length}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Registration Status Card */}
            {auction.status === 'registering' && !isAuctioneer && (
              <Card className="p-6 border-primary/20 bg-primary/5">
                <h3 className="text-xl font-semibold mb-3 text-primary">
                  {isAlreadyRegistered ? 'Registration Status' : 'Ready to Join?'}
                </h3>

                {isRegisteredAsTeam && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="font-medium">Registered as Team</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      You're successfully registered as a team for this auction.
                    </p>
                  </div>
                )}

                {isRegisteredAsPlayer && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <CheckCircle size={16} />
                      <span className="font-medium">Registered as Player</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      You're registered as a player and ready to be auctioned!
                    </p>
                  </div>
                )}

                {!isAlreadyRegistered && (
                  <>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Registration is currently open. Choose how you want to participate in this auction.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={handleRegisterTeam}
                        className="w-full"
                        size="lg"
                      >
                        Register as Team
                      </Button>
                      <Button
                        onClick={handleRegisterPlayer}
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary/10"
                        size="lg"
                      >
                        Register as Player
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* Status Info Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Status Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${auction.status === 'live' ? 'bg-green-500' :
                    auction.status === 'registering' ? 'bg-blue-500' :
                      auction.status === 'ended' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                  <span className="font-medium">{currentStatus.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {auction.status === 'live' && 'The auction is currently in progress. Teams are bidding on players.'}
                  {auction.status === 'registering' && 'Teams can register to participate in this auction.'}
                  {auction.status === 'ended' && 'This auction has been completed. Check back for results.'}
                  {auction.status === 'idle' && 'The auction is scheduled but has not started yet.'}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}