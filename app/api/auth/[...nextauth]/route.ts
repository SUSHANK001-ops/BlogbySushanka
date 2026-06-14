import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export const GET = (req: NextRequest) => handlers.GET(req) as Promise<Response>;
export const POST = (req: NextRequest) => handlers.POST(req) as Promise<Response>;
