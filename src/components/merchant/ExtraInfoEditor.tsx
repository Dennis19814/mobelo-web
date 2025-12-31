import React from 'react'
import {
  Info as LInfo,
  Star as LStar,
  Shield as LShield,
  Zap as LZap,
  Gift as LGift,
  Tag as LTag,
  CheckCircle as LCheckCircle,
  Truck as LTruck,
  Package as LPackage,
  MapPin as LMapPin,
  Percent as LPercent,
  Heart as LHeart,
  Clock as LClock,
  Palette as LPalette,
  Award as LAward,
  Briefcase as LBriefcase,
  Car as LCar,
  FileText as LFileText,
  Settings as LSettings,
  Phone as LPhone,
  Mail as LMail,
  Calendar as LCalendar,
  Bell as LBell,
  User as LUser,
  Home as LHome,
  ShoppingCart as LShoppingCart,
  ShoppingBag as LShoppingBag,
  TrendingUp as LTrendingUp,
  Flame as LFlame,
  CreditCard as LCreditCard,
  Lock as LLock,
  MessageSquare as LMessageSquare,
  MoreVertical as LMoreVertical,
  MoreHorizontal as LMoreHorizontal,
  RefreshCw as LRefreshCw,
  HelpCircle as LHelpCircle,
  AlertTriangle as LAlertTriangle,
  SlidersHorizontal as LSlidersHorizontal,
  Headphones as LHeadphones,
} from 'lucide-react'

type Section = {
  id: string
  title: string
  type: 'bullet' | 'key-value'
  items: any
  iconKey?: string
  iconColor?: string
}

type Extras = {
  version?: number
  sections: Section[]
}

interface ExtraInfoEditorProps {
  metadata: any
  onChange: (metadata: any) => void
}

export default function ExtraInfoEditor({ metadata, onChange }: ExtraInfoEditorProps) {
  // Scope is always default as per requirement
  const extras: Extras = metadata?.extras || { version: 1, sections: [] }
  const [openPicker, setOpenPicker] = React.useState<number | null>(null)

  const updateExtras = (next: Extras) => {
    const m = { ...(metadata || {}) }
    m.extras = next
    // ensure removal of vertical overrides if present (optional)
    onChange(m)
  }

  const addSpecSection = () => {
    const s: Section = { id: `specs-${Date.now()}`, title: 'Specifications', type: 'key-value', items: [{ label: '', value: '' }], iconKey: '', iconColor: 'primary' }
    updateExtras({ ...extras, sections: [...extras.sections, s] })
  }

  const ICON_OPTIONS: Array<{ key: string; label: string; Icon: any }> = [
    { key: 'info', label: 'Info', Icon: LInfo },
    { key: 'star', label: 'Star', Icon: LStar },
    { key: 'shield', label: 'Shield', Icon: LShield },
    { key: 'zap', label: 'Zap', Icon: LZap },
    { key: 'gift', label: 'Gift', Icon: LGift },
    { key: 'tag', label: 'Tag', Icon: LTag },
    { key: 'check-circle', label: 'Check Circle', Icon: LCheckCircle },
    { key: 'truck', label: 'Truck', Icon: LTruck },
    { key: 'package', label: 'Package', Icon: LPackage },
    { key: 'map-pin', label: 'Map Pin', Icon: LMapPin },
    { key: 'percent', label: 'Percent', Icon: LPercent },
    { key: 'heart', label: 'Heart', Icon: LHeart },
    { key: 'clock', label: 'Clock', Icon: LClock },
    { key: 'palette', label: 'Palette', Icon: LPalette },
    { key: 'award', label: 'Award', Icon: LAward },
    { key: 'briefcase', label: 'Briefcase', Icon: LBriefcase },
    { key: 'car', label: 'Car', Icon: LCar },
    { key: 'file-text', label: 'File Text', Icon: LFileText },
    { key: 'settings', label: 'Settings', Icon: LSettings },
    { key: 'phone', label: 'Phone', Icon: LPhone },
    { key: 'mail', label: 'Mail', Icon: LMail },
    { key: 'calendar', label: 'Calendar', Icon: LCalendar },
    { key: 'bell', label: 'Bell', Icon: LBell },
    { key: 'user', label: 'User', Icon: LUser },
    { key: 'home', label: 'Home', Icon: LHome },
    { key: 'shopping-cart', label: 'Shopping Cart', Icon: LShoppingCart },
    { key: 'shopping-bag', label: 'Shopping Bag', Icon: LShoppingBag },
    { key: 'trending-up', label: 'Trending Up', Icon: LTrendingUp },
    { key: 'flame', label: 'Flame', Icon: LFlame },
    { key: 'credit-card', label: 'Credit Card', Icon: LCreditCard },
    { key: 'lock', label: 'Lock', Icon: LLock },
    { key: 'message-square', label: 'Message', Icon: LMessageSquare },
    { key: 'more-vertical', label: 'More Vertical', Icon: LMoreVertical },
    { key: 'more-horizontal', label: 'More Horizontal', Icon: LMoreHorizontal },
    { key: 'refresh-cw', label: 'Refresh', Icon: LRefreshCw },
    { key: 'help-circle', label: 'Help', Icon: LHelpCircle },
    { key: 'alert-triangle', label: 'Alert', Icon: LAlertTriangle },
    { key: 'sliders-horizontal', label: 'Sliders', Icon: LSlidersHorizontal },
    { key: 'headphones', label: 'Headphones', Icon: LHeadphones },
  ]

  const updateSection = (idx: number, next: Section) => {
    const copy = extras.sections.slice()
    copy[idx] = next
    updateExtras({ ...extras, sections: copy })
  }

  const removeSection = (idx: number) => {
    const copy = extras.sections.slice()
    copy.splice(idx, 1)
    updateExtras({ ...extras, sections: copy })
  }

  const move = (idx: number, dir: -1|1) => {
    const copy = extras.sections.slice()
    const j = idx + dir
    if (j < 0 || j >= copy.length) return
    const tmp = copy[idx]
    copy[idx] = copy[j]
    copy[j] = tmp
    updateExtras({ ...extras, sections: copy })
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-orange-50 hover:border-orange-300 transition-colors text-xs"
            onClick={addSpecSection}
          >
            Add Spec
          </button>
        </div>
      </div>

      {extras.sections.length === 0 ? (
        <div className="p-3 text-xs text-gray-600 bg-gray-50 rounded-md">No specs yet. Click "Add Spec" to create one.</div>
      ) : (
        <div className="space-y-2">
          {extras.sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="rounded-md border border-gray-200 bg-gray-50/70 p-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="px-2 py-1 border border-gray-300 rounded-md w-64 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Title"
                  value={sec.title}
                  onChange={(e) => updateSection(idx, { ...sec, title: e.target.value })}
                />
                {/* type fixed to key-value (Spec) */}
                <span className="text-[11px] text-gray-600 px-2 py-0.5 border border-gray-300 rounded bg-white">Spec</span>
                <div className="ml-auto flex gap-1">
                  <button type="button" className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100" onClick={() => move(idx, -1)}>↑</button>
                  <button type="button" className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-100" onClick={() => move(idx, 1)}>↓</button>
                  <button type="button" className="px-2 py-1 border border-red-200 rounded-md bg-white text-red-600 hover:bg-red-50" onClick={() => removeSection(idx)}>Remove</button>
                </div>
              </div>

              {/* Icon controls */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 relative">
                  <label className="text-[11px] text-gray-600">Icon</label>
                  <button
                    type="button"
                    className="px-2 py-1 border border-gray-300 rounded-md bg-white flex items-center gap-2 hover:bg-gray-100 transition-colors text-[11px]"
                    onClick={() => setOpenPicker(openPicker === idx ? null : idx)}
                  >
                    {(() => {
                      const key = sec.iconKey || ''
                      const opt = ICON_OPTIONS.find(o => o.key === key)
                      const Preview = opt?.Icon
                      return (
                        <>
                          {Preview ? <Preview className="w-4 h-4" /> : <span className="text-[11px] text-gray-400">—</span>}
                          <span className="text-[11px]">{opt?.label || 'None'}</span>
                        </>
                      )
                    })()}
                  </button>
                  {openPicker === idx && (
                    <div className="absolute z-10 top-[120%] left-0 w-[320px] max-h-64 overflow-auto bg-white border border-gray-200 rounded-md shadow-md p-2 grid grid-cols-3 gap-1">
                      {ICON_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`flex items-center gap-2 px-2 py-1 rounded-md hover:bg-orange-50 text-left transition-colors ${sec.iconKey===opt.key ? 'bg-orange-50' : ''}`}
                          onClick={() => { updateSection(idx, { ...sec, iconKey: opt.key }); setOpenPicker(null) }}
                        >
                          <opt.Icon className="w-4 h-4" />
                          <span className="text-[11px]">{opt.label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 text-left ${!sec.iconKey ? 'bg-gray-100' : ''}`}
                        onClick={() => { updateSection(idx, { ...sec, iconKey: '' }); setOpenPicker(null) }}
                      >
                        <span className="w-4 h-4 inline-block" />
                        <span className="text-[11px]">None</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-600">Icon color</label>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded-md bg-white text-[11px] hover:bg-gray-50"
                    value={sec.iconColor || 'primary'}
                    onChange={(e) => updateSection(idx, { ...sec, iconColor: e.target.value })}
                  >
                    <option value="primary">Primary</option>
                    <option value="text">Text</option>
                    <option value="muted">Muted</option>
                    <option value="accent">Accent</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="space-y-1">
                  {(sec.items as Array<{label:string,value?:string}>).map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" className="px-2 py-1 border border-gray-300 rounded-md w-64 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Label" value={row.label} onChange={(e) => {
                        const items = (sec.items as any[]).slice()
                        items[i] = { ...row, label: e.target.value }
                        updateSection(idx, { ...sec, items })
                      }} />
                      <input type="text" className="px-2 py-1 border border-gray-300 rounded-md w-40 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Value" value={row.value || ''} onChange={(e) => {
                        const items = (sec.items as any[]).slice()
                        items[i] = { ...row, value: e.target.value }
                        updateSection(idx, { ...sec, items })
                      }} />
                      <button type="button" className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-red-50 hover:border-red-300 text-red-600" onClick={() => {
                        const items = (sec.items as any[]).slice()
                        items.splice(i, 1)
                        updateSection(idx, { ...sec, items })
                      }}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="px-2 py-1 border border-gray-300 rounded-md bg-white hover:bg-orange-50 hover:border-orange-300" onClick={() => updateSection(idx, { ...sec, items: [...(sec.items as any[]), { label: '', value: '' }] })}>Add row</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
