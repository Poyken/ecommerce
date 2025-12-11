import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { getSession } from "@/lib/session";
import { Package, ShoppingCart, User } from "lucide-react";
import Link from "next/link";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl mx-auto px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">E-commerce</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline"
          >
            Home
          </Link>
          {session && (
            <>
              <Link
                href="/orders"
                className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline flex items-center gap-1"
              >
                <Package size={16} /> Orders
              </Link>
              <Link
                href="/cart"
                className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline flex items-center gap-1"
              >
                <ShoppingCart size={16} /> Cart
              </Link>
              {(() => {
                const permissions = getPermissionsFromToken(session);
                if (permissions.includes("admin:read")) {
                  return (
                    <Link
                      href="/admin"
                      className="transition-colors hover:text-foreground/80 text-foreground/60 hover:underline flex items-center gap-1 font-semibold text-blue-600"
                    >
                      Admin
                    </Link>
                  );
                }
                return null;
              })()}
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User size={20} />
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
