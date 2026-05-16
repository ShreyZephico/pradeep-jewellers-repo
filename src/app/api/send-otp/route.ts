import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, sendOTPviaSMS } from '@/lib/otpService';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    console.log(`\n========== SEND OTP REQUEST ==========`);
    console.log(`📞 Phone: ${phone}`);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // ✅ Clean phone number
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Generate and store OTP
    const otp = generateOTP();
    console.log(`🔑 Generated OTP: ${otp}`);
    
    storeOTP(cleanPhone, otp);

    // Send OTP via SMS
    const sent = await sendOTPviaSMS(cleanPhone, otp);

    console.log(`========== SEND OTP COMPLETE ==========\n`);

    if (!sent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send OTP. Please check the phone number and try again.',
          debug: process.env.NODE_ENV === 'development' ? { otp } : undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
