import ProfileScreen from "@/app/profile/ProfileScreen";
import { listListings } from "@/lib/listings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const listings = await listListings();
  return <ProfileScreen listings={listings} />;
}
