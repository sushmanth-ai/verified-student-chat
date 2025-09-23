import React, { useState, useEffect } from 'react';
import { Users, Heart, Clock } from 'lucide-react';
import { fetchDonations, type Donation } from '@/services/fundraisingService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

interface DonationsListProps {
  campaignId: string;
  totalDonations: number;
}

export const DonationsList: React.FC<DonationsListProps> = ({ campaignId, totalDonations }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const donationsData = await fetchDonations(campaignId);
        setDonations(donationsData);
      } catch (error) {
        console.error('Error loading donations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, [campaignId]);

  const displayedDonations = showAll ? donations : donations.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users size={16} />
            Donations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <Heart size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No donations yet. Be the first to support this campaign!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} />
            Recent Donations
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalDonations} donor{totalDonations !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedDonations.map((donation, index) => (
          <div key={donation.id || index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Heart size={12} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">{donation.donorName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(donation.timestamp.toDate?.() || donation.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              ₹{donation.amount.toLocaleString()}
            </Badge>
          </div>
        ))}
        
        {donations.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-xs text-primary hover:underline py-2"
          >
            {showAll ? 'Show Less' : `Show All ${donations.length} Donations`}
          </button>
        )}
      </CardContent>
    </Card>
  );
};