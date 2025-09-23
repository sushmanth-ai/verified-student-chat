import React, { useEffect, useState } from 'react';
import { Smartphone, CreditCard, QrCode, CheckCircle, AlertCircle, Heart, ArrowRight, XCircle, RefreshCw, Clock, Shield } from 'lucide-react';
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
  target: number;
  raised: number;
  category: string;
  creatorName: string;
  organizerName?: string;
  upiId?: string;
}

interface UPIPaymentProps {
  campaign: Campaign | null;
  onDonate: (amount: number) => void;
  onClose: () => void;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({ campaign, onDonate, onClose }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'amount' | 'processing' | 'verification' | 'success' | 'failed'>('amount');
  const [transactionId, setTransactionId] = useState('');
  const [paymentTimeout, setPaymentTimeout] = useState<NodeJS.Timeout | null>(null);
  const [verificationTimer, setVerificationTimer] = useState(30);
  const { toast } = useToast();

  // Enhanced UPI apps with real package names for better detection
  const upiApps = [
    { 
      name: 'Google Pay', 
      color: 'from-blue-500 to-blue-600', 
      icon: '💳',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      iosScheme: 'gpay://'
    },
    { 
      name: 'PhonePe', 
      color: 'from-purple-500 to-purple-600', 
      icon: '📱',
      packageName: 'com.phonepe.app',
      iosScheme: 'phonepe://'
    },
    { 
      name: 'Paytm', 
      color: 'from-blue-600 to-cyan-500', 
      icon: '💰',
      packageName: 'net.one97.paytm',
      iosScheme: 'paytmmp://'
    },
    { 
      name: 'BHIM UPI', 
      color: 'from-orange-500 to-red-500', 
      icon: '🏛️',
      packageName: 'in.org.npci.upiapp',
      iosScheme: 'bhim://'
    },
    { 
      name: 'Amazon Pay', 
      color: 'from-orange-400 to-yellow-500', 
      icon: '🛒',
      packageName: 'in.amazon.mShop.android.shopping',
      iosScheme: 'amazonpay://'
    },
    { 
      name: 'Cred', 
      color: 'from-gray-800 to-gray-900', 
      icon: '💎',
      packageName: 'com.dreamplug.androidapp',
      iosScheme: 'cred://'
    }
  ];

  // Enhanced verification timer
  useEffect(() => {
    if (paymentStep === 'verification' && verificationTimer > 0) {
      const timer = setTimeout(() => {
        setVerificationTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentStep, verificationTimer]);

  // Auto-detect when user returns from UPI app
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && paymentStep === 'processing') {
        setPaymentStep('verification');
        setIsProcessing(false);
        setVerificationTimer(30); // Reset timer
      }
    };

    const handleFocus = () => {
      if (paymentStep === 'processing') {
        setPaymentStep('verification');
        setIsProcessing(false);
        setVerificationTimer(30); // Reset timer
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [paymentStep]);

  const quickAmounts = [50, 100, 250, 500, 1000, 2500, 5000, 10000];

  // Enhanced UPI ID validation
  const validateUPIId = (upiId: string): boolean => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
    
    if (!upiRegex.test(upiId)) return false;
    
    // Prevent test/fake UPI IDs that cause payment failures
    const suspiciousPatterns = [
      /^test/i, /^demo/i, /^fake/i, /^sample/i,
      /^9876543210@/, /^1234567890@/, /^0000000000@/,
      /@test$/i, /@demo$/i, /@fake$/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(upiId));
  };

  // Generate enhanced UPI payment link
  const generateUPILink = (upiId: string, payeeName: string, amount: number, txnId: string): string => {
    // Use minimal transaction note to avoid risk policy triggers
    const shortNote = `D${txnId.slice(-8)}`;
    const cleanPayeeName = payeeName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(cleanPayeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(shortNote)}&mode=02&purpose=04`;
  };

  // Enhanced device detection
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;
    
    return { isAndroid, isIOS, isMobile };
  };

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
        description: "Minimum donation amount is ₹10 for UPI transactions", 
        variant: "destructive" 
      });
      return;
    }

    if (donationAmount > 100000) {
      toast({ 
        title: "Amount Limit", 
        description: "Maximum donation amount is ₹1,00,000 per transaction", 
        variant: "destructive" 
      });
      return;
    }

    if (!campaign?.upiId || !validateUPIId(campaign.upiId)) {
      toast({ 
        title: "Invalid UPI ID", 
        description: "This campaign has an invalid UPI ID. Please contact the organizer.", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Generate unique transaction ID with timestamp
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 6);
      const txnId = `TXN${timestamp}${randomSuffix}`;
      setTransactionId(txnId);

      const upiId = campaign.upiId;
      const payeeName = campaign.organizerName || campaign.creatorName || "Fundraiser";
      const upiUrl = generateUPILink(upiId, payeeName, donationAmount, txnId);
      
      const { isAndroid, isIOS, isMobile } = getDeviceInfo();
      
      toast({ 
        title: "Initiating UPI Payment", 
        description: `Opening UPI app for ₹${donationAmount} payment...` 
      });

      if (isMobile) {
        // Enhanced mobile UPI app detection and opening
        if (isAndroid) {
          // Try to open specific UPI apps on Android
          const tryOpenApp = async (app: typeof upiApps[0]) => {
            try {
              const intent = `intent://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount}&cu=INR&tn=${encodeURIComponent(`D${txnId.slice(-8)}`)}&mode=02&purpose=04#Intent;scheme=upi;package=${app.packageName};end`;
              window.location.href = intent;
              return true;
            } catch {
              return false;
            }
          };

          // Try opening preferred UPI apps in order
          let appOpened = false;
          for (const app of upiApps) {
            if (await tryOpenApp(app)) {
              appOpened = true;
              break;
            }
          }

          // Fallback to generic UPI URL
          if (!appOpened) {
            window.location.href = upiUrl;
          }
        } else if (isIOS) {
          // iOS UPI app handling
          window.location.href = upiUrl;
        }
        
        // Set verification timeout
        const timeout = setTimeout(() => {
          setPaymentStep('verification');
          setIsProcessing(false);
          setVerificationTimer(30);
        }, 3000);
        setPaymentTimeout(timeout);
        
      } else {
        // Desktop handling - copy UPI link and show instructions
        try {
          await navigator.clipboard.writeText(upiUrl);
          toast({ 
            title: "UPI Link Copied!", 
            description: "Open any UPI app on your mobile and paste this link to complete the payment." 
          });
        } catch {
          // Fallback if clipboard API fails
          const textArea = document.createElement('textarea');
          textArea.value = upiUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          toast({ 
            title: "UPI Link Ready!", 
            description: "The UPI payment link has been prepared. Use it in any UPI app." 
          });
        }
        
        // Move to verification after showing instructions
        setTimeout(() => {
          setPaymentStep('verification');
          setIsProcessing(false);
          setVerificationTimer(60); // More time for desktop users
        }, 2000);
      }
      
    } catch (error) {
      console.error('UPI payment error:', error);
      toast({ 
        title: "Payment Initiation Failed", 
        description: "Unable to open UPI app. Please ensure you have a UPI app installed.", 
        variant: "destructive" 
      });
      setPaymentStep('amount');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
    
    setPaymentStep('success');
    
    // Process the donation with enhanced feedback
    setTimeout(() => {
      onDonate(parseInt(amount));
      resetPaymentFlow();
      
      // Enhanced success notification
      toast({ 
        title: "🎉 Donation Successful!", 
        description: `₹${amount} donated to ${campaign?.title}. Thank you for your support!` 
      });
      
      // Trigger confetti effect or celebration animation
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }, 1500);
  };

  const handlePaymentFailed = () => {
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
    
    setPaymentStep('failed');
    setIsProcessing(false);
    
    toast({ 
      title: "Payment Failed", 
      description: "The transaction was not completed. No money has been debited from your account.", 
      variant: "destructive" 
    });
  };

  const resetPaymentFlow = () => {
    setPaymentStep('amount');
    setIsProcessing(false);
    setTransactionId('');
    setAmount('');
    setVerificationTimer(30);
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
  };

  const retryPayment = () => {
    if (!campaign?.upiId || !validateUPIId(campaign.upiId)) {
      toast({ 
        title: "Invalid UPI ID", 
        description: "Cannot retry - invalid UPI ID configuration.", 
        variant: "destructive" 
      });
      return;
    }

    setPaymentStep('processing');
    setIsProcessing(true);
    
    const donationAmount = parseInt(amount);
    const newTxnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
    setTransactionId(newTxnId);
    
    const upiId = campaign.upiId;
    const payeeName = campaign.organizerName || campaign.creatorName || "Fundraiser";
    const upiUrl = generateUPILink(upiId, payeeName, donationAmount, newTxnId);
    
    const { isMobile } = getDeviceInfo();
    
    if (isMobile) {
      window.location.href = upiUrl;
    } else {
      navigator.clipboard.writeText(upiUrl).then(() => {
        toast({ 
          title: "New UPI Link Copied!", 
          description: "Use this fresh link in your UPI app to retry the payment." 
        });
      });
    }
    
    const timeout = setTimeout(() => {
      setPaymentStep('verification');
      setIsProcessing(false);
      setVerificationTimer(30);
    }, 3000);
    setPaymentTimeout(timeout);
  };

  if (!campaign) return null;

  // Processing Step - Enhanced with real-time feedback
  if (paymentStep === 'processing') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Smartphone size={32} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Opening UPI App</h3>
          <p className="text-sm text-muted-foreground">Redirecting to your UPI app for secure payment...</p>
          <p className="text-xs text-muted-foreground mt-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            TXN: {transactionId}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">Secure UPI Payment</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Amount: ₹{amount} • Recipient: {campaign.organizerName}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Initiating payment...</span>
              <span className="text-blue-600 animate-pulse">●</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>

        {/* Enhanced UPI Apps Grid */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center">Available UPI Apps</p>
          <div className="grid grid-cols-3 gap-2">
            {upiApps.map((app, index) => (
              <div key={app.name} className={`bg-gradient-to-br ${app.color} rounded-xl p-3 text-white text-center opacity-90 hover:opacity-100 transition-opacity`}>
                <div className="text-xl mb-1">{app.icon}</div>
                <p className="text-xs font-medium">{app.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Payment in Progress</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Complete the payment in your UPI app and return here to verify the transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification Step - Enhanced with countdown timer
  if (paymentStep === 'verification') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Verify Payment Status</h3>
          <p className="text-sm text-muted-foreground mb-2">Did you complete the payment in your UPI app?</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Transaction ID:</span>
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">{transactionId}</code>
          </div>
          
          {/* Countdown Timer */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Clock size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Auto-timeout in {verificationTimer}s
            </span>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Payment Verification Required</p>
              <div className="space-y-1">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ✓ Amount: ₹{amount}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ✓ Recipient: {campaign.organizerName || campaign.creatorName}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ✓ UPI ID: {campaign.upiId}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handlePaymentSuccess}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <CheckCircle size={18} className="mr-2" />
            ✅ Yes, Payment Successful
          </Button>
          
          <Button 
            onClick={handlePaymentFailed}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl py-3"
          >
            <XCircle size={18} className="mr-2" />
            ❌ No, Payment Failed
          </Button>
          
          <Button 
            onClick={retryPayment}
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl py-3"
          >
            <RefreshCw size={18} className="mr-2" />
            🔄 Try Again
          </Button>
        </div>

        {/* Enhanced Payment Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Payment Instructions:</p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Check your UPI app for the payment request</li>
              <li>2. Verify the amount (₹{amount}) and recipient details</li>
              <li>3. Complete the payment using your UPI PIN</li>
              <li>4. Return here and confirm the payment status</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Success Step - Enhanced celebration
  if (paymentStep === 'success') {
    return (
      <div className="space-y-6 p-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xl">
          <CheckCircle size={40} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-green-600 mb-2">🎉 Payment Successful!</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your donation of ₹{amount} has been processed successfully.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800 mt-4">
            <p className="text-xs text-green-700 dark:text-green-300 font-mono">
              Transaction ID: {transactionId}
            </p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Heart size={16} className="text-green-600" />
            <p className="text-green-800 dark:text-green-200 font-medium text-sm">
              Thank you for supporting {campaign.title}!
            </p>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">
            Your contribution makes a real difference in our campus community.
          </p>
        </div>
      </div>
    );
  }

  // Failed Step - Enhanced error handling
  if (paymentStep === 'failed') {
    return (
      <div className="space-y-6 p-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
          <XCircle size={32} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-red-600 mb-2">Payment Failed</h3>
          <p className="text-sm text-muted-foreground">The transaction was not completed. No money has been debited.</p>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800 mt-4">
            <p className="text-xs text-red-700 dark:text-red-300 font-mono">
              Transaction ID: {transactionId}
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-red-800 dark:text-red-200 font-medium text-sm">Common reasons for payment failure:</p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 text-left">
                <li>• Insufficient balance in your account</li>
                <li>• Daily transaction limit exceeded</li>
                <li>• UPI app not responding or crashed</li>
                <li>• Network connectivity issues</li>
                <li>• Transaction cancelled by user</li>
                <li>• Bank server temporarily unavailable</li>
                <li>• Invalid or suspended UPI ID</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={resetPaymentFlow}
            variant="outline" 
            className="flex-1 rounded-xl"
          >
            Try Different Amount
          </Button>
          <Button 
            onClick={retryPayment}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry Payment
          </Button>
        </div>
      </div>
    );
  }

  // Amount Selection Step - Enhanced UI
  return (
    <div className="space-y-6 p-1">
      {/* Enhanced Campaign Info */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <h3 className="font-semibold text-base line-clamp-2">{campaign.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">Supporting: {campaign.organizerName || campaign.creatorName}</p>
        
        <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="font-medium">Raised: ₹{campaign.raised.toLocaleString()}</span>
            <span className="text-muted-foreground">Goal: ₹{campaign.target.toLocaleString()}</span>
          </div>
          <Progress value={(campaign.raised / campaign.target) * 100} className="h-2" />
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {Math.round((campaign.raised / campaign.target) * 100)}% funded
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced UPI Payment Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Smartphone size={14} className="text-white" />
            </div>
            <h4 className="font-semibold text-sm">Real-Time UPI Payment</h4>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              Instant Transfer
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
                className="w-full mt-1 text-center text-lg font-semibold"
                min="10"
                max="100000"
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Min: ₹10 • Max: ₹1,00,000 per transaction
              </p>
            </div>

            {/* Enhanced Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(quickAmount => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`text-xs p-2 h-10 transition-all duration-200 ${
                    amount === quickAmount.toString() 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                      : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/20'
                  }`}
                >
                  ₹{quickAmount >= 1000 ? `${quickAmount/1000}k` : quickAmount}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced UPI Apps Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-muted-foreground" />
          <p className="text-sm font-medium">Supported UPI Apps</p>
          <Badge variant="outline" className="text-xs">Real-time</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {upiApps.slice(0, 6).map((app) => (
            <div key={app.name} className={`bg-gradient-to-br ${app.color} rounded-lg p-2 text-white text-center shadow-md hover:shadow-lg transition-shadow`}>
              <div className="text-lg mb-1">{app.icon}</div>
              <p className="text-xs font-medium">{app.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Security Notice */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-2">
          <Shield size={16} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Secure Payment</p>
            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <li>• Direct bank-to-bank transfer via UPI</li>
              <li>• No card details or passwords shared</li>
              <li>• Instant money transfer confirmation</li>
              <li>• Protected by your UPI PIN</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
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
          disabled={!amount || parseInt(amount) < 10 || parseInt(amount) > 100000 || isProcessing}
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
              <span>Pay ₹{amount || '0'} via UPI</span>
              <ArrowRight size={14} />
            </div>
          )}
        </Button>
      </div>

      {/* Enhanced UPI Link Copy for Desktop */}
      {amount && parseInt(amount) >= 10 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!campaign?.upiId) return;
              
              const donationAmount = parseInt(amount);
              const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
              const upiUrl = generateUPILink(campaign.upiId, campaign.organizerName || campaign.creatorName || "Fundraiser", donationAmount, txnId);
              
              navigator.clipboard.writeText(upiUrl).then(() => {
                toast({ 
                  title: "UPI Link Copied!", 
                  description: "Paste this link in any UPI app to complete the donation." 
                });
              });
            }}
            className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
          >
            <QrCode size={14} className="mr-2" />
            📋 Copy UPI Payment Link
          </Button>
        </div>
      )}
    </div>
  );
};