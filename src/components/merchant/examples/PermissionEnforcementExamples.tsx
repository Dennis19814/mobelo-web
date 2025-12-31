/**
 * Permission Enforcement Examples
 *
 * This file demonstrates how to use the StaffUserContext and useStaffPermissions hook
 * to implement permission-based UI rendering in your components.
 *
 * DO NOT import this file in production - it's for reference only.
 */

import { useStaffPermissions, useStaffUser } from '@/contexts/StaffUserContext';
import { Edit2, Trash2, DollarSign, Eye, EyeOff } from 'lucide-react';

/**
 * Example 1: Hide entire button if no permission
 */
export function ProductEditButton() {
  const { canEditProducts } = useStaffPermissions();

  // Simply don't render the button if user lacks permission
  if (!canEditProducts) return null;

  return (
    <button className="btn-primary">
      <Edit2 className="w-4 h-4 mr-2" />
      Edit Product
    </button>
  );
}

/**
 * Example 2: Disable button but show it (with tooltip)
 */
export function ProductDeleteButton() {
  const { canDeleteProducts } = useStaffPermissions();

  return (
    <button
      disabled={!canDeleteProducts}
      title={!canDeleteProducts ? 'You do not have permission to delete products' : 'Delete product'}
      className={`btn ${canDeleteProducts ? 'btn-danger' : 'btn-disabled'}`}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Delete
    </button>
  );
}

/**
 * Example 3: Show/hide sensitive data based on feature permissions
 */
export function ProductPricingSection({ product }: { product: any }) {
  const { canViewPricing, canEditPricing } = useStaffPermissions();

  // Hide entire pricing section if no view permission
  if (!canViewPricing) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-500">
          <EyeOff className="w-5 h-5 mr-2" />
          <span>Pricing information is restricted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing
        </h3>
        {canEditPricing && (
          <button className="btn-secondary">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Pricing
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-gray-600">Base Price: </span>
          <span className="font-semibold">${product.basePrice}</span>
        </div>
        <div>
          <span className="text-gray-600">Compare At: </span>
          <span className="font-semibold">${product.compareAtPrice}</span>
        </div>
        {/* Only show cost if can edit (more sensitive) */}
        {canEditPricing && (
          <div>
            <span className="text-gray-600">Cost: </span>
            <span className="font-semibold">${product.cost}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 4: Different views for different roles
 */
export function OrderDetailsView({ order }: { order: any }) {
  const { canViewOrderDetails, canViewCustomerPayments, canRefundOrders } = useStaffPermissions();

  if (!canViewOrderDetails) {
    return <div>You do not have permission to view order details</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic order info - everyone with view permission can see */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Order Information</h3>
        <div>Order #{order.orderNumber}</div>
        <div>Total: ${order.total}</div>
      </div>

      {/* Payment info - restricted */}
      {canViewCustomerPayments && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Payment Information</h3>
          <div>Method: {order.paymentMethod}</div>
          <div>Card: **** **** **** {order.lastFourDigits}</div>
        </div>
      )}

      {/* Refund action - restricted */}
      {canRefundOrders && (
        <div className="bg-white rounded-lg border p-6">
          <button className="btn-danger">Issue Refund</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Custom permission check for complex logic
 */
export function CustomerContactSection({ customer }: { customer: any }) {
  const { hasPermission } = useStaffUser();

  // Check specific feature permission
  const canViewContact = hasPermission('customers', 'view', 'contact');
  const canEditContact = hasPermission('customers', 'edit', 'contact');

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Contact Information</h3>

      {canViewContact ? (
        <div className="space-y-2">
          <div>Email: {customer.email}</div>
          <div>Phone: {customer.phone}</div>

          {canEditContact && (
            <button className="btn-secondary mt-4">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Contact Info
            </button>
          )}
        </div>
      ) : (
        <div className="text-gray-500 flex items-center">
          <EyeOff className="w-5 h-5 mr-2" />
          Contact information is restricted
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Role-based navigation/tabs
 */
export function SettingsTabs() {
  const { isAdmin, canEditPaymentSettings, canEditEmailSettings, canViewStaff } = useStaffPermissions();

  const tabs = [
    { id: 'general', label: 'General', visible: true },
    { id: 'payments', label: 'Payments', visible: canEditPaymentSettings },
    { id: 'email', label: 'Email', visible: canEditEmailSettings },
    { id: 'team', label: 'Team', visible: canViewStaff },
    { id: 'advanced', label: 'Advanced', visible: isAdmin },
  ];

  return (
    <div className="flex space-x-2 border-b">
      {tabs.filter(tab => tab.visible).map(tab => (
        <button
          key={tab.id}
          className="px-4 py-2 border-b-2 border-transparent hover:border-blue-500"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Example 7: Action menu with conditional items
 */
export function ProductActionMenu({ product }: { product: any }) {
  const {
    canEditProducts,
    canDeleteProducts,
    canEditInventory,
    canEditPricing
  } = useStaffPermissions();

  // Build menu items based on permissions
  const menuItems = [
    canEditProducts && { label: 'Edit Details', action: () => {} },
    canEditPricing && { label: 'Edit Pricing', action: () => {} },
    canEditInventory && { label: 'Adjust Inventory', action: () => {} },
    canDeleteProducts && { label: 'Delete Product', action: () => {}, danger: true },
  ].filter(Boolean); // Remove falsy items

  if (menuItems.length === 0) {
    return null; // No actions available
  }

  return (
    <div className="dropdown">
      <button className="btn-secondary">Actions</button>
      <ul className="dropdown-menu">
        {menuItems.map((item: any, index) => (
          <li key={index}>
            <button
              onClick={item.action}
              className={item.danger ? 'text-red-600' : ''}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 8: Form fields based on permissions
 */
export function ProductForm({ product, mode }: { product?: any; mode: 'create' | 'edit' }) {
  const {
    canEditProducts,
    canEditPricing,
    canEditInventory,
    canEditProducts: canCreate,
  } = useStaffPermissions();

  const canEdit = mode === 'create' ? canCreate : canEditProducts;

  if (!canEdit) {
    return <div>You do not have permission to {mode} products</div>;
  }

  return (
    <form className="space-y-4">
      {/* Basic info - always editable if has edit permission */}
      <input
        type="text"
        placeholder="Product Name"
        defaultValue={product?.name}
        className="input"
      />

      {/* Pricing section - conditional */}
      {canEditPricing ? (
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-2">Pricing</h4>
          <input
            type="number"
            placeholder="Price"
            defaultValue={product?.price}
            className="input"
          />
        </div>
      ) : (
        <div className="border rounded p-4 bg-gray-50">
          <p className="text-gray-500">
            <EyeOff className="inline w-4 h-4 mr-1" />
            You cannot edit pricing
          </p>
          {product && <p className="mt-2">Current price: ${product.price}</p>}
        </div>
      )}

      {/* Inventory section - conditional */}
      {canEditInventory ? (
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-2">Inventory</h4>
          <input
            type="number"
            placeholder="Stock Quantity"
            defaultValue={product?.quantity}
            className="input"
          />
        </div>
      ) : (
        <div className="border rounded p-4 bg-gray-50">
          <p className="text-gray-500">
            <EyeOff className="inline w-4 h-4 mr-1" />
            You cannot edit inventory
          </p>
          {product && <p className="mt-2">Current stock: {product.quantity}</p>}
        </div>
      )}

      <button type="submit" className="btn-primary">
        {mode === 'create' ? 'Create' : 'Save'} Product
      </button>
    </form>
  );
}

/**
 * Example 9: Protecting entire page/section
 */
export function StaffManagementPage() {
  const { canViewStaff } = useStaffPermissions();

  if (!canViewStaff) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You do not have permission to view the staff management section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Staff management UI */}
    </div>
  );
}

/**
 * Example 10: Display current user role badge
 */
export function StaffRoleBadge() {
  const { role, isAdmin } = useStaffPermissions();
  const { staffUser } = useStaffUser();

  if (!staffUser) return null;

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    staff: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {staffUser.firstName} {staffUser.lastName}
      </span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors]}`}>
        {role.toUpperCase()}
      </span>
      {isAdmin && (
        <span className="text-xs text-purple-600 font-semibold">
          (Full Access)
        </span>
      )}
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST:
 *
 * 1. Wrap your app with StaffUserProvider (in layout or _app)
 * 2. Use useStaffPermissions() hook in components
 * 3. Conditionally render UI elements based on permissions
 * 4. Show appropriate messages when access is denied
 * 5. Test with different roles (admin, manager, staff, viewer)
 * 6. Ensure API calls also fail for unauthorized actions (backend protection)
 *
 * BEST PRACTICES:
 *
 * - Hide UI elements users can't use (better UX than disabled buttons)
 * - Show clear messages when access is denied
 * - Group related permissions (e.g., all pricing features together)
 * - Use consistent styling for restricted content
 * - Remember: UI permissions are UX only - backend must enforce security!
 */
