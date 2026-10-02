import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { supabaseMode } from "@/lib/supabase/config";

/**
 * Everything under (app) requires a session. Without one we redirect to the
 * login page rather than silently showing the demo student's data, so nobody is
 * ever confused about whose plan they are reading.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const locale = await currentLocale();

  return (
    <AppShell user={user} locale={locale} mode={supabaseMode()}>
      {children}
    </AppShell>
  );
}
