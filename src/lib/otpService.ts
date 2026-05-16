declare global {
  var _otpStore: Map<string, { otp: string; expiresAt: number; attempts: number }> | undefined;
}

const getOtpStore = () => {
  if (!global._otpStore) {
    global._otpStore = new Map();
    console.log('🆕 Created new OTP store');
  }
  return global._otpStore;
};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(identifier: string, otp: string): void {
  const normalizedId = identifier.replace(/[\s\+\(\)\-]/g, '');
  const store = getOtpStore();
  
  store.set(normalizedId, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  
  console.log(`📦 OTP Stored: ${normalizedId} → ${otp}`);
  
  setTimeout(() => {
    if (store.get(normalizedId)) {
      store.delete(normalizedId);
      console.log(`🗑️ OTP expired: ${normalizedId}`);
    }
  }, 10 * 60 * 1000);
}

export function verifyOTP(identifier: string, userOTP: string): { valid: boolean; error?: string } {
  const normalizedId = identifier.replace(/[\s\+\(\)\-]/g, '');
  const store = getOtpStore();
  const record = store.get(normalizedId);
  
  console.log(`🔍 Verifying: ${normalizedId} with OTP: ${userOTP}`);
  console.log(`📦 Stored OTP: ${record?.otp}`);
  
  if (!record) {
    return { valid: false, error: 'OTP expired or not found. Please request a new OTP.' };
  }
  
  if (record.expiresAt < Date.now()) {
    store.delete(normalizedId);
    return { valid: false, error: 'OTP has expired. Please request a new OTP.' };
  }
  
  if (record.attempts >= 5) {
    store.delete(normalizedId);
    return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  if (record.otp !== userOTP) {
    record.attempts++;
    return { valid: false, error: `Invalid OTP (${5 - record.attempts} attempts left)` };
  }
  
  store.delete(normalizedId);
  console.log(`✅ OTP verified!`);
  return { valid: true };
}

// ✅ FIXED: 2Factor SMS OTP SENDING
export async function sendOTPviaSMS(mobileNumber: string, otp: string): Promise<boolean> {
  try {
    const rawNumber = mobileNumber.replace(/[\s\+\(\)\-]/g, '');
    const tenDigitNumber = rawNumber.slice(-10);
    
    console.log(`\n📱 Sending SMS OTP via 2Factor:`);
    console.log(`   Phone: ${tenDigitNumber}`);
    console.log(`   OTP: ${otp}`);

    const apiKey = process.env.TWOFACTOR_API_KEY;
    
    if (!apiKey) {
      console.error('❌ TWOFACTOR_API_KEY not found in .env.local');
      return false;
    }
    
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${tenDigitNumber}/${otp}/PradeepApp`;
    console.log(`📤 URL: ${url}`);
    
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    console.log('📥 2Factor Response:', data);
    
    // ✅ FIXED: Check for 'Success' (2Factor returns "Success", not "OK")
    if (data.Status === 'Success') {
      console.log(`✅✅✅ SMS SENT SUCCESSFULLY to ${tenDigitNumber}!`);
      console.log(`📱 Transaction ID: ${data.Details}`);
      console.log(`💡 Check your phone for the OTP message.\n`);
      return true;
    } else {
      console.log(`❌ 2Factor Error: ${data.Details}`);
      return false;
    }

  } catch (error) {
    console.error('❌ SMS Error:', error);
    return false;
  }
}
