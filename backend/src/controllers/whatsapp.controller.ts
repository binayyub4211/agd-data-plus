import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { VtuEngine } from '../services/VtuEngine';
import { WhatsAppService } from '../services/whatsapp.service';
import { ServiceType, TransactionStatus, Provider } from '../types/prisma';
import bcrypt from 'bcryptjs';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/email.service';

const vtuEngine = new VtuEngine();

/**
 * Controller for all WhatsApp Webhook endpoints
 */
export class WhatsAppController {
  
  /**
   * Webhook Verification (GET)
   * Validates the Meta WhatsApp callback verification request
   */
  static async verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'AGD_WHATSAPP_SECRET_TOKEN_2026';

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[WhatsApp Webhook] Verification successful!');
        return res.status(200).send(challenge);
      } else {
        console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
        return res.sendStatus(403);
      }
    }
    return res.sendStatus(400);
  }

  /**
   * Webhook Event Handler (POST)
   * Receives incoming messages and runs them through the chatbot state machine
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const { body } = req;

      // Ensure this is a WhatsApp status/message payload
      if (!body.object || !body.entry?.[0]?.changes?.[0]?.value) {
        return res.sendStatus(200); // Acknowledge to prevent retries
      }

      const value = body.entry[0].changes[0].value;
      const message = value.messages?.[0];
      const contact = value.contacts?.[0];

      if (!message || message.type !== 'text') {
        return res.sendStatus(200); // Only process text messages for now
      }

      const phone = message.from; // Sender's WhatsApp number
      const userText = message.text.body.trim();
      const name = contact?.profile?.name || 'Customer';

      console.log(`[WhatsApp Webhook] Incoming message from ${phone} (${name}): "${userText}"`);

      // 1. Fetch or create conversational session
      let session = await prisma.whatsAppSession.findUnique({
        where: { phone }
      });

      if (!session) {
        session = await prisma.whatsAppSession.create({
          data: { phone, state: 'IDLE' }
        });
      }

      // 2. Process incoming message through state machine
      await WhatsAppController.processMessage(session, userText, name);

      return res.sendStatus(200);
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err.message);
      return res.sendStatus(200); // Acknowledge to avoid message retries from Meta
    }
  }

  /**
   * Process Message through the state machine
   */
  private static async processMessage(session: any, input: string, name: string) {
    const phone = session.phone;
    const lowerInput = input.toLowerCase();

    // Universal 'cancel' command
    if (lowerInput === 'cancel' || lowerInput === 'exit' || lowerInput === 'restart') {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'IDLE', stepData: null }
      });
      await WhatsAppService.sendText(phone, "❌ **Transaction cancelled.** You have been returned to the main menu.\n\nReply with **menu** or **hi** to see options.");
      return;
    }

    // Load active step data helper
    const stepData = session.stepData ? JSON.parse(session.stepData) : {};

    // ----------------------------------------------------
    // STATE: REGISTER_EMAIL
    // ----------------------------------------------------
    if (session.state === 'REGISTER_EMAIL') {
      const email = input.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        await WhatsAppService.sendText(phone, "❌ **Account Not Found**\n\nThe email address you entered is not registered on AGD Data Plus.\n\nPlease enter your registered email address (or reply **cancel**):");
        return;
      }

      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          state: 'REGISTER_PASSWORD',
          stepData: JSON.stringify({ ...stepData, email })
        }
      });

      await WhatsAppService.sendText(phone, `✅ Account found for **${user.name}**!\n\nPlease enter your account password to verify your identity and link your WhatsApp:`);
      return;
    }

    // ----------------------------------------------------
    // STATE: REGISTER_PASSWORD
    // ----------------------------------------------------
    if (session.state === 'REGISTER_PASSWORD') {
      const password = input.trim();
      const email = stepData.email;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { state: 'IDLE', stepData: null }
        });
        await WhatsAppService.sendText(phone, "❌ Linking session expired. Please type **hi** to restart.");
        return;
      }

      const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordMatch) {
        await WhatsAppService.sendText(phone, "❌ **Incorrect Password**\n\nPlease enter your account password again (or reply **cancel**):");
        return;
      }

      // Link User & Reset State
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          state: 'IDLE',
          userId: user.id,
          stepData: null
        }
      });

      await WhatsAppService.sendText(
        phone,
        `🎉 **Authentication Successful!**\n\nYour WhatsApp number is now securely linked to your AGD Data Plus account (**${user.name}**).\n\n` +
        WhatsAppController.getMenuText()
      );
      return;
    }

    // ----------------------------------------------------
    // REQUIRE AUTHENTICATION FOR ALL OTHER STATES
    // ----------------------------------------------------
    if (!session.userId) {
      // Trigger linking process
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'REGISTER_EMAIL', stepData: null }
      });

      await WhatsAppService.sendText(
        phone,
        `Welcome to **AGD Data Plus**! 🌟\n\nTo make wallet queries or buy VTU services directly from WhatsApp, we need to securely link your WhatsApp to your account.\n\n` +
        `Please reply with your registered **Email Address** to begin:`
      );
      return;
    }

    // Load linked user profile
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      // Clean up orphaned session
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'IDLE', userId: null, stepData: null }
      });
      await WhatsAppService.sendText(phone, "❌ Account link error. User not found. Please reply with **hi** to link your account again.");
      return;
    }

    // ----------------------------------------------------
    // STATE: IDLE (Main Menu Selection)
    // ----------------------------------------------------
    if (session.state === 'IDLE') {
      if (lowerInput === '1' || lowerInput.includes('balance') || lowerInput.includes('wallet')) {
        // Query Balance
        await WhatsAppService.sendText(
          phone,
          `💰 **AGD Wallet Balance**\n\n` +
          `Hello **${user.name}**, your current balances are:\n` +
          `• Main Balance: **₦${user.wallet.balance.toFixed(2)}**\n` +
          `• Bonus Balance: **₦${user.wallet.bonusBalance.toFixed(2)}**\n\n` +
          `Reply with **menu** to show options again.`
        );
        return;
      }

      if (lowerInput === '2' || lowerInput.includes('airtime')) {
        // Choose Airtime
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_NETWORK',
            stepData: JSON.stringify({ type: 'AIRTIME' })
          }
        });
        await WhatsAppService.sendText(
          phone,
          `📱 **Buy Airtime**\n\n` +
          `Please select the mobile network:\n` +
          `1. MTN\n` +
          `2. Glo\n` +
          `3. Airtel\n` +
          `4. 9mobile\n\n` +
          `Reply with **1**, **2**, **3**, or **4** (or **cancel**):`
        );
        return;
      }

      if (lowerInput === '3' || lowerInput.includes('data')) {
        // Choose Data
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_NETWORK',
            stepData: JSON.stringify({ type: 'DATA' })
          }
        });
        await WhatsAppService.sendText(
          phone,
          `📶 **Buy Data**\n\n` +
          `Please select the mobile network:\n` +
          `1. MTN\n` +
          `2. Glo\n` +
          `3. Airtel\n` +
          `4. 9mobile\n\n` +
          `Reply with **1**, **2**, **3**, or **4** (or **cancel**):`
        );
        return;
      }

      if (lowerInput === '4' || lowerInput.includes('electricity') || lowerInput.includes('power')) {
        // Electricity bills — numbered provider selection
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_NETWORK',
            stepData: JSON.stringify({ type: 'ELECTRICITY' })
          }
        });
        await WhatsAppService.sendText(
          phone,
          `💡 **Pay Electricity Bill**\n\n` +
          `Please select your electricity provider:\n` +
          `1. Ikeja Electric (IKEDC)\n` +
          `2. Eko Electric (EKEDC)\n` +
          `3. Abuja Electric (AEDC)\n` +
          `4. Kano Electric (KEDCO)\n` +
          `5. Port Harcourt (PHED)\n` +
          `6. Jos Electric (JED)\n` +
          `7. Ibadan Electric (IBEDC)\n` +
          `8. Kaduna Electric (KAEDCO)\n` +
          `9. Enugu Electric (EEDC)\n` +
          `10. Benin Electric (BEDC)\n` +
          `11. Yola Electric (YEDC)\n\n` +
          `Reply with **1-11** (or **cancel**):`
        );
        return;
      }

      if (lowerInput === '5' || lowerInput.includes('tv') || lowerInput.includes('cable')) {
        // Cable subscription
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'ENTER_BENEFICIARY',
            stepData: JSON.stringify({ type: 'CABLE' })
          }
        });
        await WhatsAppService.sendText(
          phone,
          `📺 **Cable TV Subscription**\n\n` +
          `Please choose your provider:\n` +
          `1. DSTV\n` +
          `2. GOTV\n` +
          `3. StarTimes\n\n` +
          `Reply with **1**, **2**, or **3** (or **cancel**):`
        );
        return;
      }

      // Default fallback (show menu)
      await WhatsAppService.sendText(phone, WhatsAppController.getMenuText());
      return;
    }

    // ----------------------------------------------------
    // STATE: SELECT_NETWORK
    // ----------------------------------------------------
    if (session.state === 'SELECT_NETWORK') {
      const choice = input.trim();

      // --- ELECTRICITY PROVIDER SELECTION ---
      if (stepData.type === 'ELECTRICITY') {
        const electricityProviders: Record<string, { serviceID: string; name: string }> = {
          '1':  { serviceID: 'ikeja-electric',        name: 'Ikeja Electric (IKEDC)' },
          '2':  { serviceID: 'eko-electric',           name: 'Eko Electric (EKEDC)' },
          '3':  { serviceID: 'abuja-electric',         name: 'Abuja Electric (AEDC)' },
          '4':  { serviceID: 'kano-electric',          name: 'Kano Electric (KEDCO)' },
          '5':  { serviceID: 'portharcourt-electric',  name: 'Port Harcourt (PHED)' },
          '6':  { serviceID: 'jos-electric',           name: 'Jos Electric (JED)' },
          '7':  { serviceID: 'ibadan-electric',        name: 'Ibadan Electric (IBEDC)' },
          '8':  { serviceID: 'kaduna-electric',        name: 'Kaduna Electric (KAEDCO)' },
          '9':  { serviceID: 'enugu-electric',         name: 'Enugu Electric (EEDC)' },
          '10': { serviceID: 'benin-electric',         name: 'Benin Electric (BEDC)' },
          '11': { serviceID: 'yola-electric',          name: 'Yola Electric (YEDC)' },
        };

        const selected = electricityProviders[choice];
        if (!selected) {
          await WhatsAppService.sendText(phone, "❌ **Invalid Selection**\n\nPlease select a valid electricity provider (1-11) or reply **cancel**:");
          return;
        }

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'ENTER_BENEFICIARY',
            stepData: JSON.stringify({ ...stepData, serviceID: selected.serviceID, providerName: selected.name })
          }
        });

        await WhatsAppService.sendText(
          phone,
          `⚡ Selected **${selected.name}**.\n\n` +
          `Please select your meter type:\n` +
          `1. Prepaid\n` +
          `2. Postpaid\n\n` +
          `Reply with **1** or **2** (or **cancel**):`
        );
        return;
      }

      // --- AIRTIME / DATA NETWORK SELECTION ---
      let network = '';

      if (choice === '1') network = 'MTN';
      else if (choice === '2') network = 'GLO';
      else if (choice === '3') network = 'AIRTEL';
      else if (choice === '4') network = '9MOBILE';

      if (!network) {
        await WhatsAppService.sendText(phone, "❌ **Invalid Network**\n\nPlease select a valid network:\n1. MTN\n2. Glo\n3. Airtel\n4. 9mobile\n\nReply **1-4** or **cancel**:");
        return;
      }

      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          state: 'ENTER_BENEFICIARY',
          stepData: JSON.stringify({ ...stepData, network })
        }
      });

      await WhatsAppService.sendText(phone, `📱 Selected **${network}**.\n\nPlease enter the recipient's **11-digit phone number** (e.g., \`09016514818\`):`);
      return;
    }

    // ----------------------------------------------------
    // STATE: ENTER_BENEFICIARY
    // ----------------------------------------------------
    if (session.state === 'ENTER_BENEFICIARY') {
      const beneficiary = input.trim().replace(/\s/g, '');

      if (stepData.type === 'AIRTIME' || stepData.type === 'DATA') {
        // Validate phone number
        if (!/^\d{11}$/.test(beneficiary)) {
          await WhatsAppService.sendText(phone, "❌ **Invalid Phone Number**\n\nPlease enter a correct 11-digit mobile number (or **cancel**):");
          return;
        }
      } else if (stepData.type === 'CABLE') {
        // Handle Cable provider selection first if not set
        if (!stepData.network) {
          let provider = '';
          if (beneficiary === '1') provider = 'DSTV';
          else if (beneficiary === '2') provider = 'GOTV';
          else if (beneficiary === '3') provider = 'STARTIMES';

          if (!provider) {
            await WhatsAppService.sendText(phone, "❌ **Invalid Selection**\n\nPlease select your Cable TV provider:\n1. DSTV\n2. GOTV\n3. StarTimes\n\nReply with **1**, **2**, or **3** (or **cancel**):");
            return;
          }

          await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: {
              stepData: JSON.stringify({ ...stepData, network: provider })
            }
          });
          await WhatsAppService.sendText(phone, `📺 Selected **${provider}**.\n\nPlease enter the **Smartcard Number / UID** (e.g., \`1023948576\`):`);
          return;
        }

        // Validate smartcard number
        if (!/^\d{8,}$/.test(beneficiary)) {
          await WhatsAppService.sendText(phone, `❌ **Invalid Smartcard Number**\n\nPlease enter your correct **${stepData.network}** Smartcard Number / UID (at least 8 digits):`);
          return;
        }
      } else if (stepData.type === 'ELECTRICITY') {
        // Sub-step 1: Select meter type (prepaid / postpaid)
        if (!stepData.meterType) {
          let meterType = '';
          if (beneficiary === '1') meterType = 'prepaid';
          else if (beneficiary === '2') meterType = 'postpaid';

          if (!meterType) {
            await WhatsAppService.sendText(phone, "❌ **Invalid Selection**\n\nPlease select your meter type:\n1. Prepaid\n2. Postpaid\n\nReply with **1** or **2** (or **cancel**):");
            return;
          }

          await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: {
              stepData: JSON.stringify({ ...stepData, meterType })
            }
          });
          await WhatsAppService.sendText(phone, `⚡ Selected **${meterType.toUpperCase()}** meter.\n\nPlease enter your **Meter Number** (at least 8 digits):`);
          return;
        }

        // Sub-step 2: Validate meter number
        if (!/^\d{8,}$/.test(beneficiary)) {
          await WhatsAppService.sendText(phone, "❌ **Invalid Meter Number**\n\nPlease enter your correct Meter Number (at least 8 digits):");
          return;
        }
      }

      // Prepare next step response based on type
      if (stepData.type === 'AIRTIME') {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_PLAN', // Airtime bypasses plan list and goes straight to amount input in SELECT_PLAN
            stepData: JSON.stringify({ ...stepData, beneficiary })
          }
        });
        await WhatsAppService.sendText(phone, `💵 Enter the **Airtime Amount** in Naira (e.g., 500, minimum ₦100):`);
        return;
      } 
      
      if (stepData.type === 'ELECTRICITY') {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_PLAN',
            stepData: JSON.stringify({ ...stepData, beneficiary })
          }
        });
        await WhatsAppService.sendText(phone, `💵 Enter the **Electricity Amount** you want to purchase (minimum ₦1,000):`);
        return;
      }

      if (stepData.type === 'DATA') {
        // Fetch matching plans dynamically from the database to present to the user!
        const matchingPrices = await prisma.servicePrice.findMany({
          where: {
            serviceType: 'DATA',
            isActive: true,
            planCode: {
              startsWith: stepData.network.toLowerCase()
            }
          },
          orderBy: { sellingPrice: 'asc' },
          take: 8 // limit menu list size
        });

        let planListText = `📶 **Select a ${stepData.network} Data Plan**:\n\n`;
        const planList: any[] = [];

        if (matchingPrices.length > 0) {
          matchingPrices.forEach((plan, index) => {
            const num = index + 1;
            // Parse custom human name e.g. "MTN 1.5GB 30days"
            const desc = plan.planCode.replace('-', ' ').toUpperCase();
            planListText += `*${num}*. ${desc} — **₦${plan.sellingPrice}** (Code: \`${plan.planCode}\`)\n`;
            planList.push({ id: num.toString(), code: plan.planCode, price: plan.sellingPrice });
          });
          planListText += `\nReply with the **number (1-${matchingPrices.length})** or type a specific Plan Code:`;
        } else {
          // Static fallback menu if no DB plans match
          planListText += `Please reply with the plan code (e.g., \`78\` for MTN 1.5GB, \`17\` for Airtel 2GB, or \`glo-100\`):`;
        }

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_PLAN',
            stepData: JSON.stringify({ ...stepData, beneficiary, planList })
          }
        });

        await WhatsAppService.sendText(phone, planListText);
        return;
      }

      if (stepData.type === 'CABLE') {
        // Fetch dynamic Cable TV plans from VTpass
        const vtpassServiceID = stepData.network.toLowerCase() === 'startimes' ? 'startimes' : stepData.network.toLowerCase();
        let variations: any[] = [];
        try {
          variations = await vtuEngine.getServiceVariations(vtpassServiceID);
        } catch (err: any) {
          console.error(`[WhatsApp] Failed to fetch ${vtpassServiceID} variations:`, err.message);
        }

        let planListText = `📺 **Select a ${stepData.network} Package**:\n\n`;
        const planList: any[] = [];

        if (variations.length > 0) {
          variations.forEach((v: any, index: number) => {
            const num = index + 1;
            const name = v.name || v.variation_code;
            const price = v.variation_amount || v.fixedPrice || '—';
            planListText += `*${num}*. ${name} — **₦${price}**\n`;
            planList.push({ id: num.toString(), code: v.variation_code, price: parseFloat(v.variation_amount || v.fixedPrice || '0') });
          });
          planListText += `\nReply with the **number (1-${variations.length})** to select:`;
        } else {
          const exampleCode = vtpassServiceID === 'dstv' ? 'dstv-padi' : vtpassServiceID === 'gotv' ? 'gotv-jolli' : 'nova';
          planListText = `📺 Selected **${stepData.network}** smartcard **${beneficiary}**.\n\nPlease enter the package code (e.g. \`${exampleCode}\`):`;  
        }

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'SELECT_PLAN',
            stepData: JSON.stringify({ ...stepData, beneficiary, planList })
          }
        });

        await WhatsAppService.sendText(phone, planListText);
        return;
      }
    }

    // ----------------------------------------------------
    // STATE: SELECT_PLAN
    // ----------------------------------------------------
    if (session.state === 'SELECT_PLAN') {
      const inputVal = input.trim();

      if (stepData.type === 'AIRTIME' || stepData.type === 'ELECTRICITY') {
        const amount = parseFloat(inputVal);
        const minAmount = stepData.type === 'AIRTIME' ? 100 : 1000;

        if (isNaN(amount) || amount < minAmount) {
          await WhatsAppService.sendText(phone, `❌ **Invalid Amount**\n\nPlease enter a correct amount (minimum ₦${minAmount}):`);
          return;
        }

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'ENTER_PIN',
            stepData: JSON.stringify({ ...stepData, amount })
          }
        });

        const label = stepData.type === 'AIRTIME' 
          ? `Airtime Top-up (${stepData.network})`
          : `Electricity (${stepData.providerName || stepData.serviceID}) — ${(stepData.meterType || 'prepaid').toUpperCase()}`;

        await WhatsAppService.sendText(
          phone,
          `⚠️ **Confirm Purchase**\n\n` +
          `• **Service**: ${label}\n` +
          `• **Account**: ${stepData.beneficiary}\n` +
          `• **Amount**: ₦${amount.toLocaleString()}\n\n` +
          `To confirm, please reply with your **4-digit Transaction PIN**:`
        );
        return;
      }

      if (stepData.type === 'DATA' || stepData.type === 'CABLE') {
        let planCode = inputVal;
        let amount = 0;

        // Check if user replied with a index number from our generated dynamic plan menu
        if (stepData.planList && stepData.planList.length > 0) {
          const matchedPlan = stepData.planList.find((p: any) => p.id === inputVal);
          if (matchedPlan) {
            planCode = matchedPlan.code;
            amount = matchedPlan.price;
          }
        }

        // Validate planCode in Database if amount was not determined dynamically
        if (amount === 0) {
          const dbPlan = await prisma.servicePrice.findFirst({
            where: { planCode, serviceType: stepData.type }
          });
          if (dbPlan) {
            amount = user.role === 'RESELLER' || user.role === 'ADMIN' ? dbPlan.resellerPrice : dbPlan.sellingPrice;
          } else {
            // Default pricing rule fallback
            amount = stepData.type === 'CABLE' ? 2000 : 1000;
          }
        }

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: 'ENTER_PIN',
            stepData: JSON.stringify({ ...stepData, planCode, amount })
          }
        });

        await WhatsAppService.sendText(
          phone,
          `⚠️ **Confirm Purchase**\n\n` +
          `• **Service**: ${stepData.type} Subscription\n` +
          `• **Plan**: ${planCode.replace('-', ' ').toUpperCase()}\n` +
          `• **Account**: ${stepData.beneficiary}\n` +
          `• **Amount**: ₦${amount.toLocaleString()}\n\n` +
          `To confirm, please reply with your **4-digit Transaction PIN**:`
        );
        return;
      }
    }

    // ----------------------------------------------------
    // STATE: ENTER_PIN & TRANSACTION EXECUTION
    // ----------------------------------------------------
    if (session.state === 'ENTER_PIN') {
      const pin = input.trim();

      if (!/^\d{4}$/.test(pin)) {
        await WhatsAppService.sendText(phone, "❌ **Invalid PIN format**\n\nPlease enter your correct **4-digit Transaction PIN** (or reply **cancel**):");
        return;
      }

      if (!user.transactionPin) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { state: 'IDLE', stepData: null }
        });
        await WhatsAppService.sendText(phone, "❌ **Transaction PIN Not Set**\n\nYou have not set up your 4-digit transaction PIN yet. Please set it up on the AGD website first.");
        return;
      }

      const isPinMatch = await bcrypt.compare(pin, user.transactionPin);
      if (!isPinMatch) {
        await WhatsAppService.sendText(phone, "❌ **Incorrect PIN**\n\nPlease enter your correct transaction PIN again (or reply **cancel**):");
        return;
      }

      // PIN is correct. Clear chatbot session first to prevent double clicks
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: 'IDLE', stepData: null }
      });

      await WhatsAppService.sendText(phone, `⏳ **Processing transaction...** Please hold on while we securely execute your request.`);

      // Prepare VTU Transaction Inputs
      const serviceType = stepData.type as ServiceType;
      const targetPhone = stepData.beneficiary;
      const finalAmount = stepData.amount;
      
      // Map plans or service network identifiers
      let planCode = stepData.planCode || '';
      if (serviceType === ServiceType.AIRTIME) {
        if (stepData.network === 'MTN') planCode = '1';
        else if (stepData.network === 'GLO') planCode = '2';
        else if (stepData.network === 'AIRTEL') planCode = '3';
        else if (stepData.network === '9MOBILE') planCode = '4';
      } else if (serviceType === ServiceType.ELECTRICITY) {
        planCode = `${stepData.serviceID} ${stepData.meterType || 'prepaid'}`;
      }

      // EXECUTE ATOMIC TRANSACTION
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Re-fetch user inside transaction lock
          const txUser = await tx.user.findUnique({
            where: { id: user.id },
            include: { wallet: true }
          });

          if (!txUser || !txUser.wallet) throw new Error('User or Wallet not found');
          if (txUser.wallet.balance < finalAmount) {
            throw new Error('Insufficient wallet balance');
          }

          let costPrice: number | null = null;
          // Retrieve pricing details
          if (serviceType === ServiceType.DATA) {
            const rule = await tx.servicePrice.findFirst({
              where: { planCode, serviceType: 'DATA' }
            });
            costPrice = rule ? rule.providerPrice : finalAmount * 0.95;
          } else if (serviceType === ServiceType.AIRTIME) {
            let networkKey = 'MTN_AIRTIME';
            if (planCode === '1') networkKey = 'MTN_AIRTIME';
            else if (planCode === '2') networkKey = 'GLO_AIRTIME';
            else if (planCode === '3') networkKey = 'AIRTEL_AIRTIME';
            else if (planCode === '4') networkKey = '9MOBILE_AIRTIME';

            const rule = await tx.servicePrice.findFirst({
              where: { planCode: networkKey, serviceType: 'AIRTIME' }
            });
            costPrice = rule ? finalAmount * rule.providerPrice : finalAmount * 0.97;
          } else {
            costPrice = finalAmount;
          }

          const reference = `AGD-WA-${uuidv4().slice(0, 6).toUpperCase()}`;

          // Create PENDING transaction
          const transaction = await tx.transaction.create({
            data: {
              userId: txUser.id,
              walletId: txUser.wallet.id,
              amount: finalAmount,
              serviceType,
              status: TransactionStatus.PENDING,
              provider: Provider.CHEAP_DATA_HUB,
              reference,
              description: `WhatsApp: ${serviceType} purchase for ${targetPhone}`,
            }
          });

          // Debit Wallet
          const updatedWallet = await tx.wallet.update({
            where: { id: txUser.wallet.id },
            data: { balance: { decrement: finalAmount } }
          });

          // Log Audit
          await tx.auditLog.create({
            data: {
              userId: txUser.id,
              action: 'DEBIT',
              amount: finalAmount,
              previousBalance: txUser.wallet.balance,
              newBalance: updatedWallet.balance,
              description: `WhatsApp debit for ${serviceType}. Ref: ${reference}`,
            }
          });

          return { transaction, user: txUser, costPrice };
        });

        // Trigger External VTU Engine outside the DB lock
        try {
          const engineResponse = await vtuEngine.processTransaction({
            serviceType,
            phone: targetPhone,
            planCode,
            amount: finalAmount,
            reference: result.transaction.reference
          });

          const finalCost = result.costPrice || (engineResponse as any).costPrice || (finalAmount * 0.95);
          const profit = finalAmount - finalCost;

          // Commit to SUCCESS
          await prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
              status: TransactionStatus.SUCCESS,
              provider: engineResponse.providerUsed as Provider,
              costPrice: finalCost,
              profit
            }
          });

          // Create Notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'WhatsApp Transaction Successful',
              message: `Your WhatsApp ${serviceType} purchase for ${targetPhone} (₦${finalAmount}) was successful. Ref: ${result.transaction.reference}`,
              type: 'SUCCESS'
            }
          });

          // Send receipt email asynchronously
          EmailService.sendPurchaseReceipt(
            result.user.email,
            result.user.name,
            serviceType,
            finalAmount,
            result.transaction.reference
          ).catch(e => console.error('Failed to send purchase receipt', e));

          // Reply Success!
          await WhatsAppService.sendText(
            phone,
            `✅ **Transaction Successful!** 🎉\n\n` +
            `• **Service**: ${serviceType}\n` +
            `• **Account**: ${targetPhone}\n` +
            `• **Amount**: ₦${finalAmount}\n` +
            `• **Ref**: \`${result.transaction.reference}\`\n\n` +
            `Thank you for using AGD Data Plus! 🌟`
          );

        } catch (engineError: any) {
          console.error('[WhatsApp Engine Error] transaction failed. Refunding...', engineError.message);

          // Initiate Refund Transactionally
          await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
              where: { id: result.transaction.id },
              data: { status: TransactionStatus.FAILED }
            });

            const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
            if (!wallet) return;

            const refunded = await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: finalAmount } }
            });

            await tx.auditLog.create({
              data: {
                userId: user.id,
                action: 'CREDIT',
                amount: finalAmount,
                previousBalance: wallet.balance,
                newBalance: refunded.balance,
                description: `WhatsApp failed refund. Ref: ${result.transaction.reference}`,
              }
            });
          });

          await WhatsAppService.sendText(
            phone,
            `❌ **Transaction Failed**\n\nThe service provider was unable to complete your purchase of ₦${finalAmount} for ${targetPhone}.\n\n**Your wallet balance has been refunded successfully.**`
          );
        }

      } catch (dbError: any) {
        await WhatsAppService.sendText(phone, `❌ **Transaction Declined**: ${dbError.message}`);
      }
    }
  }

  /**
   * Generates standard menu list
   */
  private static getMenuText(): string {
    return (
      `🌟 **AGD Data Plus Chatbot Menu** 🌟\n\n` +
      `Please reply with the number of your choice:\n` +
      `1. 💰 Check Wallet Balance\n` +
      `2. 📱 Buy Airtime\n` +
      `3. 📶 Buy Data\n` +
      `4. 💡 Pay Electricity Bill\n` +
      `5. 📺 Cable TV Subscription\n\n` +
      `💡 _Reply **cancel** at any point to exit._`
    );
  }
}
