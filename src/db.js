import { supabase } from "./supabase";

// ── helpers ──────────────────────────────────────────────────────────────────
const snake = (o) => ({
  id: o.id,
  name: o.name,
  phone: o.phone || "",
  email: o.email || "",
  birthdate: o.birthdate || null,
  notes: o.notes || "",
  status: o.status || "ok",
});

// ── locations ─────────────────────────────────────────────────────────────────
export async function fetchLocations() {
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) throw error;
  return data;
}

// ── products ──────────────────────────────────────────────────────────────────
export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return data.map((p) => ({
    id: p.id, name: p.name, unit: p.unit,
    totalQty: p.total_qty, avgCost: p.avg_cost, minStock: p.min_stock,
  }));
}

export async function createProduct(p) {
  const { data, error } = await supabase.from("products").insert({
    name: p.name, unit: p.unit, total_qty: p.totalQty || 0,
    avg_cost: p.avgCost || 0, min_stock: p.minStock || 0,
  }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, unit: data.unit, totalQty: data.total_qty, avgCost: data.avg_cost, minStock: data.min_stock };
}

export async function updateProductStock(id, totalQty, avgCost) {
  const { error } = await supabase.from("products").update({ total_qty: totalQty, avg_cost: avgCost }).eq("id", id);
  if (error) throw error;
}

// ── stock entries ─────────────────────────────────────────────────────────────
export async function fetchStockEntries() {
  const { data, error } = await supabase.from("stock_entries").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data.map((e) => ({
    id: e.id, productId: e.product_id, qty: e.qty,
    totalCost: e.total_cost, costPerUnit: e.cost_per_unit,
    supplier: e.supplier, date: e.date,
  }));
}

export async function createStockEntry(e) {
  const { data, error } = await supabase.from("stock_entries").insert({
    product_id: e.productId, qty: e.qty, total_cost: e.totalCost,
    cost_per_unit: e.costPerUnit, supplier: e.supplier, date: e.date,
  }).select().single();
  if (error) throw error;
  return { id: data.id, productId: data.product_id, qty: data.qty, totalCost: data.total_cost, costPerUnit: data.cost_per_unit, supplier: data.supplier, date: data.date };
}

// ── services ──────────────────────────────────────────────────────────────────
export async function fetchServices() {
  const { data, error } = await supabase.from("services").select("*").order("name");
  if (error) throw error;
  return data.map((s) => ({
    id: s.id, name: s.name, price: s.price, duration: s.duration, active: s.active,
    needsReturn: s.needs_return, returnType: s.return_type,
    returnDays: s.return_days, returnNote: s.return_note,
  }));
}

export async function createService(s) {
  const { data, error } = await supabase.from("services").insert({
    name: s.name, price: s.price, duration: s.duration, active: s.active,
    needs_return: s.needsReturn, return_type: s.returnType,
    return_days: s.returnDays, return_note: s.returnNote,
  }).select().single();
  if (error) throw error;
  return fetchServices().then((list) => list.find((x) => x.id === data.id));
}

export async function updateService(s) {
  const { error } = await supabase.from("services").update({
    name: s.name, price: s.price, duration: s.duration, active: s.active,
    needs_return: s.needsReturn, return_type: s.returnType,
    return_days: s.returnDays, return_note: s.returnNote,
  }).eq("id", s.id);
  if (error) throw error;
}

// ── patients ──────────────────────────────────────────────────────────────────
export async function fetchPatients() {
  const { data, error } = await supabase.from("patients").select("*").order("name");
  if (error) throw error;
  return data.map(snake);
}

export async function createPatient(p) {
  const { data, error } = await supabase.from("patients").insert(snake(p)).select().single();
  if (error) throw error;
  return snake(data);
}

export async function updatePatient(p) {
  const { error } = await supabase.from("patients").update(snake(p)).eq("id", p.id);
  if (error) throw error;
}

// ── costs ─────────────────────────────────────────────────────────────────────
export async function fetchCosts() {
  const { data, error } = await supabase.from("costs").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data.map((c) => ({
    id: c.id, name: c.name, type: c.type, amount: c.amount, frequency: c.frequency, date: c.date,
  }));
}

export async function createCost(c) {
  const { data, error } = await supabase.from("costs").insert(c).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCost(id) {
  const { error } = await supabase.from("costs").delete().eq("id", id);
  if (error) throw error;
}

// ── appointments ──────────────────────────────────────────────────────────────
export async function fetchAppointments() {
  const { data, error } = await supabase.from("appointments").select("*").order("date").order("time");
  if (error) throw error;
  return data.map((a) => ({
    id: a.id, patientId: a.patient_id, serviceId: a.service_id,
    date: a.date, time: a.time, status: a.status, saleId: a.sale_id,
    location: a.location || "Clínica",
  }));
}

export async function createAppointment(a) {
  const { data, error } = await supabase.from("appointments").insert({
    patient_id: a.patientId, service_id: a.serviceId,
    date: a.date, time: a.time, status: "scheduled", sale_id: null,
    location: a.location || "Clínica",
  }).select().single();
  if (error) throw error;
  return { id: data.id, patientId: data.patient_id, serviceId: data.service_id, date: data.date, time: data.time, status: data.status, saleId: data.sale_id, location: data.location };
}

export async function updateAppointmentStatus(id, status, saleId) {
  const { error } = await supabase.from("appointments").update({ status, sale_id: saleId || null }).eq("id", id);
  if (error) throw error;
}

export async function cancelAppointment(id) {
  const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

// ── sales ─────────────────────────────────────────────────────────────────────
export async function fetchSales() {
  const { data, error } = await supabase.from("sales").select("*, sale_products(*)").order("date", { ascending: false });
  if (error) throw error;
  return data.map((s) => ({
    id: s.id, patientId: s.patient_id, serviceId: s.service_id,
    appointmentId: s.appointment_id, professional: s.professional,
    date: s.date, price: s.price, paymentMethod: s.payment_method,
    cardBrand: s.card_brand || "", installments: s.installments,
    paidInstallments: s.paid_installments, creditFeeRate: s.credit_fee_rate,
    netAmount: s.net_amount, location: s.location || "Clínica",
    locationId: s.location_id,
    downPaymentAmount: s.down_payment_amount || 0,
    downPaymentMethod: s.down_payment_method || "",
    notes: s.notes || "",
    products: (s.sale_products || []).map((sp) => ({
      productId: sp.product_id, qty: sp.qty,
      costAtSale: sp.cost_at_sale, sessionType: sp.session_type,
    })),
  }));
}

export async function createSale(sale, products) {
  const { data, error } = await supabase.from("sales").insert({
    patient_id: sale.patientId, service_id: sale.serviceId,
    appointment_id: sale.appointmentId || null,
    professional: sale.professional, date: sale.date, price: sale.price,
    payment_method: sale.paymentMethod, card_brand: sale.cardBrand || "",
    installments: sale.installments, paid_installments: sale.paidInstallments,
    credit_fee_rate: sale.creditFeeRate, net_amount: sale.netAmount,
    location_id: sale.locationId || null,
    down_payment_amount: sale.downPaymentAmount || 0,
    down_payment_method: sale.downPaymentMethod || "",
    notes: sale.notes || "",
  }).select().single();
  if (error) throw error;

  if (products && products.length > 0) {
    const { error: spErr } = await supabase.from("sale_products").insert(
      products.map((p) => ({
        sale_id: data.id, product_id: p.productId,
        qty: p.qty, cost_at_sale: p.costAtSale, session_type: p.sessionType,
      }))
    );
    if (spErr) throw spErr;
  }
  return data.id;
}

export async function deleteSale(id) {
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

export async function registerPixInstallment(id, paidInstallments) {
  const { error } = await supabase.from("sales").update({ paid_installments: paidInstallments }).eq("id", id);
  if (error) throw error;
}
