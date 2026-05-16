import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otpService';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    console.log(`\n========== VERIFY OTP REQUEST ==========`);
    console.log(`📞 Phone: ${phone}`);
    console.log(`🔑 Entered OTP: ${otp}`);

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const result = verifyOTP(phone, otp);

    if (result.valid) {
      console.log(`✅ OTP verified successfully!`);
      console.log(`========== VERIFY OTP COMPLETE ==========\n`);
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
      });
    } else {
      console.log(`❌ OTP verification failed: ${result.error}`);
      console.log(`========== VERIFY OTP COMPLETE ==========\n`);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}