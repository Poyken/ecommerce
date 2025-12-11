import { getProfileAction } from "@/actions/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await getProfileAction();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Users
          </Link>
          <Link
            href="/admin/roles"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Roles
          </Link>
          <Link
            href="/admin/permissions"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Permissions
          </Link>
          <Link
            href="/admin/brands"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Brands
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Categories
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Products
          </Link>
          <Link
            href="/admin/skus"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            SKUs
          </Link>
          <Link
            href="/admin/orders"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Orders
          </Link>
          <Link
            href="/admin/reviews"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Reviews
          </Link>
          <div className="pt-4 mt-4 border-t border-gray-700">
            <Link
              href="/"
              className="block px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              ← Back to Store
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
