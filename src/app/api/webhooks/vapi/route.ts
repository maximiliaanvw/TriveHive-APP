import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Vapi Webhook Handler
 * 
 * Receives webhook events from Vapi when calls end.
 * Only processes 'end-of-call-report' events and stores them in Supabase.
 * 
 * Webhook URL: /api/webhooks/vapi
 * 
 * This is a server-to-server webhook, so we use the service role key
 * to bypass RLS and perform database operations.
 */

// Type definitions for Vapi webhook payload
interface VapiWebhookPayload {
  message: {
    type: string;
    call?: {
      id: string;
      assistantId?: string;
      status?: string;
      durationSeconds?: number;
      startedAt?: string;
      customer?: {
        number?: string;
        name?: string;
      };
      transcript?: string;
      recordingUrl?: string;
      artifact?: {
        transcript?: string;
      };
      analysis?: {
        summary?: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate the request body
    const body: VapiWebhookPayload = await request.json();

    // Step 1: Validation - Check if message.type === 'end-of-call-report'
    if (body.message?.type !== "end-of-call-report") {
      // Return 200 OK and exit (to stop Vapi from retrying)
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Step 2: Extraction - Get call data from the body
    const call = body.message.call;
    if (!call || !call.id) {
      console.error("Missing call data in webhook payload");
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Step 3: Owner Lookup - Find user_id from user_settings table
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Lookup user_id using assistantId
    let userId: string | null = null;
    const assistantId = call.assistantId;

    if (assistantId) {
      const { data: userSettings, error: lookupError } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("vapi_assistant_id", assistantId)
        .single();

      if (lookupError) {
        if (lookupError.code === "PGRST116") {
          // No user found for this assistant ID - orphan call
          console.warn(`Orphan call received for assistant ${assistantId}`);
        } else {
          console.error("Error looking up user settings:", lookupError);
        }
        // Continue with userId = null (orphan call)
      } else if (userSettings) {
        userId = userSettings.user_id;
      }
    } else {
      console.warn("No assistantId found in webhook payload");
    }

    // Step 4: Data Preparation - Map Vapi fields to our DB columns
    const vapiCallId = call.id;
    const customerNumber = call.customer?.number || null;
    const status = call.status || null;
    
    // Ensure duration_seconds is a number
    const durationSeconds = call.durationSeconds != null 
      ? Number(call.durationSeconds) 
      : null;
    
    const startedAt = call.startedAt || null;
    
    // Extract summary from call.analysis.summary
    const summary = call.analysis?.summary || null;
    
    // Extract transcript: try call.transcript first, then call.artifact.transcript
    const transcript = call.transcript || call.artifact?.transcript || null;
    
    // Extract recording URL
    const recordingUrl = call.recordingUrl || null;

    // Step 5: Insert the new row into the calls table
    const { error: insertError } = await supabase.from("calls").insert({
      vapi_call_id: vapiCallId,
      user_id: userId, // NULL if not found (orphan call)
      assistant_id: assistantId || null,
      customer_number: customerNumber,
      status: status,
      duration_seconds: durationSeconds,
      started_at: startedAt,
      summary: summary,
      transcript: transcript,
      recording_url: recordingUrl,
      ended_reason: null, // Not specified in mapping, can be added later if needed
      analysis_data: call.analysis || null, // Store full analysis object
    });

    if (insertError) {
      console.error("Error inserting call data:", insertError);
      // Still return success to prevent Vapi from retrying
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Step 6: Response - Return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return success even on error to prevent Vapi from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
