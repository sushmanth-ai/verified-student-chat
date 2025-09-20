import React, { useState } from 'react';
import { Smartphone, CreditCard, QrCode, CheckCircle, AlertCircle, Heart, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  creatorName: string;
}

interface UPIPaymentProps {
  campaign: Campaign | null;
  onDonate: (amount: number) => void;
  onClose: () => void;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({ campaign, onDonate, onClose }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'amount' | 'processing' | 'success'>('amount');
  const { toast } = useToast();

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];
  const upiApps = [
    { name: 'Google Pay', color: 'from-blue-500 to-blue-600', icon: '💳' },
    { name: 'PhonePe', color: 'from-purple-500 to-purple-600', icon: '📱' },
    { name: 'Paytm', color: 'from-blue-600 to-cyan-500', icon: '💰' },
    { name: 'BHIM', color: 'from-orange-500 to-red-500', icon: '🏛️' },
  ];

  const handleDonate = async () => {
    const donationAmount = parseInt(amount);
    if (!donationAmount || donationAmount < 1) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid donation amount", 
        variant: "destructive" 
      });
      return;
    }

    if (donationAmount < 10) {
      toast({ 
        title: "Minimum Amount", 
        description: "Minimum donation amount is ₹10", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Generate UPI payment link
      const upiId = "campusmedia@upi"; // Replace with your actual UPI ID
      const payeeName = "Campus Media Fund";
      const transactionNote = `Donation for ${campaign?.title}`;
      
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      
      // Check if device supports UPI
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, try to open UPI app
        window.location.href = upiUrl;
        
        toast({ 
          title: "Opening UPI App", 
          description: "Complete the payment in your UPI app to finish the donation." 
        });
        
        // Show processing state
        setTimeout(() => {
          setPaymentStep('success');
          setTimeout(() => {
            onDonate(donationAmount);
            setPaymentStep('amount');
            setIsProcessing(false);
          }, 2000);
        }, 1000);
        
      } else {
        // On desktop, show QR code or instructions
        toast({ 
          title: "UPI Payment Link Generated", 
          description: "Use your mobile device to scan QR code or copy the UPI link." 
        });
        
        // For demo purposes, simulate successful payment
        setTimeout(() => {
          setPaymentStep('success');
          setTimeout(() => {
            onDonate(donationAmount);
            setPaymentStep('amount');
            setIsProcessing(false);
          }, 2000);
        }, 1500);
      }
      
    } catch (error) {
      console.error('UPI payment error:', error);
      toast({ 
        title: "Payment Failed", 
        description: "Unable to initiate UPI payment. Please try again.", 
        variant: "destructive" 
      });
      setPaymentStep('amount');
      setIsProcessing(false);
    }
  };

  const copyUPILink = () => {
    if (!campaign) return;
    
    const donationAmount = parseInt(amount);
    if (!donationAmount) return;
    
    const upiId = "campusmedia@upi";
    const payeeName = "Campus Media Fund";
    const transactionNote = `Donation for ${campaign.title}`;
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    navigator.clipboard.writeText(upiUrl).then(() => {
      toast({ 
        title: "UPI Link Copied!", 
        description: "Paste this link in any UPI app to complete the donation." 
      });
    });
  };

  if (!campaign) return null;

  if (paymentStep === 'processing') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Smartphone size={32} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Processing Payment</h3>
          <p className="text-sm text-muted-foreground">Opening your UPI app...</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Smartphone size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">UPI Payment Initiated</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Amount: ₹{amount}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Opening UPI app...</span>
              <span className="text-blue-600">●</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {upiApps.map((app, index) => (
            <div key={app.name} className={`bg-gradient-to-r ${app.color} rounded-xl p-3 text-white text-center opacity-80`}>
              <div className="text-2xl mb-1">{app.icon}</div>
              <p className="text-xs font-medium">{app.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="space-y-6 p-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle size={32} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-green-600 mb-2">Payment Successful!</h3>
          <p className="text-sm text-muted-foreground">Thank you for your generous donation of ₹{amount}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-green-800 dark:text-green-200 font-medium text-sm">
            Your contribution will make a real difference!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Campaign Info */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <h3 className="font-semibold text-base line-clamp-2">{campaign.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">by {campaign.creatorName}</p>
        
        <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="font-medium">Raised: ₹{campaign.raisedAmount.toLocaleString()}</span>
            <span className="text-muted-foreground">Goal: ₹{campaign.goalAmount.toLocaleString()}</span>
          </div>
          <Progress value={(campaign.raisedAmount / campaign.goalAmount) * 100} className="h-2" />
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}% funded
            </Badge>
          </div>
        </div>
      </div>

      {/* UPI Payment Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Smartphone size={14} className="text-white" />
            </div>
            <h4 className="font-semibold text-sm">UPI Payment</h4>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Instant
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
                <CreditCard size={14} />
                Donation Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min ₹10)"
                className="w-full mt-1"
                min="10"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map(quickAmount => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs p-2 h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                >
                  ₹{quickAmount}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPI Apps Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-muted-foreground" />
          <p className="text-sm font-medium">Supported UPI Apps</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {upiApps.map((app) => (
            <div key={app.name} className={`bg-gradient-to-br ${app.color} rounded-lg p-2 text-white text-center shadow-md`}>
              <div className="text-lg mb-1">{app.icon}</div>
              <p className="text-xs font-medium">{app.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">How it works:</p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Enter donation amount</li>
              <li>• Click "Donate via UPI"</li>
              <li>• Complete payment in your UPI app</li>
              <li>• Donation will be added to campaign</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose} 
          className="flex-1 text-sm rounded-xl"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleDonate}
          disabled={!amount || parseInt(amount) < 10 || isProcessing}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Smartphone size={16} />
              <span>Donate via UPI</span>
              <ArrowRight size={14} />
            </div>
          )}
        </Button>
      </div>

      {/* Desktop UPI Link Copy */}
      {amount && parseInt(amount) >= 10 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={copyUPILink}
            className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
          >
            <QrCode size={14} className="mr-2" />
            Copy UPI Payment Link
          </Button>
        </div>
      )}
    </div>
  );
};