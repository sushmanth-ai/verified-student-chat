import React, { useState, useEffect } from 'react';
import { Heart, Search, Filter, Plus, TrendingUp, Target, Users, Clock } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
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

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  imageUrl?: string;
  createdBy: string;
  creatorName: string;
  creatorPhoto?: string;
  createdAt: any;
  likes: string[];
  donations: number;
}

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
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
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
    
    const campaignRef = doc(db, 'campaigns', campaignId);
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
    
    try {
      // Generate UPI payment link
      const upiId = "campusmedia@upi"; // Replace with your actual UPI ID
      const payeeName = "Campus Media Fund";
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Donation for ${selectedCampaign.title}`)}`;
      
      // Try to open UPI app
      try {
        window.location.href = upiUrl;
        
        // Show success message and update campaign (in real app, this should be done after payment confirmation)
        toast({ 
          title: "UPI Payment Initiated!", 
          description: `Opening UPI app for ₹${amount} donation. Complete the payment in your UPI app.` 
        });
        
        // Simulate successful payment after 3 seconds (in real app, use webhooks)
        setTimeout(async () => {
          const campaignRef = doc(db, 'campaigns', selectedCampaign.id);
          await updateDoc(campaignRef, { 
            raisedAmount: increment(amount),
            donations: increment(1)
          });
          
          // Add donation record
          await addDoc(collection(db, 'campaigns', selectedCampaign.id, 'donations'), {
            donorId: user.uid,
            donorName: user.displayName || 'Anonymous',
            amount,
            timestamp: new Date(),
            message: 'Thank you for this amazing initiative!',
            paymentMethod: 'UPI'
          });
          
          toast({ 
            title: "Donation Successful!", 
            description: `₹${amount} donated successfully via UPI` 
          });
        }, 3000);
        
      } catch (error) {
        // Fallback if UPI app is not available
        toast({ 
          title: "UPI App Not Found", 
          description: "Please install a UPI app like Google Pay, PhonePe, or Paytm to make donations.", 
          variant: "destructive" 
        });
      }
      
      setShowDonationModal(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error('Error processing donation:', error);
      toast({ title: "Error", description: "Failed to process donation", variant: "destructive" });
    }
  };

  const topCampaigns = [...campaigns]
    .sort((a, b) => (b.raisedAmount / b.goalAmount) - (a.raisedAmount / a.goalAmount))
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
            <p className="text-sm text-muted-foreground mt-1">Support campus initiatives</p>
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
                        {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%
                      </Badge>
                    </div>
                    <Progress value={(campaign.raisedAmount / campaign.goalAmount) * 100} className="h-2 sm:h-3 mb-2" />
                    <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>₹{campaign.raisedAmount.toLocaleString()}</span>
                      <span>₹{campaign.goalAmount.toLocaleString()}</span>
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
                <CampaignCard 
                  key={campaign.id}
                  campaign={campaign}
                  onLike={() => handleLike(campaign.id)}
                  onDonate={() => {
                    setSelectedCampaign(campaign);
                    setShowDonationModal(true);
                  }}
                  isLiked={campaign.likes.includes(user?.uid || '')}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="w-[95vw] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Heart size={14} className="text-white" />
              </div>
              Make a Donation via UPI
            </DialogTitle>
          </DialogHeader>
          <UPIPayment 
            campaign={selectedCampaign}
            onDonate={handleDonate}
            onClose={() => setShowDonationModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Campaign Card Component
const CampaignCard = ({ campaign, onLike, onDonate, isLiked }: {
  campaign: Campaign;
  onLike: () => void;
  onDonate: () => void;
  isLiked: boolean;
}) => {
  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100;
  
  return (
    <div className="bg-card rounded-xl p-3 sm:p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Campaign Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-primary">
              {campaign.creatorName[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs sm:text-sm truncate">{campaign.creatorName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(campaign.createdAt?.toDate()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 ml-2">
          {campaign.category}
        </Badge>
      </div>

      {/* Campaign Content */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">{campaign.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">₹{campaign.raisedAmount.toLocaleString()}</span>
            <span className="text-muted-foreground">₹{campaign.goalAmount.toLocaleString()}</span>
          </div>
          <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {campaign.donations} donors
            </span>
            <span>{Math.round(progressPercentage)}% funded</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart size={16} className={isLiked ? 'fill-current' : ''} />
              <span className="hidden sm:inline">{campaign.likes.length}</span>
              <span className="sm:hidden">{campaign.likes.length > 0 && campaign.likes.length}</span>
            </button>
          </div>
          <Button
            onClick={onDonate}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg px-3 sm:px-4 text-xs sm:text-sm"
          >
            Donate
          </Button>
        </div>
      </div>
    </div>
  );
};

// Create Campaign Modal Component
const CreateCampaignModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    category: 'education'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'campaigns'), {
        ...formData,
        goalAmount: parseInt(formData.goalAmount),
        raisedAmount: 0,
        createdBy: user.uid,
        creatorName: user.displayName || 'Anonymous',
        creatorPhoto: user.photoURL,
        createdAt: new Date(),
        likes: [],
        donations: 0
      });

      toast({ title: "Campaign Created!", description: "Your campaign is now live" });
      onClose();
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
          <Label htmlFor="goalAmount" className="text-sm font-medium">Goal Amount (₹)</Label>
          <Input
            id="goalAmount"
            type="number"
            value={formData.goalAmount}
            onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
            placeholder="50000"
            className="w-full"
            required
          />
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
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600">
            Create Campaign
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FundRaisingScreen;