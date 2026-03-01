/**
 * db.js — Todas as operações com o Supabase.
 * Converte snake_case do banco para camelCase do app e vice-versa.
 */
import { supabase } from './supabase.js'

// ─── MAPPERS ─────────────────────────────────────────────────────────────────

const mapProduct = (r) => r && ({
  id: r.id, name: r.name, unit: r.unit,
  totalQty: Number(r.total_qty),
  avgCost: Number(r.avg_cost),
  minStock: Number(r.min_stock),
})

const mapStockEntry = (r) => r && ({
  id: r.id, productId: r.product_id,
  qty: Number(r.qty), totalCost: Number(r.total_cost),
  costPerUnit: Number(r.cost_per_unit),
  supplier: r.supplier, date: r.date,
})

const mapService = (r) => r && ({
  id: r.id, name: r.name, price: Number(r.price),
  duration: r.duration, active: r.active,
  needsReturn: r.needs_return, returnType: r.return_type,
  returnDays: r.return_days, returnNote: r.return_note,
})

const mapPatient = (r) => r && ({
  id: r.id, name: r.name, phone: r.phone, email: r.email,
  birthdate: r.birthdate, notes: r.notes, status: r.status,
})

const mapCost = (r) => r && ({
  id: r.id, name: r.name, type: r.type,
  amount: Number(r.amount), frequency: r.frequency, date: r.date,
})

const mapAppointment = (r) => r && ({
  id: r.id, patientId: r.patient_id, serviceId: r.service_id,
  date: r.date, time: r.time, status: r.status, saleId: r.sale_id,
})

const mapSaleProduct = (r) => r && ({
  productId: r.product_id, qty: Number(r.qty),
  costAtSale: Number(r.cost_at_sale), sessionType: r.session_type,
})

const mapSale = (r) => r && ({
  id: r.id, patientId: r.patient_id, serviceId: r.service_id,
  appointmentId: r.appointment_id, professional: r.professional,
  date: r.date, price: Number(r.price), paymentMethod: r.payment_method,
  installments: r.installments, paidInstallments: r.paid_installments,
  creditFeeRate: Number(r.credit_fee_rate),
  products: (r.sale_products || []).map(mapSaleProduct),
})

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name')
  if (error) throw error
  return data.map(mapProduct)
}

export async function createProduct({ name, unit, totalQty, avgCost, minStock }) {
  const { data, error } = await supabase.from('products').insert({
    name, unit, total_qty: totalQty, avg_cost: avgCost, min_stock: minStock,
  }).select().single()
  if (error) throw error
  return mapProduct(data)
}

export async function updateProductStock(id, newTotalQty, newAvgCost) {
  const { error } = await supabase.from('products')
    .update({ total_qty: newTotalQty, avg_cost: newAvgCost })
    .eq('id', id)
  if (error) throw error
}

// ─── STOCK ENTRIES ────────────────────────────────────────────────────────────

export async function fetchStockEntries() {
  const { data, error } = await supabase.from('stock_entries').select('*').order('date', { ascending: false })
  if (error) throw error
  return data.map(mapStockEntry)
}

export async function createStockEntry({ productId, qty, totalCost, costPerUnit, supplier, date }) {
  const { data, error } = await supabase.from('stock_entries').insert({
    product_id: productId, qty, total_cost: totalCost,
    cost_per_unit: costPerUnit, supplier, date,
  }).select().single()
  if (error) throw error
  return mapStockEntry(data)
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────

export async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*').order('name')
  if (error) throw error
  return data.map(mapService)
}

export async function createService(svc) {
  const { data, error } = await supabase.from('services').insert({
    name: svc.name, price: svc.price, duration: svc.duration, active: svc.active,
    needs_return: svc.needsReturn, return_type: svc.returnType,
    return_days: svc.returnDays, return_note: svc.returnNote,
  }).select().single()
  if (error) throw error
  return mapService(data)
}

export async function updateService(id, svc) {
  const { error } = await supabase.from('services').update({
    name: svc.name, price: svc.price, duration: svc.duration, active: svc.active,
    needs_return: svc.needsReturn, return_type: svc.returnType,
    return_days: svc.returnDays, return_note: svc.returnNote,
  }).eq('id', id)
  if (error) throw error
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────

export async function fetchPatients() {
  const { data, error } = await supabase.from('patients').select('*').order('name')
  if (error) throw error
  return data.map(mapPatient)
}

export async function createPatient({ name, phone, email, birthdate, notes, status }) {
  const { data, error } = await supabase.from('patients').insert({
    name, phone, email, birthdate: birthdate || null, notes, status,
  }).select().single()
  if (error) throw error
  return mapPatient(data)
}

export async function updatePatient(id, fields) {
  const { error } = await supabase.from('patients').update(fields).eq('id', id)
  if (error) throw error
}

// ─── COSTS ────────────────────────────────────────────────────────────────────

export async function fetchCosts() {
  const { data, error } = await supabase.from('costs').select('*').order('date', { ascending: false })
  if (error) throw error
  return data.map(mapCost)
}

export async function createCost({ name, type, amount, frequency, date }) {
  const { data, error } = await supabase.from('costs').insert({ name, type, amount, frequency, date }).select().single()
  if (error) throw error
  return mapCost(data)
}

export async function deleteCost(id) {
  const { error } = await supabase.from('costs').delete().eq('id', id)
  if (error) throw error
}

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export async function fetchAppointments() {
  const { data, error } = await supabase.from('appointments').select('*').order('date').order('time')
  if (error) throw error
  return data.map(mapAppointment)
}

export async function createAppointment({ patientId, serviceId, date, time, note }) {
  const { data, error } = await supabase.from('appointments').insert({
    patient_id: patientId, service_id: serviceId, date, time,
    status: 'scheduled', sale_id: null,
  }).select().single()
  if (error) throw error
  return mapAppointment(data)
}

export async function updateAppointmentStatus(id, status, saleId = null) {
  const { error } = await supabase.from('appointments')
    .update({ status, sale_id: saleId })
    .eq('id', id)
  if (error) throw error
}

export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, 'cancelled')
}

// ─── SALES ────────────────────────────────────────────────────────────────────

export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_products(*)')
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(mapSale)
}

export async function createSale(saleData, saleProductsData) {
  // 1. Insert sale
  const { data: sale, error: saleErr } = await supabase.from('sales').insert({
    patient_id: saleData.patientId,
    service_id: saleData.serviceId,
    appointment_id: saleData.appointmentId || null,
    professional: saleData.professional,
    date: saleData.date,
    price: saleData.price,
    payment_method: saleData.paymentMethod,
    installments: saleData.installments,
    paid_installments: saleData.paidInstallments,
    credit_fee_rate: saleData.creditFeeRate,
  }).select().single()
  if (saleErr) throw saleErr

  // 2. Insert sale_products
  if (saleProductsData.length > 0) {
    const rows = saleProductsData.map((sp) => ({
      sale_id: sale.id,
      product_id: sp.productId,
      qty: sp.qty,
      cost_at_sale: sp.costAtSale,
      session_type: sp.sessionType,
    }))
    const { error: spErr } = await supabase.from('sale_products').insert(rows)
    if (spErr) throw spErr
  }

  return { ...mapSale(sale), products: saleProductsData }
}

export async function deleteSale(id) {
  // sale_products deleted via ON DELETE CASCADE
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) throw error
}

export async function registerPixInstallment(id, newPaidInstallments) {
  const { error } = await supabase.from('sales')
    .update({ paid_installments: newPaidInstallments })
    .eq('id', id)
  if (error) throw error
}
