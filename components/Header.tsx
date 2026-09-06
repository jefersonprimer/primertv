import { getSession } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const session = await getSession();
  const user = session?.user;

  return <HeaderClient user={user} />;
}
