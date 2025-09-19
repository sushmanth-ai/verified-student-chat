import React, { useState } from 'react';
import { Smartphone, CreditCard, QrCode, CheckCircle, AlertCircle, Heart, ArrowRight, Copy, ExternalLink } from 'lucide-react';
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
  const [paymentStep, setPaymentStep] = useState<'amount' | 'upi-details' | 'confirm' | 'success'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'upi-link' | 'manual'>('upi-link');
  const { toast } = useToast();

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];
  const upiApps = [
    { name: 'Google Pay', color: 'from-blue-500 to-blue-600', icon: '💳' },
    { name: 'PhonePe', color: 'from-purple-500 to-purple-600', icon: '📱' },
    { name: 'Paytm', color: 'from-blue-600 to-cyan-500', icon: '💰' },
    { name: 'BHIM', color: 'from-orange-500 to-red-500', icon: '🏛️' },
  ];

  // UPI ID for receiving payments
  const upiId = "sushmanth1106@okhdfcbank";
  const payeeName = "Campus Media Fund";

  const validateAmount = () => {
    const donationAmount = parseInt(amount);
    if (!donationAmount || donationAmount < 1) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid donation amount", 
        variant: "destructive" 
      });
      return false;
    }

    if (donationAmount < 10) {
      toast({ 
        title: "Minimum Amount", 
        description: "Minimum donation amount is ₹10", 
        variant: "destructive" 
      });
      return false;
    }

    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateAmount()) return;
    setPaymentStep('upi-details');
  };

  const handleUPILinkPayment = () => {
    const donationAmount = parseInt(amount);
    const transactionNote = `Donation for ${campaign?.title || 'Campaign'}`;
    const tr = `CM${Date.now()}`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${tr}`;
    
    setIsProcessing(true);
    
    // Try to open UPI app
    try {
      window.open(upiUrl, '_self');
      
      toast({ 
        title: "Opening UPI App", 
        description: "Complete the payment and return here to confirm." 
      });
      
      // After 3 seconds, show confirmation step
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentStep('confirm');
      }, 3000);
      
    } catch (error) {
      setIsProcessing(false);
      toast({ 
        title: "Error", 
        description: "Could not open UPI app. Please try manual payment.", 
        variant: "destructive" 
      });
      setPaymentMethod('manual');
    }
  };

  const copyUPIDetails = () => {
    const details = `UPI ID: ${upiId}\nAmount: ₹${amount}\nNote: Donation for ${campaign?.title}`;
    navigator.clipboard.writeText(details).then(() => {
      toast({ 
        title: "Details Copied!", 
        description: "UPI details copied to clipboard. Open any UPI app to pay." 
      });
    });
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      toast({ 
        title: "UPI ID Copied!", 
        description: "Paste this in your UPI app to make payment." 
      });
    });
  };

  const handlePaymentConfirm = (success: boolean) => {
    if (success) {
      setPaymentStep('success');
      setTimeout(() => {
        onDonate(parseInt(amount));
        setPaymentStep('amount');
        setIsProcessing(false);
        setAmount('');
        setPaymentMethod('upi-link');
      }, 2000);
    } else {
      toast({ 
        title: "Payment Cancelled", 
        description: "No worries! You can try again anytime.", 
        variant: "default" 
      });
      setPaymentStep('amount');
      setIsProcessing(false);
      setPaymentMethod('upi-link');
    }
  };

  if (!campaign) return null;

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

  if (paymentStep === 'confirm') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Confirm Payment Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Did you complete the payment of ₹{amount}?
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">Payment Details</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">UPI ID: {upiId}</p>
            </div>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Amount: ₹{amount} • Campaign: {campaign?.title}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handlePaymentConfirm(false)}
            className="flex-1 text-sm rounded-xl"
          >
            Payment Failed
          </Button>
          <Button 
            onClick={() => handlePaymentConfirm(true)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-xl"
          >
            Payment Successful
          </Button>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Please confirm only after completing the actual UPI payment in your app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === 'upi-details') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone size={32} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Choose Payment Method</h3>
          <p className="text-sm text-muted-foreground">Amount: ₹{amount}</p>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* UPI Link Method */}
            <Card className={`cursor-pointer transition-all duration-200 ${paymentMethod === 'upi-link' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} onClick={() => setPaymentMethod('upi-link')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <ExternalLink size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">UPI App Link</h4>
                    <p className="text-xs text-muted-foreground">Open directly in UPI app</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Manual Method */}
            <Card className={`cursor-pointer transition-all duration-200 ${paymentMethod === 'manual' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} onClick={() => setPaymentMethod('manual')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Copy size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Manual Payment</h4>
                    <p className="text-xs text-muted-foreground">Copy UPI ID and pay manually</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPaymentStep('amount')} 
            className="flex-1 text-sm rounded-xl"
          >
            Back
          </Button>
          <Button 
            onClick={() => {
              if (paymentMethod === 'upi-link') {
                handleUPILinkPayment();
              } else {
                setPaymentStep('confirm');
              }
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm rounded-xl"
          >
            {paymentMethod === 'upi-link' ? 'Open UPI App' : 'Continue'}
          </Button>
        </div>

        {/* Manual Payment Details */}
        {paymentMethod === 'manual' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 space-y-3">
            <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">Payment Details</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium">UPI ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{upiId}</code>
                  <Button size="sm" variant="ghost" onClick={copyUPIId} className="h-6 w-6 p-0">
                    <Copy size={12} />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold">₹{amount}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium">Note:</span>
                <span className="text-xs text-muted-foreground">Donation for {campaign?.title}</span>
              </div>
            </div>

            <Button
              onClick={copyUPIDetails}
              variant="outline"
              className="w-full text-sm"
            >
              <Copy size={14} className="mr-2" />
              Copy All Details
            </Button>
          </div>
        )}
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

      {/* Amount Selection */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <h4 className="font-semibold text-sm">Donation Amount</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
                <CreditCard size={14} />
                Amount (₹)
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

      {/* Instructions */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">How it works:</p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Enter donation amount</li>
              <li>• Choose payment method</li>
              <li>• Complete payment in UPI app</li>
              <li>• Return here to confirm</li>
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
        >
          Cancel
        </Button>
        <Button 
          onClick={handleProceedToPayment}
          disabled={!amount || parseInt(amount) < 10}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <ArrowRight size={16} />
            <span>Proceed to Pay</span>
          </div>
        </Button>
      </div>
    </div>
  );
};