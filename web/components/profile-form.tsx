"use client";

import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/actions/address";
import { updateProfileAction } from "@/actions/profile";
import { AddAddressDialog } from "@/components/add-address-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  addresses?: any[];
}

export function ProfileForm({ user }: { user: User }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleUpdateProfile = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      startTransition(async () => {
        const res = await deleteAddressAction(id);
        if (res.success) {
          toast({ title: "Address deleted" });
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: res.error,
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if (res.success) {
        toast({ title: "Default address updated" });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  const openEdit = (address: any) => {
    setEditingAddress(address);
    setAddAddressOpen(true);
  };

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <form action={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={`${user.firstName} ${user.lastName}`}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="addresses">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>
                Manage your shipping addresses for checkout.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingAddress(null);
                setAddAddressOpen(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </CardHeader>
          <CardContent>
            {user.addresses && user.addresses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {user.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-lg border flex flex-col justify-between ${
                      addr.isDefault
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          {addr.recipientName}
                        </div>
                        {addr.isDefault && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                          >
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {addr.phoneNumber}
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span>
                            {addr.street}, {addr.ward && `${addr.ward}, `}
                            {addr.district}, {addr.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={isPending}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(addr)}
                        disabled={isPending}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteAddress(addr.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No addresses found. Add one to speed up checkout.
              </div>
            )}
          </CardContent>
        </Card>

        <AddAddressDialog
          open={addAddressOpen}
          onOpenChange={setAddAddressOpen}
          onSuccess={() => router.refresh()}
          address={editingAddress}
        />
      </TabsContent>

      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <form action={handleUpdateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  name="currentPassword"
                  type="password"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  name="newPassword"
                  type="password"
                  required
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Changing..." : "Change password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
