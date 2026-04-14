export interface CommerceAttributeOptionDto {
  value: string;
  label: string;
}

export interface CommerceBrandDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  status: "active" | "archived";
  createdAt?: string;
}

export interface CommerceVendorDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "active" | "archived";
  createdAt?: string;
}

export interface CommerceCollectionDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "archived";
  sortOrder: number;
  createdAt?: string;
}

export interface CommerceTaxRuleDto {
  label: string;
  rateBasisPoints: number;
}

export interface CommerceTaxProfileDto {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  pricesIncludeTax: boolean;
  rules: CommerceTaxRuleDto[];
  status: "active" | "archived";
  createdAt?: string;
}

export interface CommercePriceListItemDto {
  id: string;
  priceListId: string;
  variantId: string;
  priceMinor: number;
}

export interface CommercePriceListDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  currency: string;
  customerSegment?: string;
  description?: string;
  status: "active" | "archived";
  items: CommercePriceListItemDto[];
  createdAt?: string;
}

export interface CommerceAttributeDto {
  id: string;
  tenantId: string;
  code: string;
  slug: string;
  label: string;
  description?: string;
  valueType:
    | "text"
    | "long_text"
    | "number"
    | "boolean"
    | "single_select"
    | "multi_select"
    | "color"
    | "date";
  scope: "product" | "variant" | "both";
  options: CommerceAttributeOptionDto[];
  unitLabel?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariationAxis: boolean;
  verticalBindings: string[];
  status: "active" | "archived";
  createdAt?: string;
}

export interface CommerceAttributeSetDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  attributeIds: string[];
  verticalBindings: string[];
  status: "active" | "archived";
  createdAt?: string;
}

export interface CommerceAttributeValueDto {
  attributeId: string;
  value: unknown | null;
}

export interface CommerceCategoryDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  description?: string;
  createdAt?: string;
}

export interface CommerceVariantDto {
  id: string;
  productId?: string;
  sku: string;
  label: string;
  priceMinor: number;
  currency: string;
  inventoryQuantity: number;
  attributeValues?: CommerceAttributeValueDto[];
  createdAt?: string;
}

export interface CommerceProductDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  status?: "draft" | "active" | "archived";
  brandId?: string;
  vendorId?: string;
  collectionIds?: string[];
  attributeSetId?: string;
  categoryIds: string[];
  productAttributes?: CommerceAttributeValueDto[];
  variants: CommerceVariantDto[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
}

export interface CommerceWarehouseDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  code: string;
  city?: string;
  country?: string;
  status: "active" | "inactive";
  isDefault: boolean;
  createdAt?: string;
}

export interface CommerceWarehouseStockDto {
  id: string;
  tenantId: string;
  warehouseId: string;
  variantId: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isBelowThreshold: boolean;
  createdAt?: string;
}

export interface CommerceStockLedgerEntryDto {
  id: string;
  tenantId: string;
  warehouseId: string;
  variantId: string;
  entryType: "adjustment" | "reservation" | "release" | "fulfillment" | "restock";
  quantityDelta: number;
  balanceAfter: number;
  reservedAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  recordedByUserId: string;
  createdAt?: string;
}

export interface CommerceOrderLineDto {
  id: string;
  productId: string;
  variantId: string;
  allocatedWarehouseId?: string;
  quantity: number;
  fulfilledQuantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface CommerceFulfillmentLineDto {
  id: string;
  fulfillmentId: string;
  orderLineId: string;
  variantId: string;
  quantity: number;
  createdAt?: string;
}

export interface CommerceFulfillmentDto {
  id: string;
  tenantId: string;
  orderId: string;
  warehouseId?: string;
  fulfillmentNumber: string;
  status: "pending_pick" | "packed" | "shipped" | "delivered" | "cancelled";
  createdByUserId: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  lines: CommerceFulfillmentLineDto[];
  createdAt?: string;
}

export interface CommerceShipmentDto {
  id: string;
  tenantId: string;
  fulfillmentId: string;
  carrier: string;
  serviceLevel?: string;
  trackingNumber: string;
  status: "shipped" | "delivered" | "cancelled";
  shippedAt?: string;
  deliveredAt?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface CommercePaymentDto {
  id: string;
  tenantId: string;
  orderId: string;
  amountMinor: number;
  currency: string;
  provider?: string;
  paymentMethod: "cash" | "card" | "upi" | "bank_transfer" | "wallet" | "other";
  status: "authorized" | "captured" | "failed" | "refunded";
  reference?: string;
  notes?: string;
  receivedAt: string;
  recordedByUserId: string;
  createdAt?: string;
}

export interface CommerceRefundDto {
  id: string;
  tenantId: string;
  orderId: string;
  paymentId: string;
  amountMinor: number;
  currency: string;
  reason: string;
  reference?: string;
  status: "processed";
  refundedAt: string;
  recordedByUserId: string;
  createdAt?: string;
}

export interface CommerceReturnLineDto {
  id: string;
  returnId: string;
  orderLineId: string;
  variantId: string;
  quantity: number;
  resolutionType: "refund" | "exchange";
  replacementVariantId?: string;
  restockOnReceive: boolean;
  lineAmountMinor: number;
  notes?: string;
  createdAt?: string;
}

export interface CommerceReturnDto {
  id: string;
  tenantId: string;
  orderId: string;
  returnNumber: string;
  status: "requested" | "approved" | "rejected" | "received" | "completed" | "cancelled";
  reasonSummary?: string;
  notes?: string;
  inventoryRestocked: boolean;
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  closedAt?: string;
  createdByUserId: string;
  closedByUserId?: string;
  lines: CommerceReturnLineDto[];
  createdAt?: string;
}

export interface CommerceSettlementEntryDto {
  id: string;
  settlementId: string;
  entryType: "payment" | "refund" | "fee" | "adjustment";
  paymentId?: string;
  refundId?: string;
  amountMinor: number;
  label?: string;
  notes?: string;
  payment?: CommercePaymentDto | null;
  refund?: CommerceRefundDto | null;
  createdAt?: string;
}

export interface CommerceSettlementDto {
  id: string;
  tenantId: string;
  settlementNumber: string;
  provider: string;
  settlementReference?: string;
  currency: string;
  status: "draft" | "reported" | "reconciled" | "closed" | "disputed";
  paymentsMinor: number;
  refundsMinor: number;
  feesMinor: number;
  adjustmentsMinor: number;
  netMinor: number;
  reportedAt: string;
  reconciledAt?: string;
  closedAt?: string;
  notes?: string;
  createdByUserId: string;
  closedByUserId?: string;
  entries: CommerceSettlementEntryDto[];
  createdAt?: string;
}

export interface CommerceInvoiceDto {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  status: "issued";
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  issuedAt: string;
  issuedByUserId: string;
  createdAt?: string;
}

export interface CommerceOrderDto {
  id: string;
  tenantId: string;
  customerId: string;
  priceListId?: string;
  taxProfileId?: string;
  couponCode?: string;
  status: "draft" | "placed" | "paid" | "fulfilled" | "cancelled";
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paymentStatus:
    | "pending"
    | "authorized"
    | "partially_paid"
    | "paid"
    | "partially_refunded"
    | "refunded"
    | "failed";
  paidMinor: number;
  refundedMinor: number;
  balanceMinor: number;
  invoiceNumber?: string;
  invoiceIssuedAt?: string;
  lines?: CommerceOrderLineDto[];
  payments?: CommercePaymentDto[] | null;
  refunds?: CommerceRefundDto[] | null;
  invoices?: CommerceInvoiceDto[] | null;
  returns?: CommerceReturnDto[] | null;
  inventoryReserved?: boolean;
  placedAt?: string;
  createdAt?: string;
}

export interface CouponDto {
  id: string;
  tenantId: string;
  code: string;
  description?: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minimumSubtotalMinor: number;
  maximumDiscountMinor?: number;
  applicableCategoryIds: string[];
  applicableVariantIds: string[];
  status: "active" | "archived";
  createdAt?: string;
}
