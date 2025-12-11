import { getProfileAction } from "@/actions/profile";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { data: user } = await getProfileAction();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Welcome back, {user?.firstName + " " + user?.lastName || "Admin"}!
        </h2>
        <p className="text-gray-600">
          Use the sidebar to navigate through the admin panel. You can manage
          users, roles, permissions, brands, categories, products, SKUs, and
          orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Orders"
          description="Manage customer orders"
          link="/admin/orders"
          linkText="View Orders"
        />
        <DashboardCard
          title="Products"
          description="Manage your product catalog"
          link="/admin/products"
          linkText="View Products"
        />
        <DashboardCard
          title="Users"
          description="Manage registered users"
          link="/admin/users"
          linkText="View Users"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  link,
  linkText,
}: {
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      <Link
        href={link}
        className="inline-block text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {linkText}
      </Link>
    </div>
  );
}
