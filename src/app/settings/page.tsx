import type { Metadata } from "next";
import SettingsScreen from "./SettingsScreen";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Personal details, AJEX delivery address, Mamo Pay tokens, and notification preferences.",
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
