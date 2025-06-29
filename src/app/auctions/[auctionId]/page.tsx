'use client';

import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CalendarIcon, Users, Coins, User, Clock, ArrowLeft } from 'lucide-react';
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

  // Loading state
  if (auction === undefined) {
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
            
            {auction.status === 'registering' && (
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
            )}
          </div>
          
          <p className="text-muted-foreground mt-3 text-lg">
            {currentStatus.description}
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
                  {auction.teams.map((team, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {team.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{team}</div>
                          <div className="text-sm text-muted-foreground">Team #{index + 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
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
            {/* Auction Details Card */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Auction Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Auctioneer</div>
                    <div className="font-semibold text-foreground">{auction.auctioneer}</div>
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

            {/* Registration Card */}
            {auction.status === 'registering' && (
              <Card className="p-6 border-primary/20 bg-primary/5">
                <h3 className="text-xl font-semibold mb-3 text-primary">
                  Ready to Join?
                </h3>
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
              </Card>
            )}

            {/* Status Info Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Status Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    auction.status === 'live' ? 'bg-green-500' :
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