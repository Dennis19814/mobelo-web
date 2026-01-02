'use client';
export default function SettingsNotificationsSection() {
  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
        <p className="text-sm md:text-base text-gray-600 break-words">Configure how and when you receive notifications</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Email notifications for new orders</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" />
          </label>
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Push notifications for activities</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" />
          </label>
          <label className="flex flex-row items-center justify-between gap-2">
            <span className="text-sm text-gray-700">Weekly summary reports</span>
            <input type="checkbox" className="rounded text-orange-600 focus:ring-orange-500 shrink-0" defaultChecked />
          </label>
        </div>
      </div>
    </div>
  );
}

