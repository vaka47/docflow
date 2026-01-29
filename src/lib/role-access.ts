export const roleAccess: Record<string, string[]> = {
  ADMIN: ["/admin", "/integrations", "/workflow", "/intake", "/metrics", "/knowledge", "/workspace", "/roles", "/crowd", "/account", "/playbook", "/team", "/chat"],
  MANAGER: ["/workflow", "/intake", "/metrics", "/knowledge", "/workspace", "/integrations", "/roles", "/account", "/playbook", "/team", "/chat", "/crowd"],
  EDITOR: ["/workflow", "/knowledge", "/workspace", "/account", "/team", "/chat"],
  LEGAL: ["/workflow", "/knowledge", "/account", "/team", "/chat"],
  CROWD: ["/crowd", "/workflow", "/knowledge", "/account", "/team", "/chat"],
  REQUESTER: ["/workflow", "/intake", "/knowledge", "/account", "/team", "/chat"],
  GUEST: ["/login", "/register", "/setup"],
};

export function isRouteAllowed(role: string, path: string) {
  const allowed = roleAccess[role] ?? roleAccess.MANAGER;
  return allowed.some((route) => path.startsWith(route));
}
