import React, { useState, useEffect } from 'react';
import { Heart, Search, Filter, Plus, TrendingUp } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { UPIPayment } from './UPIPayment';
import { CampaignCard, type Campaign } from './CampaignCard';
import { DonationsList } from './DonationsList';
import { createCampaign, updateRaisedAmount, addDonation, validateUPIId } from '@/services/fundraisingService';

const FundRaisingScreen = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ['all', 'education', 'health', 'events', 'emergencies', 'sports', 'clubs', 'environment'];

  useEffect(() => {
    const q = query(collection(db, 'fundraisingCampaigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaignData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      setCampaigns(campaignData);
      setFilteredCampaigns(campaignData);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = campaigns;
    
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(campaign => campaign.category === selectedCategory);
    }
    
    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, selectedCategory]);

  const handleLike = async (campaignId: string) => {
    if (!user) return;
    
    const campaignRef = doc(db, 'fundraisingCampaigns', campaignId);
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign?.likes.includes(user.uid)) {
      const updatedLikes = campaign.likes.filter(id => id !== user.uid);
      await updateDoc(campaignRef, { likes: updatedLikes });
    } else {
      await updateDoc(campaignRef, { likes: arrayUnion(user.uid) });
    }
  };

  const handleDonate = async (amount: number) => {
    if (!user || !selectedCampaign) return;
    
    // This function will be called only when payment is confirmed successful
    await updateCampaignAfterDonation(selectedCampaign.id, amount, user);
    setShowDonationModal(false);
    setSelectedCampaign(null);
  };

  const updateCampaignAfterDonation = async (campaignId: string, amount: number, donor: any) => {
    try {
      // Update campaign raised amount
      await updateRaisedAmount(campaignId, amount);
      
      // Add donation record to subcollection
      await addDonation(campaignId, {
        donorName: donor.displayName || 'Anonymous Donor',
        amount
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({ 
        title: "Error", 
        description: "Failed to record donation", 
        variant: "destructive" 
      });
    }
  };

  const topCampaigns = [...campaigns]
    .sort((a, b) => (b.raised / b.target) - (a.raised / a.target))
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-secondary/30 to-accent/20 dark:from-background dark:via-primary/5 dark:to-secondary/10">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fund Raising
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Support campus initiatives with UPI donations</p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg w-full sm:w-auto">
                <Plus size={16} className="mr-2" />
                Start Campaign
              </Button>
            </DialogTrigger>
            <CreateCampaignModal onClose={() => setShowCreateModal(false)} />
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl bg-secondary/50 border-border/50 w-full h-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl bg-secondary/50 border-border/50 h-10">
              <Filter size={16} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-6 sm:space-y-8">
          {/* Top Campaigns */}
          {topCampaigns.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-500" />
                <h3 className="font-semibold text-base sm:text-lg">Top Campaigns</h3>
              </div>
              <div className="grid gap-3 sm:gap-4">
                {topCampaigns.map(campaign => (
                  <div key={campaign.id} className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-3 sm:p-4 border border-orange-200/50 dark:border-orange-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1 pr-2">{campaign.title}</h4>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs shrink-0">
                        {Math.round((campaign.raised / campaign.target) * 100)}%
                      </Badge>
                    </div>
                    <Progress value={(campaign.raised / campaign.target) * 100} className="h-2 sm:h-3 mb-2" />
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>₹{campaign.raised.toLocaleString()}</span>
                      <span>₹{campaign.target.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Campaigns */}
          <section className="space-y-4">
            <h3 className="font-semibold text-base sm:text-lg">All Campaigns</h3>
            <div className="grid gap-4 sm:gap-6">
              {filteredCampaigns.map(campaign => (
                <div key={campaign.id} className="space-y-4">
                  <CampaignCard 
                    campaign={campaign}
                    onLike={() => handleLike(campaign.id)}
                    onDonate={() => {
                      setSelectedCampaign(campaign);
                      setShowDonationModal(true);
                    }}
                    isLiked={campaign.likes.includes(user?.uid || '')}
                  />
                  
                  {/* Show recent donations for each campaign */}
                  <div className="ml-4">
                    <DonationsList 
                      campaignId={campaign.id}
                      totalDonations={campaign.donations}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={(open) => {
        setShowDonationModal(open);
        if (!open) {
          setSelectedCampaign(null);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-center flex items-center justify-center gap-2 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Heart size={16} className="text-white" />
              </div>
              Enter Donation Amount
            </DialogTitle>
            {selectedCampaign && (
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{selectedCampaign.title}</p>
                <p className="text-xs text-muted-foreground">
                  Supporting: {selectedCampaign.organizerName}
                </p>
              </div>
            )}
          </DialogHeader>
          <UPIPayment 
            campaign={selectedCampaign}
            onDonate={handleDonate}
            onClose={() => {
              setShowDonationModal(false);
              setSelectedCampaign(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Campaign Modal Component
const CreateCampaignModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    category: 'education',
    upiId: '',
    organizerName: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateUPIId(formData.upiId)) {
      toast({ 
        title: "Invalid UPI ID", 
        description: "Please enter a valid UPI ID (e.g., name@paytm, phone@ybl)", 
        variant: "destructive" 
      });
      return;
    }

    try {
      await createCampaign({
        title: formData.title,
        description: formData.description,
        target: parseInt(formData.target),
        upiId: formData.upiId,
        organizer: formData.organizerName,
        organizerName: formData.organizerName,
        category: formData.category,
        createdBy: user.uid,
        creatorName: user.displayName || 'Anonymous',
        creatorPhoto: user.photoURL
      });

      toast({ title: "Campaign Created!", description: "Your campaign is now live and accepting donations" });
      onClose();
      setFormData({
        title: '',
        description: '',
        target: '',
        category: 'education',
        upiId: '',
        organizerName: ''
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 p-1">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Campaign Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Help build a new library..."
            className="w-full"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Tell people about your campaign..."
            className="w-full min-h-[100px] resize-none"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="target" className="text-sm font-medium">Target Amount (₹)</Label>
          <Input
            id="target"
            type="number"
            value={formData.target}
            onChange={(e) => setFormData({...formData, target: e.target.value})}
            placeholder="50000"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizerName" className="text-sm font-medium">Organizer Name</Label>
          <Input
            id="organizerName"
            value={formData.organizerName}
            onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
            placeholder="Your name or organization"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upiId" className="text-sm font-medium">UPI ID</Label>
          <Input
            id="upiId"
            value={formData.upiId}
            onChange={(e) => setFormData({...formData, upiId: e.target.value})}
            placeholder="yourname@paytm or 9876543210@ybl"
            className="w-full"
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter your UPI ID where donations will be received (e.g., name@paytm, phone@ybl)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="emergencies">Emergencies</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="clubs">Clubs</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            Create Campaign
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FundRaisingScreen;