# Common Components & Hooks - Usage Examples

This guide demonstrates how to use the new reusable components and hooks created in Priority 2.

## Table of Contents
1. [ModalLayout](#modallayout)
2. [FormField Components](#formfield-components)
3. [ToggleSwitch](#toggleswitch)
4. [useStaffPermissions Hook](#usestaffpermissions-hook)
5. [useFormValidation Hook](#useformvalidation-hook)

---

## ModalLayout

A reusable modal wrapper with consistent header, content, and footer layout.

### Basic Usage

```tsx
import { ModalLayout } from '@/components/merchant/common';
import { Package } from 'lucide-react';

function ExampleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Create Product"
      subtitle="Add a new product to your catalog"
      icon={Package}
      iconClassName="p-2 bg-blue-100 rounded-lg"
      maxWidth="2xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
            Save
          </button>
        </>
      }
    >
      {/* Your modal content here */}
      <p>Modal content goes here</p>
    </ModalLayout>
  );
}
```

### With Error/Success Messages

```tsx
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

<ModalLayout
  isOpen={isOpen}
  onClose={onClose}
  title="Update Settings"
  error={error}
  successMessage={successMessage}
>
  {/* Content */}
</ModalLayout>
```

---

## FormField Components

Consistent form inputs with built-in validation display and compact styling.

### InputField

```tsx
import { InputField } from '@/components/merchant/common';

function MyForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form>
      <InputField
        label="Product Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter product name"
        helpText="This will be visible to customers"
      />

      <InputField
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <InputField
        label="Password"
        type="password"
        required
        showPasswordToggle
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </form>
  );
}
```

### TextAreaField

```tsx
import { TextAreaField } from '@/components/merchant/common';

<TextAreaField
  label="Description"
  required
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Enter product description"
  helpText="Provide detailed information about the product"
/>
```

### SelectField

```tsx
import { SelectField } from '@/components/merchant/common';

// Option 1: Using options prop
<SelectField
  label="Category"
  required
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  options={[
    { value: '1', label: 'Electronics' },
    { value: '2', label: 'Clothing' },
    { value: '3', label: 'Books' },
  ]}
/>

// Option 2: Using children
<SelectField
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <option value="active">Active</option>
  <option value="draft">Draft</option>
  <option value="archived">Archived</option>
</SelectField>
```

---

## ToggleSwitch

A customizable toggle switch with label and description support.

### Basic Usage

```tsx
import { ToggleSwitch } from '@/components/merchant/common';

function SettingsForm() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <>
      <ToggleSwitch
        label="Enable Feature"
        description="Turn on to activate this feature"
        checked={isEnabled}
        onChange={setIsEnabled}
      />

      <ToggleSwitch
        label="Push Notifications"
        description="Receive notifications about new orders"
        checked={notifications}
        onChange={setNotifications}
        size="lg"
      />
    </>
  );
}
```

### Different Sizes

```tsx
<ToggleSwitch
  label="Small Toggle"
  checked={value}
  onChange={setValue}
  size="sm"
/>

<ToggleSwitch
  label="Medium Toggle (default)"
  checked={value}
  onChange={setValue}
  size="md"
/>

<ToggleSwitch
  label="Large Toggle"
  checked={value}
  onChange={setValue}
  size="lg"
/>
```

---

## useStaffPermissions Hook

Check staff member permissions for RBAC (Role-Based Access Control).

### Basic Usage

```tsx
import { useStaffPermissions } from '@/hooks';

function ProductActions() {
  const { hasPermission, isAdmin, canManageProducts } = useStaffPermissions();

  // Check specific permission
  const canEditPricing = hasPermission('products', 'edit', 'pricing');
  const canDeleteProduct = hasPermission('products', 'delete', 'info');

  return (
    <div>
      {canManageProducts && (
        <button>Edit Product</button>
      )}

      {canEditPricing && (
        <button>Update Pricing</button>
      )}

      {isAdmin && (
        <button>Delete Product</button>
      )}
    </div>
  );
}
```

### Multiple Permission Checks

```tsx
function OrderManagement() {
  const { hasAnyPermission, hasAllPermissions } = useStaffPermissions();

  // User can do any of these actions
  const canManageOrder = hasAnyPermission([
    { module: 'orders', action: 'edit', feature: 'status' },
    { module: 'orders', action: 'edit', feature: 'fulfillment' },
  ]);

  // User must have all these permissions
  const canProcessRefund = hasAllPermissions([
    { module: 'orders', action: 'execute', feature: 'refunds' },
    { module: 'orders', action: 'view', feature: 'details' },
  ]);

  return (
    <>
      {canManageOrder && <button>Update Order</button>}
      {canProcessRefund && <button>Process Refund</button>}
    </>
  );
}
```

### Role-Based UI

```tsx
function Dashboard() {
  const { isAdmin, isManager, isStaff, role } = useStaffPermissions();

  return (
    <div>
      <h2>Welcome {role}</h2>

      {isAdmin && <AdminPanel />}
      {isManager && <ManagerPanel />}
      {(isStaff || isManager) && <StaffPanel />}
    </div>
  );
}
```

---

## useFormValidation Hook

Powerful form validation with built-in validation rules.

### Basic Form Validation

```tsx
import { useFormValidation, ValidationSchema } from '@/hooks';

interface ProductForm {
  name: string;
  price: number;
  email: string;
  website: string;
  description: string;
}

function ProductForm() {
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    price: 0,
    email: '',
    website: '',
    description: '',
  });

  const schema: ValidationSchema<ProductForm> = {
    name: {
      required: 'Product name is required',
      minLength: { value: 3, message: 'Name must be at least 3 characters' },
      maxLength: { value: 100, message: 'Name must not exceed 100 characters' },
    },
    price: {
      required: true,
      min: { value: 0.01, message: 'Price must be greater than 0' },
    },
    email: {
      required: true,
      email: 'Invalid email address',
    },
    website: {
      url: 'Invalid website URL',
    },
    description: {
      maxLength: 500,
    },
  };

  const { errors, validate, validateField, clearFieldError } = useFormValidation(schema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate(formData)) {
      console.log('Form is valid!', formData);
      // Submit form
    } else {
      console.log('Validation errors:', errors);
    }
  };

  const handleFieldChange = (field: keyof ProductForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field); // Clear error when user starts typing
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Product Name"
        required
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        error={errors.name}
      />

      <InputField
        label="Price"
        type="number"
        required
        value={formData.price}
        onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
        error={errors.price}
      />

      <InputField
        label="Email"
        type="email"
        required
        value={formData.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        error={errors.email}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Validation

```tsx
const schema: ValidationSchema<ProductForm> = {
  sku: {
    required: true,
    pattern: {
      value: /^[A-Z]{3}-\d{4}$/,
      message: 'SKU must be in format: ABC-1234',
    },
    custom: (value) => {
      if (value.includes('TEST')) {
        return 'SKU cannot contain TEST';
      }
      return true;
    },
  },
};
```

### Real-time Field Validation

```tsx
function ProductNameField() {
  const { validateField } = useFormValidation(schema);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleBlur = () => {
    const validationError = validateField('name', name);
    setError(validationError || '');
  };

  return (
    <InputField
      label="Product Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={handleBlur}
      error={error}
    />
  );
}
```

---

## Complete Example: Refactored Modal

Here's how to refactor an existing modal using all the new components:

### Before (Old Pattern)

```tsx
function OldModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="relative top-20 mx-auto p-0 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <h3>Add Category</h3>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-4">
          {error && <div className="bg-red-50 p-2">{error}</div>}

          <div>
            <label className="block text-xs mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose}>Cancel</button>
          <button>Save</button>
        </div>
      </div>
    </div>
  );
}
```

### After (New Pattern)

```tsx
import { ModalLayout, InputField } from '@/components/merchant/common';
import { useFormValidation } from '@/hooks';
import { Folder } from 'lucide-react';

function NewModal({ isOpen, onClose }) {
  const [name, setName] = useState('');

  const schema = {
    name: { required: 'Category name is required', minLength: 3 },
  };

  const { errors, validate } = useFormValidation(schema);

  const handleSubmit = () => {
    if (validate({ name })) {
      // Submit logic
    }
  };

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Add Category"
      subtitle="Create a new product category"
      icon={Folder}
      error={errors.name}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
            Save
          </button>
        </>
      }
    >
      <InputField
        label="Category Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter category name"
        error={errors.name}
      />
    </ModalLayout>
  );
}
```

---

## Benefits

1. **Consistency**: All modals and forms have the same look and feel
2. **DRY Principle**: Eliminate 150+ lines of duplicate code
3. **Type Safety**: Full TypeScript support with proper types
4. **Accessibility**: Built-in ARIA attributes and keyboard support
5. **Maintainability**: Update styling in one place, affects all components
6. **Developer Experience**: Simpler API, less code to write

---

## Migration Checklist

When refactoring existing modals to use these components:

- [ ] Replace modal wrapper with `<ModalLayout>`
- [ ] Replace input fields with `<InputField>` / `<TextAreaField>` / `<SelectField>`
- [ ] Replace toggle switches with `<ToggleSwitch>`
- [ ] Add `useFormValidation` for form validation
- [ ] Add `useStaffPermissions` for permission checks
- [ ] Remove duplicate styling classes
- [ ] Test functionality remains unchanged
- [ ] Verify compact styling is consistent
