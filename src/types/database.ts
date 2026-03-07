export type UserRole = 'administrador' | 'gerente' | 'caixa' | 'estoquista'
export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'
export type SaleStatus = 'aberta' | 'finalizada' | 'cancelada'
export type AccountStatus = 'pendente' | 'pago' | 'vencido'
export type MovementType = 'entrada' | 'saida' | 'ajuste_positivo' | 'ajuste_negativo' | 'inventario'
export type CashRegisterStatus = 'aberto' | 'fechado'
export type UnitType = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'cx' | 'pct' | 'dz'

export interface Profile {
  id: string
  name: string
  role: UserRole
  active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Brand {
  id: string
  name: string
  created_at: string
}

export interface Supplier {
  id: string
  trade_name: string
  company_name: string | null
  document: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  contact_name: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  document: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  birth_date: string | null
  credit_limit: number
  current_debt: number
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category_id: string | null
  brand_id: string | null
  unit: UnitType
  cost_price: number
  sale_price: number
  stock_qty: number
  min_stock: number
  expiry_date: string | null
  description: string | null
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  // Joins
  category_name?: string
  brand_name?: string
  margin_percent?: number
  margin_value?: number
  low_stock?: boolean
}

export interface CashRegister {
  id: string
  user_id: string
  status: CashRegisterStatus
  initial_balance: number
  final_balance: number | null
  cash_sales: number
  pix_sales: number
  debit_sales: number
  credit_sales: number
  total_sales: number
  total_sangria: number
  total_suprimento: number
  difference: number | null
  notes: string | null
  opened_at: string
  closed_at: string | null
  // Joins
  user?: Profile
}

export interface Sale {
  id: string
  sale_number: number
  user_id: string
  customer_id: string | null
  cash_register_id: string | null
  status: SaleStatus
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  surcharge: number
  total: number
  amount_paid: number
  change_amount: number
  cancel_reason: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  created_at: string
  // Joins
  user?: Profile
  customer?: Customer
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  cost_price: number
  discount: number
  subtotal: number
  created_at: string
  product?: Product
}

export interface StockMovement {
  id: string
  product_id: string
  user_id: string
  type: MovementType
  quantity: number
  quantity_before: number
  quantity_after: number
  unit_cost: number | null
  total_cost: number | null
  sale_id: string | null
  supplier_id: string | null
  reason: string | null
  notes: string | null
  created_at: string
  // Joins
  product?: Product
  user?: Profile
  supplier?: Supplier
}

export interface AccountPayable {
  id: string
  description: string
  category: string
  supplier_id: string | null
  amount: number
  due_date: string
  paid_date: string | null
  paid_amount: number | null
  status: AccountStatus
  installment_current: number | null
  installment_total: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
}

export interface AccountReceivable {
  id: string
  description: string
  customer_id: string | null
  sale_id: string | null
  amount: number
  paid_amount: number
  due_date: string
  received_date: string | null
  status: AccountStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface StoreSettings {
  id: string
  name: string
  document: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  logo_url: string | null
  receipt_footer: string | null
  max_discount_cashier: number
  updated_at: string
}

export interface CashMovement {
  id: string
  cash_register_id: string
  user_id: string
  type: 'sangria' | 'suprimento'
  amount: number
  reason: string
  created_at: string
  user?: Profile
}

// Tipo para o Database do Supabase (usado no createBrowserClient/createServerClient)
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      brands: { Row: Brand; Insert: Partial<Brand>; Update: Partial<Brand> }
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> }
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      cash_registers: { Row: CashRegister; Insert: Partial<CashRegister>; Update: Partial<CashRegister> }
      cash_movements: { Row: CashMovement; Insert: Partial<CashMovement>; Update: Partial<CashMovement> }
      sales: { Row: Sale; Insert: Partial<Sale>; Update: Partial<Sale> }
      sale_items: { Row: SaleItem; Insert: Partial<SaleItem>; Update: Partial<SaleItem> }
      stock_movements: { Row: StockMovement; Insert: Partial<StockMovement>; Update: Partial<StockMovement> }
      accounts_payable: { Row: AccountPayable; Insert: Partial<AccountPayable>; Update: Partial<AccountPayable> }
      accounts_receivable: { Row: AccountReceivable; Insert: Partial<AccountReceivable>; Update: Partial<AccountReceivable> }
      store_settings: { Row: StoreSettings; Insert: Partial<StoreSettings>; Update: Partial<StoreSettings> }
    }
    Views: {
      products_with_margin: { Row: Product }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
