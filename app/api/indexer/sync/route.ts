import { NextResponse } from "next/server";
import { syncSlugEvents } from "@/lib/indexer/slug-sync";

// This route should be secured (e.g., via a secret key header) to prevent abuse.
// For MVP, we'll keep it open but rate-limited or manual.

export async function GET(request: Request) {
    try {
        // Add simple authorization check here if needed
        // const authHeader = request.headers.get("Authorization");
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new NextResponse("Unauthorized", { status: 401 });
        // }

        await syncSlugEvents();
        return NextResponse.json({ success: true, message: "Sync complete" });
    } catch (error) {
        console.error("Indexer Sync Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
