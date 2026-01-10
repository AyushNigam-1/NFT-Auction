import { NextResponse, NextRequest } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

export async function POST(request: NextRequest) {
    try {
        const jsonData = await request.json();
        const upload = await pinata.upload.public.json(jsonData);
        const url = await pinata.gateways.public.convert(upload.cid);

        return NextResponse.json({ url }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}