export interface TaxCategory {
  id: number;
  appId: number;
  name: string;
  description: string;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRule {
  id: number;
  appId: number;
  name: string;
  description: string;
  taxCategoryId: number | null;
  taxCategory?: TaxCategory;
  productId: number | null;
  country: string | null;
  state: string | null;
  taxType: "percentage" | "fixed";
  taxRate: number;
  isCompound: boolean;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCategoryFormData {
  name: string;
  description: string;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface TaxRuleFormData {
  name: string;
  description: string;
  taxCategoryId?: number | null;
  productId?: number | null;
  country?: string | null;
  state?: string | null;
  taxType: "percentage" | "fixed";
  taxRate: number;
  isCompound?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface CountryOption {
  code: string;
  name: string;
}

export interface StateOption {
  code: string;
  name: string;
}

export interface TaxCategoryOption {
  id: number;
  name: string;
  description: string;
}

export interface TaxOptionsMetadata {
  categories: TaxCategoryOption[];
  countries: CountryOption[];
  states: {
    US: StateOption[];
    CA: StateOption[];
    [key: string]: StateOption[];
  };
}

export interface TaxCalculationItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface TaxCalculationResult {
  totalTax: number;
  appliedRules: Array<{
    ruleId: number;
    ruleName: string;
    taxAmount: number;
    taxRate: number;
    taxType: string;
    isCompound: boolean;
  }>;
  breakdown: {
    subtotal: number;
    taxableAmount: number;
    totalTax: number;
  };
}
