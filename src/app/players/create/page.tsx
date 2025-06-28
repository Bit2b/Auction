// app/players/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

export default function CreatePlayerPage() {
  const { userId } = useAuth()
  const createPlayer = useMutation(api.players.createPlayer)
  const auctions = useQuery(api.auctions.getAllAuctions)
  const [loading, setLoading] = useState(false)
  const [isSold, setIsSold] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState('')
  const [teams, setTeams] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    auctionName: '',
    teamName: '',
    price: '',
    batting: '',
    bowling: '',
    fielding: '',
    experience: '',
    role: '',
    country: '',
    description: ''
  })

  // Update teams list when auction selection changes
  useEffect(() => {
    if (selectedAuction && auctions) {
      const auction = auctions.find(a => a._id === selectedAuction)
      if (auction) {
        setFormData(prev => ({ ...prev, auctionName: auction.auctionName }))
        setTeams(auction.teams || [])
      }
    } else {
      setTeams([])
    }
  }, [selectedAuction, auctions])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    const { name, auctionName, teamName, price, batting, bowling, fielding, experience, role, country, description } = formData

    if (!userId) {
      toast.error('Authentication required', {
        description: 'Please sign in to create players',
      })
      return
    }

    if (!name || !auctionName) {
      toast.error('Missing required fields', {
        description: 'Please fill in player name and select an auction',
      })
      return
    }

    try {
      setLoading(true)
      
      // Build stats object
      const stats = {
        ...(batting && { batting: parseInt(batting) }),
        ...(bowling && { bowling: parseInt(bowling) }),
        ...(fielding && { fielding: parseInt(fielding) }),
        ...(experience && { experience: parseInt(experience) }),
        ...(role && { role }),
        ...(country && { country }),
      }

      await createPlayer({
        name,
        auctionName,
        teamName: isSold && teamName ? teamName : undefined,
        isSold,
        price: isSold && price ? parseInt(price) : undefined,
        stats: Object.keys(stats).length > 0 ? stats : undefined,
        // description: description || undefined,
      })
      
      toast.success('Player created successfully!', {
        description: `${name} has been added to ${auctionName}`,
        action: {
          label: 'View Players',
          onClick: () => window.location.href = '/players',
        },
      })
      
      // Reset form
      setFormData({
        name: '',
        auctionName: '',
        teamName: '',
        price: '',
        batting: '',
        bowling: '',
        fielding: '',
        experience: '',
        role: '',
        country: '',
        description: ''
      })
      setIsSold(false)
      setSelectedAuction('')
    } catch (err) {
      console.error(err)
      toast.error('Creation failed', {
        description: err instanceof Error ? err.message : 'Could not create player. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Add New Player</h1>
        <p className="text-muted-foreground mt-2">
          Register a player for auction participation
        </p>
      </div>

      <Card className="bg-background/50 backdrop-blur-sm border border-muted">
        <CardHeader>
          <CardTitle className="text-xl">Player Information</CardTitle>
          <CardDescription>
            Fill in the details below to add a new player to the auction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Player Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Virat Kohli" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Full name of the player
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auction">Auction *</Label>
                <Select 
                  value={selectedAuction}
                  onValueChange={setSelectedAuction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an auction" />
                  </SelectTrigger>
                  <SelectContent>
                    {auctions?.map(auction => (
                      <SelectItem key={auction._id} value={auction._id}>
                        {auction.auctionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the auction this player is participating in
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role">Primary Role</Label>
                <Select 
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                    <SelectItem value="Wicketkeeper">Wicketkeeper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  placeholder="India" 
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Player Description</Label>
              <Textarea 
                id="description" 
                placeholder="Player's achievements, strengths, etc." 
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="border-t border-muted pt-6">
              <div className="flex items-center space-x-2 mb-6">
                <Switch
                  id="isSold"
                  checked={isSold}
                  onCheckedChange={setIsSold}
                />
                <Label htmlFor="isSold" className="text-base">
                  Player has been sold
                </Label>
              </div>

              {isSold && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Select 
                      value={formData.teamName}
                      onValueChange={(value) => handleInputChange('teamName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Sold Price (₹)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="15000000" 
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-muted pt-6">
              <h3 className="text-lg font-medium mb-4">Player Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="batting">Batting Rating</Label>
                  <Input 
                    id="batting" 
                    type="number" 
                    min="1" 
                    max="100" 
                    placeholder="85" 
                    value={formData.batting}
                    onChange={(e) => handleInputChange('batting', e.target.value)}
                  />
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${formData.batting || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bowling">Bowling Rating</Label>
                  <Input 
                    id="bowling" 
                    type="number" 
                    min="1" 
                    max="100" 
                    placeholder="75" 
                    value={formData.bowling}
                    onChange={(e) => handleInputChange('bowling', e.target.value)}
                  />
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${formData.bowling || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fielding">Fielding Rating</Label>
                  <Input 
                    id="fielding" 
                    type="number" 
                    min="1" 
                    max="100" 
                    placeholder="90" 
                    value={formData.fielding}
                    onChange={(e) => handleInputChange('fielding', e.target.value)}
                  />
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${formData.fielding || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input 
                    id="experience" 
                    type="number" 
                    min="0" 
                    max="30" 
                    placeholder="12" 
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                  />
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${(parseInt(formData.experience) || 0) * 3.33}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="min-w-[150px]"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Player...
                  </>
                ) : (
                  'Add Player'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}