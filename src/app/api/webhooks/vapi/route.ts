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
    assistantId?: string;
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
    analysis?: {
      summary?: string;
    };
    transcript?: string;
    artifact?: {
      transcript?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse the request body
    const body: VapiWebhookPayload = await request.json();

    // Log the entire payload for debugging
    console.log("Vapi Payload:", JSON.stringify(body, null, 2));

    // Step 2: Strict Filtering - Only process 'end-of-call-report' messages
    if (body.message?.type !== "end-of-call-report") {
      console.log(`Ignored message type: ${body.message?.type || "unknown"}`);
      return NextResponse.json({ success: true, message: "Ignored non-end-of-call-report event" }, { status: 200 });
    }

    // Step 3: Validate required data
    const call = body.message.call;
    if (!call || !call.id) {
      console.error("Missing call data in webhook payload");
      return NextResponse.json(
        { success: false, error: "Missing call data" },
        { status: 200 } // Return 200 to prevent Vapi retries
      );
    }

    // Step 4: Initialize Supabase client
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

    // Step 5: Robust Extraction - Try multiple locations for assistantId
    let assistantId: string | null = null;
    
    // Try body.message.call.assistantId first
    if (call.assistantId) {
      assistantId = call.assistantId;
      console.log(`Found assistantId in call.assistantId: ${assistantId}`);
    }
    // Fallback to body.message.assistantId
    else if (body.message.assistantId) {
      assistantId = body.message.assistantId;
      console.log(`Found assistantId in message.assistantId: ${assistantId}`);
    } else {
      console.warn("No assistantId found in webhook payload");
    }

    // Step 6: Lookup user_id from user_settings table
    let userId: string | null = null;

    if (assistantId) {
      try {
        const { data: userSettings, error: lookupError } = await supabase
          .from("user_settings")
          .select("user_id")
          .eq("vapi_assistant_id", assistantId)
          .single();

        if (lookupError) {
          if (lookupError.code === "PGRST116") {
            // No user found for this assistant ID
            console.log(`No user found for assistant ${assistantId}`);
          } else {
            console.error("Error looking up user settings:", lookupError);
          }
          // Continue with userId = null (orphan call)
        } else if (userSettings?.user_id) {
          userId = userSettings.user_id;
          console.log(`Found user_id: ${userId} for assistant ${assistantId}`);
        }
      } catch (error) {
        console.error("Exception during user lookup:", error);
        // Continue with userId = null
      }
    }

    // Step 7: Field Mapping - Extract summary and transcript from multiple possible locations
    // Summary: try body.message.analysis.summary OR body.message.call.analysis.summary
    const summary = body.message.analysis?.summary || call.analysis?.summary || null;
    
    // Transcript: try body.message.transcript OR body.message.artifact.transcript
    // OR call.transcript OR call.artifact.transcript
    const transcript = 
      body.message.transcript || 
      body.message.artifact?.transcript || 
      call.transcript || 
      call.artifact?.transcript || 
      null;

    // Step 8: Prepare data for insertion
    const vapiCallId = call.id;
    const customerNumber = call.customer?.number || null;
    const status = call.status || null;
    
    // Ensure duration_seconds is a number
    const durationSeconds = call.durationSeconds != null 
      ? Number(call.durationSeconds) 
      : null;
    
    const startedAt = call.startedAt || null;
    const recordingUrl = call.recordingUrl || null;

    console.log("Inserting call data:", {
      vapi_call_id: vapiCallId,
      user_id: userId,
      assistant_id: assistantId,
      has_summary: !!summary,
      has_transcript: !!transcript,
    });

    // Step 9: Insert the call into the database
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
      analysis_data: call.analysis || body.message.analysis || null, // Store full analysis object
    });

    if (insertError) {
      console.error("Error inserting call data:", insertError);
      // Still return 200 to prevent Vapi from retrying
      return NextResponse.json(
        { success: false, error: "Database insert failed", details: insertError.message },
        { status: 200 }
      );
    }

    console.log(`Successfully saved call ${vapiCallId} with user_id: ${userId || "null"}`);

    // Step 10: Return success response
    return NextResponse.json({ 
      success: true,
      call_id: vapiCallId,
      user_id: userId,
      assistant_id: assistantId
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing webhook:", error);
    
    // Log error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Return 200 even on error to prevent Vapi from retrying
    return NextResponse.json(
      { 
        success: false, 
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}
