"use client";

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">FAITH Connect Admin</h1>
        <p className="text-gray-600 mt-1">
          System-level tools and configuration
        </p>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Churches */}
        <Link
          href="/admin/churches"
          className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">Churches</h2>
          <p className="text-gray-600">
            Create, edit, and manage all churches.
          </p>
        </Link>

        {/* Users */}
        <Link
          href="/admin/users"
          className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <p className="text-gray-600">
            View and manage system-level users.
          </p>
        </Link>

        {/* System Settings */}
        <Link
          href="/admin/settings"
          className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">System Settings</h2>
          <p className="text-gray-600">
            Global configuration and platform settings.
          </p>
        </Link>

        {/* Activity Logs */}
        <Link
          href="/admin/logs"
          className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold mb-2">Activity Logs</h2>
          <p className="text-gray-600">
            System-wide events and audit trails.
          </p>
        </Link>

      </div>
    </div>
  );
}
