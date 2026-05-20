import type { NextRequest } from "next/server";
import { proxy as innerProxy } from "./src/proxy";

export function proxy(req: NextRequest) {
  return innerProxy(req);
}

export default proxy;

export const config = {
  matcher: ["/((?!.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|pdf)$).*)"],
};

