import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const isRootAdmin = user?.roles.includes("RootAdmin") ?? false;
  const isAdmin = user?.roles.includes("Admin") ?? false;
  const isRegionalAdmin = user?.roles.includes("RegionalAdmin") ?? false;

  return {
    user,
    isRootAdmin,
    isAdmin,
    isRegionalAdmin,
    regionId: user?.regionId ?? null,
    churchId: user?.churchId ?? null
  };
}
