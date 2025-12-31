/**
 * Legal Document Types
 * Used for Terms & Conditions and Privacy Policy management
 */

export type LegalDocumentType = 'terms_and_conditions' | 'privacy_policy';

export interface LegalDocument {
  id: number;
  appId: number;
  documentType: LegalDocumentType;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLegalDocumentDto {
  documentType: LegalDocumentType;
  content: string;
}

export interface UpdateLegalDocumentDto {
  content: string;
}
