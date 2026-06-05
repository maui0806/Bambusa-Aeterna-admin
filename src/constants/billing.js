import { STATUS_LABELS, STATUS_STYLES } from '@/constants/loading'

export const BILLING_SHIPMENT_LABELS = {
  PENDING: 'Pending',
  INVOICED: 'Invoiced',
  TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ...STATUS_LABELS,
}

export const BILLING_SHIPMENT_STYLES = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  INVOICED: 'bg-sky-50 text-sky-800 border-sky-200',
  TRANSIT: 'bg-violet-50 text-violet-800 border-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  ...STATUS_STYLES,
}

export const BILLING_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'TRANSIT', label: 'In Transit' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'PENDING', label: 'Pending' },
]

export const BILLING_SEARCH_CATEGORY_OPTIONS = [
  { value: 'all', label: 'All fields' },
  { value: 'vehicle', label: 'Vehicle Number' },
  { value: 'driver', label: 'Driver Contact' },
  { value: 'customer', label: 'Customer' },
]
