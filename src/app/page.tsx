import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard overview by default
  redirect("/overview");
}
