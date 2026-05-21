import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,

        variants (
          id,
          variant_name,
          final_price
        )
      `);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      products: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
