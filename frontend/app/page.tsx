/**
 * Root page — redirects to dashboard or shows landing.
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
