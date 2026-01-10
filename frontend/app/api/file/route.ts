import { NextResponse, NextRequest } from "next/server";
import { PinataSDK } from "pinata";

export async function POST(request: NextRequest) {
    try {
        // 1. Check Env Vars
        if (!process.env.PINATA_JWT) {
            console.error("❌ Missing PINATA_JWT in .env.local");
            return NextResponse.json({ error: "Server misconfiguration: Missing JWT" }, { status: 500 });
        }

        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT,
            pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
        });

        const data = await request.formData();
        const file = data.get("file") as File | null;

        if (!file) {
            console.error("❌ No file received in request");
            return NextResponse.json({ error: "No file found" }, { status: 400 });
        }

        console.log(`Received file: ${file.name} (${file.size} bytes)`);

        const upload = await pinata.upload.public.file(file);

        const url = await pinata.gateways.public.convert(upload.cid);

        return NextResponse.json({ url }, { status: 200 });

    } catch (e: any) {
        console.error("❌ Upload Route Error:", e);
        return NextResponse.json(
            { error: "Internal Server Error", details: e.message },
            { status: 500 }
        );
    }
}