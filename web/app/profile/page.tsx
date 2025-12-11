import { logoutAction } from '@/actions/auth';
import { getProfileAction } from '@/actions/profile';
import { ProfileForm } from '@/components/profile-form';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
  const { data: user, error } = await getProfileAction();

  if (error || !user) {
    // Xử lý trạng thái lỗi hoặc chuyển hướng
    return (
        <div className="container mx-auto p-8 text-center text-red-500">
            Failed to load profile. Please try logging in again.
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <ProfileForm user={user} />
      
      <div className="mt-8 flex justify-end">
        <form action={logoutAction}>
           <Button variant="destructive">Logout</Button>
        </form>
      </div>
    </div>
  );
}
