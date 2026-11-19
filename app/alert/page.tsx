import type { Metadata } from "next";
import AlertScreen from "@/components/alert/AlertScreen";

export const metadata: Metadata = {
  title: "VigilAlert",
  description: "Preparedness, notifications and a crisis screen for earthquakes. Works offline. Not an official warning system.",
};

export default function AlertPage() {
  return <AlertScreen />;
}
