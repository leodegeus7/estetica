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

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ── suppliers ─────────────────────────────────────────────────────────────────
export async function fetchSuppliers() {
  const { data, error } = await supabase.from("suppliers").select("*").order("name");
  if (error) throw error;
  return data.map((s) => ({ id: s.id, name: s.name }));
}

export async function createSupplier(name) {
  const { data, error } = await supabase.from("suppliers").insert({ name }).select().single();
  if (error) throw error;
  return { id: data.id, name: data.name };
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
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

export async function updateStockEntry(e) {
  const { error } = await supabase.from("stock_entries").update({
    qty: e.qty, total_cost: e.totalCost,
    cost_per_unit: e.costPerUnit, supplier: e.supplier, date: e.date,
  }).eq("id", e.id);
  if (error) throw error;
}

export async function deleteStockEntry(id) {
  const { error } = await supabase.from("stock_entries").delete().eq("id", id);
  if (error) throw error;
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

export async function deleteService(id) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceServiceReferences(oldId, newId, newName) {
  // appointments
  await supabase.from("appointments").update({ service_id: newId }).eq("service_id", oldId);
  // sales service_id
  await supabase.from("sales").update({ service_id: newId }).eq("service_id", String(oldId));
  // quotation_items
  await supabase.from("quotation_items").update({ service_id: newId, service_name: newName }).eq("service_id", oldId);
  // attendance_procedures
  await supabase.from("attendance_procedures").update({ service_id: newId, service_name: newName }).eq("service_id", oldId);
  // sale_services JSONB
  const { data: salesData } = await supabase.from("sales").select("id, sale_services").not("sale_services", "is", null);
  for (const s of (salesData || [])) {
    if (!Array.isArray(s.sale_services)) continue;
    const updated = s.sale_services.map((ss) =>
      String(ss.serviceId) === String(oldId) ? { ...ss, serviceId: newId, serviceName: newName } : ss
    );
    if (JSON.stringify(updated) !== JSON.stringify(s.sale_services)) {
      await supabase.from("sales").update({ sale_services: updated }).eq("id", s.id);
    }
  }
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

export async function deletePatient(id) {
  const { error } = await supabase.from("patients").delete().eq("id", id);
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
    duration: a.duration || 60,
    appointmentType: a.appointment_type || "consulta",
    source: a.source || null,
    googleEventId: a.google_event_id || null,
    draftTitle: a.draft_title || "",
  }));
}

export async function fetchGoogleEventIds() {
  const { data, error } = await supabase
    .from("appointments")
    .select("google_event_id")
    .not("google_event_id", "is", null);
  if (error) throw error;
  return new Set(data.map((r) => r.google_event_id));
}

export async function createDraftAppointment(draft) {
  const { data, error } = await supabase.from("appointments").insert({
    patient_id: null,
    service_id: null,
    date: draft.date,
    time: draft.time,
    status: "draft",
    sale_id: null,
    location: draft.location || "Clínica",
    duration: draft.duration || 60,
    appointment_type: "consulta",
    source: "google",
    google_event_id: draft.googleEventId,
    draft_title: draft.draftTitle || "",
  }).select().single();
  if (error) throw error;
  return {
    id: data.id, patientId: null, serviceId: null,
    date: data.date, time: data.time, status: "draft", saleId: null,
    location: data.location, duration: data.duration,
    appointmentType: data.appointment_type,
    source: "google",
    googleEventId: data.google_event_id,
    draftTitle: data.draft_title,
  };
}

export async function dismissGoogleDraft(id) {
  const { error } = await supabase.from("appointments").update({ status: "gcal_dismissed" }).eq("id", id);
  if (error) throw error;
}

export async function completeDraftAppointment(id, { patientId, serviceId, appointmentType, duration }) {
  const { error } = await supabase.from("appointments").update({
    patient_id: patientId,
    service_id: serviceId || null,
    status: "scheduled",
    appointment_type: appointmentType || "consulta",
    duration: duration || 60,
  }).eq("id", id);
  if (error) throw error;
}

export async function createAppointment(a) {
  const { data, error } = await supabase.from("appointments").insert({
    patient_id: a.patientId, service_id: a.serviceId || null,
    date: a.date, time: a.time, status: "scheduled", sale_id: null,
    location: a.location || "Clínica",
    duration: a.duration || 60,
    appointment_type: a.appointmentType || "consulta",
  }).select().single();
  if (error) throw error;
  return {
    id: data.id, patientId: data.patient_id, serviceId: data.service_id,
    date: data.date, time: data.time, status: data.status, saleId: data.sale_id,
    location: data.location, duration: data.duration || 60,
    appointmentType: data.appointment_type || "consulta",
  };
}

export async function updateAppointmentStatus(id, status, saleId) {
  const { error } = await supabase.from("appointments").update({ status, sale_id: saleId || null }).eq("id", id);
  if (error) throw error;
}

export async function cancelAppointment(id) {
  const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

export async function deleteAppointment(id) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

export async function unlinkAppointmentFromSales(appointmentId) {
  const { error } = await supabase
    .from("sales")
    .update({ appointment_id: null })
    .eq("appointment_id", appointmentId);
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
    installmentsData: s.installments_data || [],
    quotationId: s.quotation_id || null,
    saleServices: s.sale_services || [],
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
    installments_data: sale.installmentsData || [],
    quotation_id: sale.quotationId || null,
    sale_services: sale.saleServices || null,
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

export async function updateProduct(p) {
  const { error } = await supabase.from("products")
    .update({ name: p.name, unit: p.unit, min_stock: p.minStock })
    .eq("id", p.id);
  if (error) throw error;
}

export async function updateInstallmentsData(saleId, installmentsData) {
  const { error } = await supabase.from("sales")
    .update({ installments_data: installmentsData })
    .eq("id", saleId);
  if (error) throw error;
}

export async function updateSale(sale, products) {
  const { error } = await supabase.from("sales").update({
    patient_id: sale.patientId,
    service_id: sale.serviceId,
    appointment_id: sale.appointmentId || null,
    professional: sale.professional,
    date: sale.date,
    price: sale.price,
    payment_method: sale.paymentMethod,
    card_brand: sale.cardBrand || "",
    installments: sale.installments,
    paid_installments: sale.paidInstallments,
    credit_fee_rate: sale.creditFeeRate,
    net_amount: sale.netAmount,
    location_id: sale.locationId || null,
    down_payment_amount: sale.downPaymentAmount || 0,
    down_payment_method: sale.downPaymentMethod || "",
    notes: sale.notes || "",
    installments_data: sale.installmentsData || [],
    quotation_id: sale.quotationId || null,
    sale_services: sale.saleServices || null,
  }).eq("id", sale.id);
  if (error) throw error;
  const { error: delErr } = await supabase.from("sale_products").delete().eq("sale_id", sale.id);
  if (delErr) throw delErr;
  if (products?.length > 0) {
    const { error: spErr } = await supabase.from("sale_products").insert(
      products.map((p) => ({ sale_id: sale.id, product_id: p.productId,
        qty: p.qty, cost_at_sale: p.costAtSale, session_type: p.sessionType }))
    );
    if (spErr) throw spErr;
  }
}

export async function registerPixInstallment(id, paidInstallments) {
  const { error } = await supabase.from("sales").update({ paid_installments: paidInstallments }).eq("id", id);
  if (error) throw error;
}

// ── locations CRUD ────────────────────────────────────────────────────────────
export async function createLocation(name) {
  const { data, error } = await supabase.from("locations").insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLocation(id) {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

// ── quotations ────────────────────────────────────────────────────────────────
function mapQuotation(q) {
  const allItems = (q.quotation_items || [])
    .sort((a, b) => (a.option_group ?? 0) - (b.option_group ?? 0) || a.sort_order - b.sort_order)
    .map((it) => ({
      id: it.id,
      serviceId: it.service_id || null,
      serviceName: it.service_name,
      price: it.price,
      finalPrice: it.final_price,
      note: it.note || "",
      sortOrder: it.sort_order,
      optionGroup: it.option_group ?? 0,
    }));

  // Group items by option_group
  const byGroup = {};
  allItems.forEach((it) => {
    const g = it.optionGroup;
    (byGroup[g] = byGroup[g] || []).push(it);
  });

  const optionConfigs = q.option_configs || [];
  const numOptions = Math.max(Object.keys(byGroup).length, optionConfigs.length, 1);
  const options = Array.from({ length: numOptions }, (_, i) => ({
    label: optionConfigs[i]?.label || `Opção ${i + 1}`,
    discount: optionConfigs[i]?.discount || 0,
    items: byGroup[i] || [],
  }));

  return {
    id: q.id,
    patientId: q.patient_id,
    appointmentId: q.appointment_id || null,
    professional: q.professional || "",
    date: q.date,
    validUntil: q.valid_until || null,
    location: q.location || "",
    status: q.status || "pending",
    total: q.total || 0,
    discount: q.discount || 0,
    totalWithDiscount: q.total_with_discount || 0,
    notes: q.notes || "",
    createdAt: q.created_at,
    options,
    // flat items for backward compat (replaceServiceReferences etc.)
    items: allItems,
  };
}

export async function fetchQuotations() {
  const { data, error } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapQuotation);
}

// options = [{ label, discount, items: [{serviceId, serviceName, price, finalPrice, note}] }]
function flattenOptionsToItems(options) {
  return options.flatMap((opt, optIdx) =>
    opt.items.map((it, i) => ({
      serviceId: it.serviceId || null,
      serviceName: it.serviceName,
      price: it.price,
      finalPrice: it.finalPrice,
      note: it.note || "",
      sortOrder: i,
      optionGroup: optIdx,
    }))
  );
}

export async function createQuotation(q, options) {
  const flatItems = flattenOptionsToItems(options);
  const total = flatItems.reduce((s, it) => s + it.price, 0);
  const totalWithDiscount = flatItems.reduce((s, it) => s + it.finalPrice, 0);
  const discount = total - totalWithDiscount;
  const optionConfigs = options.map((opt) => ({ label: opt.label, discount: opt.discount || 0 }));

  const { data, error } = await supabase.from("quotations").insert({
    patient_id: q.patientId,
    appointment_id: q.appointmentId || null,
    professional: q.professional || "",
    date: q.date,
    valid_until: q.validUntil || null,
    location: q.location || "",
    status: "pending",
    total,
    discount,
    total_with_discount: totalWithDiscount,
    notes: q.notes || "",
    option_configs: optionConfigs,
  }).select().single();
  if (error) throw error;

  if (flatItems.length > 0) {
    const { error: itErr } = await supabase.from("quotation_items").insert(
      flatItems.map((it) => ({
        quotation_id: data.id,
        service_id: it.serviceId,
        service_name: it.serviceName,
        price: it.price,
        final_price: it.finalPrice,
        note: it.note,
        sort_order: it.sortOrder,
        option_group: it.optionGroup,
      }))
    );
    if (itErr) throw itErr;
  }

  const { data: full, error: fetchErr } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", data.id)
    .single();
  if (fetchErr) throw fetchErr;
  return mapQuotation(full);
}

export async function updateQuotation(q, options) {
  const flatItems = flattenOptionsToItems(options);
  const total = flatItems.reduce((s, it) => s + it.price, 0);
  const totalWithDiscount = flatItems.reduce((s, it) => s + it.finalPrice, 0);
  const discount = total - totalWithDiscount;
  const optionConfigs = options.map((opt) => ({ label: opt.label, discount: opt.discount || 0 }));

  const { error } = await supabase.from("quotations").update({
    patient_id: q.patientId,
    appointment_id: q.appointmentId || null,
    professional: q.professional || "",
    date: q.date,
    valid_until: q.validUntil || null,
    location: q.location || "",
    total,
    discount,
    total_with_discount: totalWithDiscount,
    notes: q.notes || "",
    option_configs: optionConfigs,
  }).eq("id", q.id);
  if (error) throw error;

  await supabase.from("quotation_items").delete().eq("quotation_id", q.id);
  if (flatItems.length > 0) {
    const { error: itErr } = await supabase.from("quotation_items").insert(
      flatItems.map((it) => ({
        quotation_id: q.id,
        service_id: it.serviceId,
        service_name: it.serviceName,
        price: it.price,
        final_price: it.finalPrice,
        note: it.note,
        sort_order: it.sortOrder,
        option_group: it.optionGroup,
      }))
    );
    if (itErr) throw itErr;
  }

  const { data: full, error: fetchErr } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", q.id)
    .single();
  if (fetchErr) throw fetchErr;
  return mapQuotation(full);
}

export async function updateQuotationStatus(id, status) {
  const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteQuotation(id) {
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw error;
}

// ── attendances ───────────────────────────────────────────────────────────────
function mapAttendance(row) {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    date: row.date,
    notes: row.notes || "",
    createdAt: row.created_at,
    procedures: (row.attendance_procedures || []).map((p) => ({
      id: p.id,
      serviceId: p.service_id,
      serviceName: p.service_name,
      qtyUsed: p.qty_used,
    })),
    products: (row.attendance_products || []).map((p) => ({
      id: p.id,
      productId: p.product_id,
      qty: p.qty,
      costAtUse: p.cost_at_use,
      note: p.note || "",
    })),
  };
}

export async function fetchAttendances() {
  const { data, error } = await supabase
    .from("attendances")
    .select("*, attendance_procedures(*), attendance_products(*)")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map(mapAttendance);
}

export async function createAttendance(attendance, procedures, products, currentProducts) {
  // 1. Insert attendance record
  const { data, error } = await supabase
    .from("attendances")
    .insert({
      appointment_id: attendance.appointmentId,
      patient_id: attendance.patientId,
      date: attendance.date,
      notes: attendance.notes || "",
    })
    .select()
    .single();
  if (error) throw error;
  const id = data.id;

  // 2. Insert procedures
  if (procedures?.length > 0) {
    const { error: pe } = await supabase.from("attendance_procedures").insert(
      procedures.map((p) => ({
        attendance_id: id,
        service_id: p.serviceId || null,
        service_name: p.serviceName,
        qty_used: p.qtyUsed,
      }))
    );
    if (pe) throw pe;
  }

  // 3. Insert products + deduct stock
  if (products?.length > 0) {
    const { error: ppe } = await supabase.from("attendance_products").insert(
      products.map((p) => ({
        attendance_id: id,
        product_id: p.productId,
        qty: p.qty,
        cost_at_use: p.costAtUse,
        note: p.note || "",
      }))
    );
    if (ppe) throw ppe;

    // Deduct stock for each product
    for (const p of products) {
      const prod = (currentProducts || []).find((x) => String(x.id) === String(p.productId));
      if (prod) {
        const newQty = Math.max(0, prod.totalQty - p.qty);
        await updateProductStock(p.productId, newQty, prod.avgCost);
      }
    }
  }

  // 4. Mark appointment as done
  if (attendance.appointmentId) {
    await updateAppointmentStatus(attendance.appointmentId, "done", null);
  }

  // Return full record
  const { data: full, error: fe } = await supabase
    .from("attendances")
    .select("*, attendance_procedures(*), attendance_products(*)")
    .eq("id", id)
    .single();
  if (fe) throw fe;
  return mapAttendance(full);
}

export async function updateAttendance(attendance, procedures, products, oldAttendance, currentProducts) {
  // 1. Update attendance record
  const { error } = await supabase
    .from("attendances")
    .update({ date: attendance.date, notes: attendance.notes || "" })
    .eq("id", attendance.id);
  if (error) throw error;

  // 2. Replace procedures
  await supabase.from("attendance_procedures").delete().eq("attendance_id", attendance.id);
  if (procedures?.length > 0) {
    const { error: pe } = await supabase.from("attendance_procedures").insert(
      procedures.map((p) => ({
        attendance_id: attendance.id,
        service_id: p.serviceId || null,
        service_name: p.serviceName,
        qty_used: p.qtyUsed,
      }))
    );
    if (pe) throw pe;
  }

  // 3. Revert old product stock, then apply new
  for (const p of (oldAttendance?.products || [])) {
    const prod = (currentProducts || []).find((x) => String(x.id) === String(p.productId));
    if (prod) {
      const revertedQty = prod.totalQty + p.qty;
      await updateProductStock(p.productId, revertedQty, prod.avgCost);
    }
  }
  await supabase.from("attendance_products").delete().eq("attendance_id", attendance.id);
  if (products?.length > 0) {
    const { error: ppe } = await supabase.from("attendance_products").insert(
      products.map((p) => ({
        attendance_id: attendance.id,
        product_id: p.productId,
        qty: p.qty,
        cost_at_use: p.costAtUse,
        note: p.note || "",
      }))
    );
    if (ppe) throw ppe;
    // Refresh currentProducts after revert for accurate deduction
    for (const p of products) {
      const prod = (currentProducts || []).find((x) => String(x.id) === String(p.productId));
      if (prod) {
        const newQty = Math.max(0, prod.totalQty + (oldAttendance?.products?.find((op) => String(op.productId) === String(p.productId))?.qty || 0) - p.qty);
        await updateProductStock(p.productId, newQty, prod.avgCost);
      }
    }
  }
}

export async function deleteAttendance(id, appointmentId, attendanceProducts, currentProducts) {
  // 1. Revert stock for each product
  for (const p of (attendanceProducts || [])) {
    const prod = (currentProducts || []).find((x) => String(x.id) === String(p.productId));
    if (prod) {
      const revertedQty = prod.totalQty + p.qty;
      await updateProductStock(p.productId, revertedQty, prod.avgCost);
    }
  }

  // 2. Delete attendance (cascades to procedures + products)
  const { error } = await supabase.from("attendances").delete().eq("id", id);
  if (error) throw error;

  // 3. Revert appointment to scheduled
  if (appointmentId) {
    await updateAppointmentStatus(appointmentId, "scheduled", null);
  }
}

// ── tasks ─────────────────────────────────────────────────────────────────────
export async function fetchTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description || "",
    urgency: t.urgency || "normal",
    dueDate: t.due_date || null,
    sortOrder: t.sort_order,
    createdAt: t.created_at,
    completed: t.completed || false,
  }));
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description || "",
      urgency: task.urgency || "normal",
      due_date: task.dueDate || null,
      sort_order: task.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, title: data.title, description: data.description, urgency: data.urgency, dueDate: data.due_date, sortOrder: data.sort_order, createdAt: data.created_at };
}

export async function updateTask(task) {
  const { error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description || "",
      urgency: task.urgency || "normal",
      due_date: task.dueDate || null,
      completed: task.completed || false,
    })
    .eq("id", task.id);
  if (error) throw error;
  return task;
}

export async function updateTaskOrder(tasks) {
  // Batch update sort_order for all tasks
  for (const t of tasks) {
    await supabase.from("tasks").update({ sort_order: t.sortOrder }).eq("id", t.id);
  }
}

export async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ── manual stock exits ────────────────────────────────────────────────────────
export async function fetchManualExits() {
  const { data, error } = await supabase
    .from("stock_manual_exits")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map((e) => ({
    id: e.id,
    productId: e.product_id,
    qty: e.qty,
    reason: e.reason || "",
    date: e.date,
    createdAt: e.created_at,
  }));
}

export async function createManualExit(exit) {
  const { data, error } = await supabase
    .from("stock_manual_exits")
    .insert({
      product_id: exit.productId,
      qty: exit.qty,
      reason: exit.reason || "",
      date: exit.date,
    })
    .select()
    .single();
  if (error) throw error;
  await updateProductStock(exit.productId, exit.newQty, exit.avgCost);
  return {
    id: data.id,
    productId: data.product_id,
    qty: data.qty,
    reason: data.reason || "",
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function deleteManualExit(id, productId, qty, currentProduct) {
  const { error } = await supabase.from("stock_manual_exits").delete().eq("id", id);
  if (error) throw error;
  if (currentProduct) {
    await updateProductStock(productId, currentProduct.totalQty + qty, currentProduct.avgCost);
  }
}

// ── commitments ───────────────────────────────────────────────────────────────

function mapCommitment(row) {
  return {
    id:            row.id,
    title:         row.title,
    description:   row.description || "",
    status:        row.status,
    urgency:       row.urgency,
    dueDate:       row.due_date || null,
    type:          row.type,
    patientId:     row.patient_id || null,
    procedureId:   row.procedure_id || null,
    isFuture:      row.is_future,
    sortOrder:     row.sort_order,
    createdAt:     row.created_at,
    completedAt:   row.completed_at || null,
    patientName:   row.patients?.name  || null,
    patientPhone:  row.patients?.phone || null,
    procedureName: row.services?.name  || null,
  };
}

export async function fetchCommitments() {
  const { data, error } = await supabase
    .from("commitments")
    .select("*, patients(name, phone), services(name)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapCommitment);
}

export async function createCommitment(c) {
  const { data, error } = await supabase
    .from("commitments")
    .insert({
      title:        c.title,
      description:  c.description || "",
      status:       c.status || "pending",
      urgency:      c.urgency || "medium",
      due_date:     c.dueDate || null,
      type:         c.type || "custom",
      patient_id:   c.patientId || null,
      procedure_id: c.procedureId || null,
      is_future:    c.isFuture || false,
      sort_order:   c.sortOrder ?? 100,
    })
    .select("*, patients(name, phone), services(name)")
    .single();
  if (error) throw error;
  return mapCommitment(data);
}

export async function updateCommitment(c) {
  const patch = {
    title:        c.title,
    description:  c.description || "",
    status:       c.status,
    urgency:      c.urgency,
    due_date:     c.dueDate || null,
    type:         c.type,
    patient_id:   c.patientId || null,
    procedure_id: c.procedureId || null,
    is_future:    c.isFuture,
    sort_order:   c.sortOrder,
  };
  if (c.status === "done") {
    patch.completed_at = c.completedAt || new Date().toISOString();
  } else {
    patch.completed_at = null;
  }
  const { data, error } = await supabase
    .from("commitments")
    .update(patch)
    .eq("id", c.id)
    .select("*, patients(name, phone), services(name)")
    .single();
  if (error) throw error;
  return mapCommitment(data);
}

export async function deleteCommitment(id) {
  const { error } = await supabase.from("commitments").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCommitmentOrder(items) {
  for (const item of items) {
    await supabase.from("commitments").update({ sort_order: item.sortOrder }).eq("id", item.id);
  }
}

// ── app_settings ──────────────────────────────────────────────────────────────

export async function fetchAppSettings() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return { commitmentTemplates: data.commitment_templates || {} };
}

export async function updateAppSettings(s) {
  const { error } = await supabase
    .from("app_settings")
    .update({ commitment_templates: s.commitmentTemplates })
    .eq("id", 1);
  if (error) throw error;
}
