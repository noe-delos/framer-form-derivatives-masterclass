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
  if (signature.length !== 71) {
    return false;
  }

  const payloadHmac = createHmac('sha256', secret);
  payloadHmac.update(payload);
  payloadHmac.update(submissionId);

  const expectedSignature = `sha256=${payloadHmac.digest('hex')}`;
  return signature === expectedSignature;
}

async function getEnrolledUsers(): Promise<EnrolledUser[]> {
  const filePath = path.join(process.cwd(), 'data', 'enrolled-users.json');
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, '[]', 'utf-8');
    return [];
  }
}

async function saveEnrolledUsers(users: EnrolledUser[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'enrolled-users.json');
  await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8');
}

async function sendConfirmationSMS(phoneNumber: string, name: string): Promise<void> {
  try {
    await twilioClient.messages.create({
      body: `Hi ${name}, your enrollment has been confirmed! Welcome to our program.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(body);
    
    const signature = request.headers.get('Framer-Signature');
    const submissionId = request.headers.get('framer-webhook-submission-id');

    if (!signature || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    if (!isWebhookSignatureValid(WEBHOOK_SECRET as string, submissionId, bodyBuffer, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data = JSON.parse(bodyBuffer.toString());
    const { name, email, telephone } = data;

    if (!name || !email || !telephone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const users = await getEnrolledUsers();
    
    const existingUser = users.find(user => user.email === email);
    
    if (!existingUser) {
      const newUser: EnrolledUser = {
        id: submissionId,
        name,
        email,
        telephone,
        enrolledAt: new Date().toISOString()
      };
      
      users.push(newUser);
      await saveEnrolledUsers(users);
      
      await sendConfirmationSMS(telephone, name);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}