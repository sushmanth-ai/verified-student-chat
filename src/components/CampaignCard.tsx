import React from 'react';
import { Heart, Users, Calendar, Target } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  upiId: string;
  organizer: string;
  organizerName: string;
  category: string;
  createdBy: string;
  creatorName: string;
  creatorPhoto?: string;
  createdAt: any;
  likes: string[];
  donations: number;
}

interface CampaignCardProps {
  campaign: Campaign;
  onDonate: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  onDonate, 
  onLike, 
  isLiked = false 
}) => {
  const progressPercentage = (campaign.raised / campaign.target) * 100;
  const isCompleted = progressPercentage >= 100;
  
  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Campaign Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full flex items-center justify-center shrink-0">
            {campaign.creatorPhoto ? (
              <img 
                src={campaign.creatorPhoto} 
                alt={campaign.creatorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {campaign.creatorName[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{campaign.organizerName || campaign.creatorName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={10} />
              {new Date(campaign.createdAt?.toDate?.() || campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {campaign.category}
          </Badge>
          {isCompleted && (
            <Badge className="bg-green-500 text-white text-xs">
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Campaign Content */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{campaign.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium flex items-center gap-1">
              <Target size={14} />
              ₹{campaign.raised.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              of ₹{campaign.target.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.min(progressPercentage, 100)} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {campaign.donations} donor{campaign.donations !== 1 ? 's' : ''}
            </span>
            <span className="font-medium">
              {Math.round(progressPercentage)}% funded
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            {onLike && (
              <button
                onClick={onLike}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                <span>{campaign.likes.length > 0 && campaign.likes.length}</span>
              </button>
            )}
          </div>
          <Button
            onClick={onDonate}
            size="sm"
            disabled={isCompleted}
            className={`px-6 text-sm rounded-lg ${
              isCompleted 
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
            }`}
          >
            {isCompleted ? 'Completed' : 'Donate Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};