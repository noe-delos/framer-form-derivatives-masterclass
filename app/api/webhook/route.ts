/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getUserByEmail, addUser, getUserCount } from '@/lib/db';

const WEBHOOK_SECRET = process.env.FRAMER_WEBHOOK_SECRET;

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
      fullData: data,
      hasName: !!data.name,
      hasEmail: !!data.email,
      hasNameCap: !!data.Name,
      hasEmailCap: !!data.Email
    });
    
    // Handle both lowercase and capitalized field names
    const name = data.name || data.Name;
    const email = data.email || data.Email;
    const location = data.Location;
    const newsletter = data.Newsletter === 'on';
    const niveauEtudes = data['Niveau d\'études'];
    const telephone = data['Téléphone'];
    const ecole = data['École'];

    console.log('🔍 Extracted values:', { 
      name, 
      email,
      location,
      newsletter,
      niveauEtudes,
      telephone,
      ecole
    });

    if (!name || !email) {
      console.error('❌ Missing required fields:', { 
        name: !!name, 
        email: !!email,
        availableFields: Object.keys(data)
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('👤 Processing enrollment for:', { name, email });

    const userCount = await getUserCount();
    console.log('📋 Current enrolled users count:', userCount);
    
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      console.log('ℹ️ User already enrolled:', email);
    } else {
      const newUser = {
        id: submissionId,
        name,
        email,
        location,
        newsletter,
        niveau_etudes: niveauEtudes,
        telephone,
        ecole
      };
      
      console.log('➕ Adding new user to Supabase');
      const success = await addUser(newUser);
      
      if (success) {
        console.log('💾 User data saved successfully to Supabase');
      } else {
        console.error('❌ Failed to save user to Supabase');
        return NextResponse.json(
          { error: 'Failed to save user' },
          { status: 500 }
        );
      }
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