'use client';
export default function SettingsAppearanceSection() {
  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-full overflow-hidden min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">App Appearance</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              <button className="w-10 h-10 bg-orange-600 rounded-lg border-2 border-gray-300"></button>
              <button className="w-10 h-10 bg-green-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-purple-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-red-600 rounded-lg border-2 border-transparent"></button>
              <button className="w-10 h-10 bg-gray-600 rounded-lg border-2 border-transparent"></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

