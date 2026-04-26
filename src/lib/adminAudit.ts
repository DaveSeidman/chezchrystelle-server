export function getActorSummary(user: any) {
  if (!user) {
    return null;
  }

  return {
    actorId: String(user._id),
    actorEmail: user.email ?? '',
    actorDisplayName: user.displayName ?? '',
    actorIsAdmin: Boolean(user.isAdmin)
  };
}
