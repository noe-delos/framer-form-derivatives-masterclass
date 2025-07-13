/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import twilio from 'twilio';

const WEBHOOK_SECRET = process.env.FRAMER_WEBHOOK_SECRET;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  telephone: string;
  enrolledAt: string;
}

function isWebhookSignatureValid(
  secret: string,
  submissionId: string,
  payload: Buffer,
  signature: string
): boolean {
  console.log('🔒 Signature validation:', {
    signatureLength: signature.length,
    expectedLength: 71,
    hasSecret: !!secret,
    submissionId: submissionId
  });
  
  if (signature.length !== 71) {
    console.error('❌ Invalid signature length:', signature.length);
    return false;
  }

  const payloadHmac = createHmac('sha256', secret);
  payloadHmac.update(payload);
  payloadHmac.update(submissionId);

  const expectedSignature = `sha256=${payloadHmac.digest('hex')}`;
  const isValid = signature === expectedSignature;
  
  console.log('🔍 Signature comparison:', {
    provided: signature.substring(0, 20) + '...',
    expected: expectedSignature.substring(0, 20) + '...',
    match: isValid
  });
  
  return isValid;
}

async function getEnrolledUsers(): Promise<EnrolledUser[]> {
  const filePath = path.join(process.cwd(), 'data', 'enrolled-users.json');
  console.log('📂 Reading enrolled users from:', filePath);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const users = JSON.parse(data);
    console.log('✅ Successfully loaded', users.length, 'enrolled users');
    return users;
  } catch (error) {
    console.log('⚠️ No existing users file found, creating new one');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, '[]', 'utf-8');
    console.log('📝 Created new enrolled users file');
    return [];
  }
}

async function saveEnrolledUsers(users: EnrolledUser[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'enrolled-users.json');
  console.log('💾 Saving', users.length, 'users to:', filePath);
  
  try {
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8');
    console.log('✅ Users saved successfully');
  } catch (error) {
    console.error('❌ Failed to save users:', error);
    throw error;
  }
}

async function sendConfirmationSMS(phoneNumber: string, name: string): Promise<void> {
  console.log('📱 Preparing SMS for:', {
    recipient: name,
    phoneNumber: phoneNumber.substring(0, 7) + '***',
    fromNumber: TWILIO_PHONE_NUMBER
  });
  
  try {
    const message = await twilioClient.messages.create({
      body: `Hi ${name}, your enrollment has been confirmed! Welcome to our program.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log('✅ SMS sent successfully:', {
      messageSid: message.sid,
      status: message.status,
      to: message.to.substring(0, 7) + '***'
    });
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    console.error('SMS Error details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      phoneNumber: phoneNumber.substring(0, 7) + '***',
      hasAccountSid: !!TWILIO_ACCOUNT_SID,
      hasAuthToken: !!TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!TWILIO_PHONE_NUMBER
    });
  }
}

export async function POST(request: NextRequest) {
  console.log('📨 Webhook POST request received');
  
  try {
    const body = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(body);
    console.log('📦 Request body size:', bodyBuffer.length, 'bytes');
    
    const signature = request.headers.get('Framer-Signature');
    const submissionId = request.headers.get('framer-webhook-submission-id');
    
    console.log('🔑 Headers:', {
      signature: signature ? `${signature.substring(0, 20)}...` : 'missing',
      submissionId: submissionId || 'missing'
    });

    if (!signature || !submissionId) {
      console.error('❌ Missing required headers:', { signature: !!signature, submissionId: !!submissionId });
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    console.log('🔐 Validating webhook signature...');
    if (!isWebhookSignatureValid(WEBHOOK_SECRET as string, submissionId, bodyBuffer, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    console.log('✅ Webhook signature valid');

    const data = JSON.parse(bodyBuffer.toString());
    console.log('📊 Parsed webhook data:', {
      fields: Object.keys(data),
      hasName: !!data.name,
      hasEmail: !!data.email,
      hasTelephone: !!data.telephone
    });
    
    const { name, email, telephone } = data;

    if (!name || !email || !telephone) {
      console.error('❌ Missing required fields:', { name: !!name, email: !!email, telephone: !!telephone });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('👤 Processing enrollment for:', { name, email, telephone: telephone.substring(0, 7) + '***' });

    const users = await getEnrolledUsers();
    console.log('📋 Current enrolled users count:', users.length);
    
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      console.log('ℹ️ User already enrolled:', email);
    } else {
      const newUser: EnrolledUser = {
        id: submissionId,
        name,
        email,
        telephone,
        enrolledAt: new Date().toISOString()
      };
      
      console.log('➕ Adding new user to enrollment list');
      users.push(newUser);
      await saveEnrolledUsers(users);
      console.log('💾 User data saved successfully');
      
      console.log('📱 Sending SMS confirmation to:', telephone.substring(0, 7) + '***');
      await sendConfirmationSMS(telephone, name);
      console.log('✅ SMS confirmation sent successfully');
    }

    console.log('🎉 Webhook processed successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('🚨 Webhook error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}