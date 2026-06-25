export function NoAvailableToEntraUsers() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your account does not have access to this feature. Please contact support for assistance.
        </p>
        </div>
    );

}