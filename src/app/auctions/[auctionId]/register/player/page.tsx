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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Trophy, AlertCircle, CheckCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';

const PREFERENCES = [
  "ICPC Contest",
  "Coding Speedrun",
  "Coders Cup",
  "Coding Relay",
  "CodeHers",
  "Machine Learning Contest",
  "DataPrep Competition",
  "Website Development",
  "CSS Wars",
  "Aptitude Test",
  "DevGenius Quiz Challange",
  "CS Fundamentals",
  "English",
  "Maths"
];

const BRANCHES = ['CSE', 'DSAI', 'ECE'] as const;

export default function PlayerRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.auctionId as Id<"auctions">;
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    year: '',
    branch: '' as typeof BRANCHES[number] | '',
    preference1: '',
    preference2: '',
    preference3: '',
    achievement: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch auction data
  const auction = useQuery(api.auctions.getAuctionById, { auctionId: auctionId });

  // Get current user from your database
  const currentUser = useQuery(api.users.getCurrentUser);

  // Mutations
  const createPlayer = useMutation(api.players.createPlayer);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'year', 'branch', 'preference1', 'preference2', 'preference3'];
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());

    if (emptyFields.length > 0) {
      return `Please fill in all required fields: ${emptyFields.join(', ')}`;
    }

    // Check if preferences are unique
    const preferences = [formData.preference1, formData.preference2, formData.preference3];
    const uniquePreferences = new Set(preferences);
    if (uniquePreferences.size !== preferences.length) {
      return 'Please select different preferences for each option';
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate required fields
    const validationError = validateForm();
    if (validationError) {
      setSubmitStatus('error');
      setErrorMessage(validationError);
      return;
    }

    if (!auction) {
      setSubmitStatus('error');
      setErrorMessage('Auction not found');
      return;
    }

    if (!user) {
      setSubmitStatus('error');
      setErrorMessage('You must be logged in to register as a player');
      return;
    }

    // Check if currentUser is loaded
    if (currentUser === undefined) {
      setSubmitStatus('error');
      setErrorMessage('Loading user data, please try again');
      return;
    }

    if (!currentUser) {
      setSubmitStatus('error');
      setErrorMessage('User not found in database. Please ensure you have completed your profile setup.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      // Create the player with userId
      await createPlayer({
        userId: user.id, // Use Clerk user ID
        auctionId: auctionId as Id<"auctions">,
        name: formData.name.trim(),
        year: formData.year.trim(),
        branch: formData.branch as typeof BRANCHES[number],
        preference1: formData.preference1,
        preference2: formData.preference2,
        preference3: formData.preference3,
        achievement: formData.achievement.trim(),
        isSold: false,
      });

      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        year: '',
        branch: '',
        preference1: '',
        preference2: '',
        preference3: '',
        achievement: '',
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/auctions/${auctionId}`);
      }, 3000);

    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to register player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/auctions/${auctionId}`);
  };

  // Show loading if user is not loaded yet
  if (!user || currentUser === undefined) {
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

  // Get available preferences for each select (excluding already selected ones)
  const getAvailablePreferences = (currentField: string) => {
    const selectedPreferences = [formData.preference1, formData.preference2, formData.preference3]
      .filter((pref, index) => {
        const fields = ['preference1', 'preference2', 'preference3'];
        return pref && fields[index] !== currentField;
      });

    return PREFERENCES.filter(pref => !selectedPreferences.includes(pref));
  };

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
            <User className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Player Registration</h1>
            <p className="text-muted-foreground mb-4">
              Register yourself for "{auction.auctionName}" and showcase your skills
            </p>

            {/* User Info */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">
                  {user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress}
                </span>
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Auction Status</div>
                    <Badge className="mt-1">
                      {auction.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Registered Teams</div>
                    <div className="flex items-center justify-center mt-1">
                      <Trophy className="w-4 h-4 mr-1 text-primary" />
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
              Player registration is not available for this auction.
              Current status: <strong>{auction.status}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* User not found in database warning */}
        {!currentUser && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your user profile was not found in the database.
              Please ensure you have completed your profile setup before registering as a player.
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={!canRegister || isSubmitting || !currentUser}
                className="w-full"
              />
            </div>

            {/* Year and Branch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2nd Year, 3rd Year"
                  disabled={!canRegister || isSubmitting || !currentUser}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => handleSelectChange('branch', value)}
                  disabled={!canRegister || isSubmitting || !currentUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <Label className="text-base font-medium">Competition Preferences *</Label>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Select your top 3 competition preferences in order of priority
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preference1">First Preference *</Label>
                  <Select
                    value={formData.preference1}
                    onValueChange={(value) => handleSelectChange('preference1', value)}
                    disabled={!canRegister || isSubmitting || !currentUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your first preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePreferences('preference1').map((preference) => (
                        <SelectItem key={preference} value={preference}>
                          {preference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preference2">Second Preference *</Label>
                  <Select
                    value={formData.preference2}
                    onValueChange={(value) => handleSelectChange('preference2', value)}
                    disabled={!canRegister || isSubmitting || !currentUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your second preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePreferences('preference2').map((preference) => (
                        <SelectItem key={preference} value={preference}>
                          {preference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preference3">Third Preference *</Label>
                  <Select
                    value={formData.preference3}
                    onValueChange={(value) => handleSelectChange('preference3', value)}
                    disabled={!canRegister || isSubmitting || !currentUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your third preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePreferences('preference3').map((preference) => (
                        <SelectItem key={preference} value={preference}>
                          {preference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <Label htmlFor="achievement">Achievements & Skills</Label>
              <Textarea
                id="achievement"
                name="achievement"
                value={formData.achievement}
                onChange={handleInputChange}
                placeholder="Describe your relevant achievements, skills, projects, or experiences..."
                disabled={!canRegister || isSubmitting || !currentUser}
                className="w-full min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This will help teams understand your capabilities during the auction
              </p>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Player registration successful!</p>
                    <p className="text-sm">
                      You have been registered for the auction. Teams can now bid for you during the auction phase.
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
              disabled={!canRegister || isSubmitting || validateForm() !== null || !currentUser}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering Player...
                </div>
              ) : (
                'Register as Player'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">What happens after registration?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Auction Pool</p>
                  <p className="text-sm text-muted-foreground">
                    You'll be added to the player pool for teams to discover and bid on
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Team Selection</p>
                  <p className="text-sm text-muted-foreground">
                    During the auction phase, teams will bid to recruit you based on your skills and preferences
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