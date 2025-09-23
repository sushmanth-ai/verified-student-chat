import { collection, addDoc, getDocs, updateDoc, doc, increment, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Campaign {
  id?: string;
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

export interface Donation {
  id?: string;
  donorName: string;
  amount: number;
  timestamp: any;
}

// Create new campaign
export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'raised' | 'createdAt' | 'likes' | 'donations'>) => {
  try {
    const docRef = await addDoc(collection(db, "fundraisingCampaigns"), {
      ...campaignData,
      raised: 0,
      createdAt: new Date(),
      likes: [],
      donations: 0
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};

// Fetch all campaigns
export const fetchCampaigns = async (): Promise<Campaign[]> => {
  try {
    const q = query(collection(db, "fundraisingCampaigns"), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Campaign[];
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
};

// Update raised amount after successful donation
export const updateRaisedAmount = async (campaignId: string, amount: number) => {
  try {
    const campaignRef = doc(db, "fundraisingCampaigns", campaignId);
    await updateDoc(campaignRef, { 
      raised: increment(amount),
      donations: increment(1)
    });
  } catch (error) {
    console.error("Error updating raised amount:", error);
    throw error;
  }
};

// Add donation record
export const addDonation = async (campaignId: string, donationData: Omit<Donation, 'id' | 'timestamp'>) => {
  try {
    const docRef = await addDoc(collection(db, "fundraisingCampaigns", campaignId, "donations"), {
      ...donationData,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding donation:", error);
    throw error;
  }
};

// Fetch donations for a campaign
export const fetchDonations = async (campaignId: string): Promise<Donation[]> => {
  try {
    const q = query(collection(db, "fundraisingCampaigns", campaignId, "donations"), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Donation[];
  } catch (error) {
    console.error("Error fetching donations:", error);
    throw error;
  }
};

// Validate UPI ID format with stricter rules to prevent risk policy failures
export const validateUPIId = (upiId: string): boolean => {
  // Enhanced UPI ID validation for real money transfers
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
  
  // Check basic format
  if (!upiRegex.test(upiId)) return false;
  
  // Prevent test/fake UPI IDs that cause real payment failures
  const suspiciousPatterns = [
    /^test/i,
    /^demo/i,
    /^fake/i,
    /^sample/i,
    /^dummy/i,
    /^example/i,
    /^9876543210@/,
    /^1234567890@/,
    /^0000000000@/,
    /^1111111111@/,
    /^9999999999@/,
    /@test$/i,
    /@demo$/i,
    /@fake$/i,
    /@example$/i,
    /@dummy$/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(upiId));
};

// Enhanced UPI payment link generation for real-time transfers
export const generateUPILink = (upiId: string, payeeName: string, amount: number, txnId: string): string => {
  // Clean payee name to avoid special characters that might cause issues
  const cleanPayeeName = payeeName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  // Use minimal transaction note to avoid risk policy triggers
  const shortNote = `D${txnId.slice(-8)}`;
  
  // Enhanced UPI URL with additional parameters for better success rate
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(cleanPayeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(shortNote)}&mode=02&purpose=04`;
};

// Verify UPI ID exists and is active (basic check)
export const verifyUPIId = async (upiId: string): Promise<boolean> => {
  // This is a client-side validation - in production, you'd want server-side verification
  if (!validateUPIId(upiId)) return false;
  
  // Additional checks for common UPI providers
  const validProviders = [
    'paytm', 'ybl', 'okaxis', 'okicici', 'okhdfcbank', 'oksbi', 'okbizaxis',
    'ibl', 'axl', 'hdfcbank', 'icici', 'sbi', 'pnb', 'boi', 'cnrb',
    'upi', 'allbank', 'indianbank', 'federal', 'kotak', 'indus'
  ];
  
  const provider = upiId.split('@')[1]?.toLowerCase();
  return validProviders.some(validProvider => provider?.includes(validProvider));
};