import proxy, { config as proxyConfig } from "./proxy";

export default proxy;

export const config = proxyConfig || {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
