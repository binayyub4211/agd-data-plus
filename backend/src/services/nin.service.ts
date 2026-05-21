import axios from 'axios';

export interface NinVerificationResult {
  nin: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  trackingId: string;
  address: string;
  photo: string; // Base64 or URL
  stateOfOrigin: string;
  lga: string;
  issueDate: string;
  signature?: string;
}

export class NinService {
  /**
   * Verifies NIN details through a provider API, falling back to a realistic mock dataset in sandbox.
   */
  async verifyNin(nin: string, defaultName: string = 'Aliko Dangote'): Promise<NinVerificationResult> {
    const isSandbox = (process.env.VTPASS_BASE_URL || '').includes('sandbox') || !process.env.MONNIFY_API_KEY;
    
    console.log(`[NinService] Verifying NIN: ${nin} (Sandbox mode: ${isSandbox})...`);

    if (isSandbox) {
      // In sandbox mode, return highly realistic mock data to render gorgeous slips.
      // If defaultName is provided, we can dynamically split it to personalize the mock card!
      const nameParts = defaultName.split(' ');
      const lastName = nameParts[0] || 'Dangote';
      const firstName = nameParts[1] || 'Aliko';
      const middleName = nameParts.slice(2).join(' ') || 'GCON';

      // Generate a highly realistic random tracking ID
      const randomTrackingId = `FT-${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Returns realistic Nigerian NIN data
      return {
        nin: nin,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        fullName: `${firstName} ${middleName} ${lastName}`.trim().toUpperCase(),
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        dateOfBirth: '1987-04-10',
        phone: '08012345678',
        trackingId: randomTrackingId,
        address: '15, Alfred Rewane Road, Ikoyi, Lagos, Nigeria',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300', // Beautiful Unsplash portrait placeholder
        stateOfOrigin: 'Kano State',
        lga: 'Kano Municipal',
        issueDate: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }),
        signature: 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?fit=crop&w=150&h=50'
      };
    }

    try {
      // Direct Integration Template for Live APIs (e.g. Monnify or Youverify)
      // Monnify Identity API example:
      const monnifyApiKey = process.env.MONNIFY_API_KEY;
      const monnifySecretKey = process.env.MONNIFY_SECRET_KEY;
      const monnifyBaseUrl = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';

      // 1. Get access token
      const authHeader = Buffer.from(`${monnifyApiKey}:${monnifySecretKey}`).toString('base64');
      const tokenResponse = await axios.post(`${monnifyBaseUrl}/api/v1/auth/login`, {}, {
        headers: { 'Authorization': `Basic ${authHeader}` }
      });
      const accessToken = tokenResponse.data?.responseBody?.accessToken;

      // 2. Query NIN verification endpoint
      const verifyResponse = await axios.post(`${monnifyBaseUrl}/api/v1/vas/nin-details`, {
        nin: nin,
        consent: true
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (verifyResponse.data?.requestSuccessful) {
        const body = verifyResponse.data.responseBody;
        return {
          nin: nin,
          firstName: body.firstName || '',
          middleName: body.middleName || '',
          lastName: body.lastName || '',
          fullName: `${body.firstName || ''} ${body.middleName || ''} ${body.lastName || ''}`.trim().toUpperCase(),
          gender: (body.gender || 'MALE').toUpperCase(),
          dateOfBirth: body.dateOfBirth || '1990-01-01',
          phone: body.mobile || '',
          trackingId: body.trackingId || `TRK-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          address: body.address || 'Nigeria',
          photo: body.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300',
          stateOfOrigin: body.stateOfOrigin || '',
          lga: body.lga || '',
          issueDate: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      }

      throw new Error(verifyResponse.data?.responseMessage || 'NIN verification API failed');
    } catch (apiError: any) {
      console.error(`[NinService] Real-time NIN API failed:`, apiError.response?.data || apiError.message);
      throw new Error(`NIN Verification failed: ${apiError.response?.data?.message || apiError.message}`);
    }
  }
}
