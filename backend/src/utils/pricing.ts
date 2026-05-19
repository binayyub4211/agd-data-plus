import { prisma } from './prisma';

export const DEFAULT_PLANS = [
  // MTN Data (CHEAP_DATA_HUB)
  { planCode: '43', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 90, sellingPrice: 100, resellerPrice: 95 },
  { planCode: '74', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 220, sellingPrice: 250, resellerPrice: 235 },
  { planCode: '76', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 260, sellingPrice: 299, resellerPrice: 280 },
  { planCode: '78', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 310, sellingPrice: 350, resellerPrice: 330 },
  { planCode: '44', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 350, sellingPrice: 400, resellerPrice: 380 },
  { planCode: '77', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 400, sellingPrice: 450, resellerPrice: 430 },
  { planCode: '45', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 440, sellingPrice: 499, resellerPrice: 470 },
  { planCode: '46', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 530, sellingPrice: 600, resellerPrice: 570 },
  { planCode: '48', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 1100, sellingPrice: 1250, resellerPrice: 1180 },
  { planCode: '49', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 1320, sellingPrice: 1500, resellerPrice: 1420 },
  { planCode: '50', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 2050, sellingPrice: 2300, resellerPrice: 2180 },

  // Glo Data (CHEAP_DATA_HUB)
  { planCode: '42', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 90, sellingPrice: 100, resellerPrice: 95 },
  { planCode: '35', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 220, sellingPrice: 250, resellerPrice: 235 },
  { planCode: '68', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 290, sellingPrice: 330, resellerPrice: 310 },
  { planCode: '36', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 400, sellingPrice: 450, resellerPrice: 425 },
  { planCode: '40', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 800, sellingPrice: 900, resellerPrice: 850 },
  { planCode: '37', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 1250, sellingPrice: 1400, resellerPrice: 1320 },
  { planCode: '38', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 2000, sellingPrice: 2250, resellerPrice: 2120 },

  // Airtel Data (CHEAP_DATA_HUB)
  { planCode: '70', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 310, sellingPrice: 350, resellerPrice: 330 },
  { planCode: '13', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 440, sellingPrice: 500, resellerPrice: 470 },
  { planCode: '15', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 710, sellingPrice: 800, resellerPrice: 760 },
  { planCode: '17', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 1330, sellingPrice: 1500, resellerPrice: 1420 },
  { planCode: '18', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 1860, sellingPrice: 2100, resellerPrice: 1980 },
  { planCode: '20', serviceType: 'DATA', provider: 'CHEAP_DATA_HUB', providerPrice: 2850, sellingPrice: 3200, resellerPrice: 3020 },

  // Airtime Providers
  { planCode: 'MTN_AIRTIME', serviceType: 'AIRTIME', provider: 'CHEAP_DATA_HUB', providerPrice: 0.97, sellingPrice: 1.00, resellerPrice: 0.98 },
  { planCode: 'GLO_AIRTIME', serviceType: 'AIRTIME', provider: 'CHEAP_DATA_HUB', providerPrice: 0.97, sellingPrice: 1.00, resellerPrice: 0.98 },
  { planCode: 'AIRTEL_AIRTIME', serviceType: 'AIRTIME', provider: 'CHEAP_DATA_HUB', providerPrice: 0.97, sellingPrice: 1.00, resellerPrice: 0.98 },
  { planCode: '9MOBILE_AIRTIME', serviceType: 'AIRTIME', provider: 'CHEAP_DATA_HUB', providerPrice: 0.97, sellingPrice: 1.00, resellerPrice: 0.98 },

  // Utility/Electricity (VTpass)
  { planCode: 'PREPAID', serviceType: 'ELECTRICITY', provider: 'VTPASS', providerPrice: 1.00, sellingPrice: 1.00, resellerPrice: 1.00 },
  { planCode: 'POSTPAID', serviceType: 'ELECTRICITY', provider: 'VTPASS', providerPrice: 1.00, sellingPrice: 1.00, resellerPrice: 1.00 },

  // Cable TV (VTpass)
  { planCode: 'DSTV', serviceType: 'CABLE', provider: 'VTPASS', providerPrice: 1.00, sellingPrice: 1.00, resellerPrice: 1.00 },
  { planCode: 'GOTV', serviceType: 'CABLE', provider: 'VTPASS', providerPrice: 1.00, sellingPrice: 1.00, resellerPrice: 1.00 },
  { planCode: 'STARTIMES', serviceType: 'CABLE', provider: 'VTPASS', providerPrice: 1.00, sellingPrice: 1.00, resellerPrice: 1.00 }
];

export async function seedDefaultServicePrices() {
  const count = await prisma.servicePrice.count();
  if (count === 0) {
    console.log('[Pricing System] Seeding default service prices...');
    await prisma.servicePrice.createMany({
      data: DEFAULT_PLANS
    });
  }
}
