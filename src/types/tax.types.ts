export interface TaxCategory {
  id: number;
  appId: number;
  name: string;
  description: string;
  isDefault: boolean;
  applyToAllProducts?: boolean;
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
  countries?: string[];
  states?: string[];
  taxType: "percentage" | "fixed" | "compound";
  rate: number;
  priority: number;
  addressType: "shipping" | "billing" | "either";
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCategoryFormData {
  name: string;
  description: string;
  isDefault?: boolean;
  displayOrder?: number;
  productIds?: number[];
  applyToAllProducts?: boolean;
}

export interface TaxRuleFormData {
  name: string;
  description?: string;
  taxCategoryId?: number | null;
  countries?: string[];
  states?: string[];
  taxType?: "percentage" | "fixed" | "compound";
  rate: number;
  priority?: number;
  addressType?: "shipping" | "billing" | "either";
  isEnabled?: boolean;
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
    rate: number;
    taxType: "percentage" | "fixed" | "compound";
  }>;
  breakdown: {
    subtotal: number;
    taxableAmount: number;
    totalTax: number;
  };
}

export interface ProductForTaxCategory {
  id: number;
  name: string;
  sku?: string;
  thumbnailUrl?: string;
  taxCategoryId?: number;
  isAssignedToCategory: boolean;
  taxCategoryName?: string | null;
  variants?: Array<{
    id: number;
    sku?: string;
    option1Name?: string;
    option1Value?: string;
    option2Name?: string;
    option2Value?: string;
    option3Name?: string;
    option3Value?: string;
  }>;
}
