export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <h1 className="text-3xl font-bold text-red-400" style={{ fontFamily: "var(--font-orbitron)" }}>
        Access Denied
      </h1>
      <p className="text-gray-300 max-w-md">
        You do not have permission to access this portal. Please contact your
        administrator to request access.
      </p>
      <a
        href="/auth/logout"
        className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
      >
        Log out
      </a>
    </div>
  );
}
