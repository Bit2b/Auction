'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Coins, Trophy, AlertCircle, CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';

export default function TeamRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.auctionId as Id<"auctions">;
  const { user } = useUser();

  const [formData, setFormData] = useState({
    teamName: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch auction data
  const auction = useQuery(api.auctions.getAuctionById, { auctionId: auctionId });
  
  // Mutations
  const createTeam = useMutation(api.teams.createTeam);
  const addTeamRequest = useMutation(api.auctions.addTeamRequest);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.teamName.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please enter a team name');
      return;
    }

    if (!auction) {
      setSubmitStatus('error');
      setErrorMessage('Auction not found');
      return;
    }

    if (!user) {
      setSubmitStatus('error');
      setErrorMessage('You must be logged in to register a team');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      // Create the team
      const teamId = await createTeam({
        auctionId: auctionId as Id<"auctions">,
        teamName: formData.teamName.trim(),
        owner: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'Unknown User',
      });

      // Send team request to auction
      await addTeamRequest({
        id: auctionId as Id<"auctions">,
        teamId: teamId,
      });

      setSubmitStatus('success');
      // Reset form
      setFormData({
        teamName: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/auctions/${auctionId}`);
      }, 2000);

    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to register team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/auctions/${auctionId}`);
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Check if auction allows registration
  const canRegister = auction.status === 'registering' || auction.status === 'idle';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Auction
            </Button>
          </div>

          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Register Your Team</h1>
            <p className="text-muted-foreground mb-4">
              Join "{auction.auctionName}" and compete for the best players
            </p>
            
            {/* User Info */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Registering as: <span className="font-medium text-foreground">
                  {user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress}
                </span>
              </p>
            </div>
            
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className="mt-1">
                      {auction.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Starting Budget</div>
                    <div className="flex items-center justify-center mt-1">
                      <Coins className="w-4 h-4 mr-1 text-primary" />
                      <span className="font-semibold">{auction.startingCoin}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Teams Registered</div>
                    <div className="flex items-center justify-center mt-1">
                      <Users className="w-4 h-4 mr-1 text-primary" />
                      <span className="font-semibold">{auction.teams.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registration Status Check */}
        {!canRegister && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Team registration is not available for this auction. 
              Current status: <strong>{auction.status}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Team Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="Enter your team name"
                disabled={!canRegister || isSubmitting}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Choose a unique name for your team in this auction
              </p>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Team registered successfully!</p>
                    <p className="text-sm">
                      Your request has been sent to the auction organizer. 
                      Redirecting to auction page...
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Registration failed</p>
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canRegister || isSubmitting || !formData.teamName.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering Team...
                </div>
              ) : (
                'Register Team'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Team Creation</p>
                  <p className="text-sm text-muted-foreground">
                    Your team will be created with {auction.startingCoin} coins budget
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Approval Process</p>
                  <p className="text-sm text-muted-foreground">
                    The auction organizer will review and approve your request
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Start Bidding</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you can participate in player auctions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}