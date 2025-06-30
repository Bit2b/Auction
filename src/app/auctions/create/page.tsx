'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Id } from '@/../convex/_generated/dataModel'

export default function CreateAuctionPage() {
  const { userId } = useAuth()
  const createAuction = useMutation(api.auctions.createAuction)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    auctionName: '',
    starting: '',
    ending: '',
    startingCoin: '1000',
    status: 'registering' as 'registering' | 'live' | 'ended' | 'idle'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: 'registering' | 'live' | 'ended' | 'idle') => {
    setFormData(prev => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!userId) {
      toast.error('Authentication required', {
        description: 'Please sign in to create auctions',
      })
      return
    }

    // Validate auction name
    if (!formData.auctionName.trim()) {
      toast.error('Auction name required', {
        description: 'Please enter a valid auction name',
      })
      return
    }

    // Validate starting coin
    const startingCoin = parseInt(formData.startingCoin)
    if (isNaN(startingCoin) || startingCoin <= 0) {
      toast.error('Invalid starting coin', {
        description: 'Please enter a positive number',
      })
      return
    }

    // Validate dates
    if (!formData.starting || !formData.ending) {
      toast.error('Dates required', {
        description: 'Please select both starting and ending times',
      })
      return
    }

    const startDate = new Date(formData.starting)
    const endDate = new Date(formData.ending)
    const now = new Date()

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error('Invalid dates', {
        description: 'Please select valid dates',
      })
      return
    }

    if (startDate >= endDate) {
      toast.error('Invalid schedule', {
        description: 'Ending time must be after starting time',
      })
      return
    }

    // Optional: Check if start date is in the future for live auctions
    if (formData.status === 'live' && startDate <= now) {
      toast.error('Invalid start time', {
        description: 'Live auctions should start in the future',
      })
      return
    }

    try {
      setLoading(true)

      // Call mutation with all required fields
      const newAuctionId = await createAuction({
        auctionName: formData.auctionName.trim(),
        teams: [], // Initialize empty array
        teamRequests: [], // Initialize empty array
        starting: formData.starting,
        ending: formData.ending,
        auctioneer: userId, // Pass user ID string
        startingCoin: startingCoin,
        status: formData.status
      })

      toast.success('Auction created successfully!', {
        description: `${formData.auctionName} is now ready for participants`,
        action: {
          label: 'View Auction',
          onClick: () => router.push(`/auctions/${newAuctionId}`),
        },
      })

      // Reset form
      setFormData({
        auctionName: '',
        starting: '',
        ending: '',
        startingCoin: '1000',
        status: 'registering'
      })

      // Redirect to auction detail page
      router.push(`/auctions/${newAuctionId}`)
    } catch (err) {
      console.error('Error creating auction:', err)

      // Handle specific error messages from mutation
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      toast.error('Creation failed', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get minimum date (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Create New Auction</h1>
        <p className="text-muted-foreground mt-2">
          Set up your auction details and schedule
        </p>
      </div>

      <Card className="bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Auction Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="auctionName">Auction Name *</Label>
                <Input
                  id="auctionName"
                  name="auctionName"
                  placeholder="Summer Player Auction"
                  required
                  className="mt-1"
                  value={formData.auctionName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="starting">Starting Time *</Label>
                  <Input
                    id="starting"
                    name="starting"
                    type="datetime-local"
                    required
                    className="mt-1"
                    value={formData.starting}
                    onChange={handleChange}
                    min={getMinDateTime()}
                  />
                </div>

                <div>
                  <Label htmlFor="ending">Ending Time *</Label>
                  <Input
                    id="ending"
                    name="ending"
                    type="datetime-local"
                    required
                    className="mt-1"
                    value={formData.ending}
                    onChange={handleChange}
                    min={formData.starting || getMinDateTime()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="startingCoin">Starting Coin per Team *</Label>
                  <Input
                    id="startingCoin"
                    name="startingCoin"
                    type="number"
                    min="1"
                    required
                    className="mt-1"
                    value={formData.startingCoin}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registering">Registering</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !userId}
              className="w-full mt-2 py-6 text-base"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Auction...
                </span>
              ) : (
                'Create Auction'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}