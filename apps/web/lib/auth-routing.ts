export function resolvePostLoginRoute(role: string | null | undefined): string {
  switch (role) {
    case "platform_admin":
      return "/dashboard";
    case "platform_owner":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
