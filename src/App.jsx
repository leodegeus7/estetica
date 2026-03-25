import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as db from "./db";
import { supabase } from "./supabase";
import { subscribeToPush } from "./usePushNotifications";
import { loadMappings, saveMappings, syncGoogleCalendars } from "./googleCalendarSync";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const USERS = [
  { id: 1, email: "murillodovalle@gmail.com", password: "12345", name: "Dr. Murilo do Valle", role: "admin" },
  { id: 2, email: "leonardodegeus@gmail.com", password: "12345", name: "Leonardo de Geus", role: "attendant" },
];

const T = {
  bg: "#DDEBF1", dark: "#112933", teal: "#1B4B56", blue: "#4F8C97",
  grey: "#7A96A4", white: "#FFFFFF", danger: "#C0392B", success: "#27AE60",
  warning: "#E67E22", light: "#EEF5F8",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_PRODUCTS = [
  { id: 1, name: "Ácido Hialurônico 1ml", unit: "ml", totalQty: 15, avgCost: 320.00, minStock: 5 },
  { id: 2, name: "Ácido Hialurônico 2ml", unit: "ml", totalQty: 10, avgCost: 275.00, minStock: 4 },
  { id: 3, name: "Ampola Vitamina C", unit: "ampola", totalQty: 20, avgCost: 45.00, minStock: 5 },
  { id: 4, name: "Botox Allergan", unit: "unidade", totalQty: 200, avgCost: 12.00, minStock: 50 },
  { id: 5, name: "Botox Dysport", unit: "unidade", totalQty: 150, avgCost: 10.50, minStock: 50 },
  { id: 6, name: "Ultraformer Disparos", unit: "disparo", totalQty: 500, avgCost: 8.00, minStock: 100 },
];

const INIT_STOCK_ENTRIES = [
  { id: 1, productId: 4, qty: 200, totalCost: 2400, costPerUnit: 12, supplier: "Allergan Br", date: "2025-01-05" },
  { id: 2, productId: 1, qty: 15, totalCost: 4800, costPerUnit: 320, supplier: "Farmácia Fórmula", date: "2025-01-05" },
];

const INIT_SERVICES = [
  { id: 1, name: "Botox Completo", price: 2200, duration: 90, active: true, needsReturn: true, returnType: "retoque", returnDays: 30, returnNote: "" },
  { id: 2, name: "Botox Frontal", price: 1200, duration: 60, active: true, needsReturn: true, returnType: "retoque", returnDays: 30, returnNote: "Retoque 30 dias após aplicação" },
  { id: 3, name: "Preenchimento Labial", price: 1800, duration: 60, active: true, needsReturn: false, returnType: "", returnDays: 0, returnNote: "" },
  { id: 4, name: "Preenchimento Malar", price: 2500, duration: 90, active: true, needsReturn: false, returnType: "", returnDays: 0, returnNote: "" },
  { id: 5, name: "Ultraformer Face", price: 3500, duration: 120, active: true, needsReturn: true, returnType: "retorno", returnDays: 180, returnNote: "Retorno em 6 meses" },
  { id: 6, name: "Vitamina C IV", price: 350, duration: 45, active: true, needsReturn: false, returnType: "", returnDays: 0, returnNote: "" },
];

const INIT_PATIENTS = [
  { id: 1, name: "Ana Carolina Souza", phone: "41999991111", email: "ana@email.com", birthdate: "1988-05-12", notes: "Alergia a lidocaína", status: "ok" },
  { id: 2, name: "Beatriz Oliveira Lima", phone: "41988882222", email: "bea@email.com", birthdate: "1992-03-22", notes: "", status: "ok" },
  { id: 3, name: "Carla Menezes", phone: "41977773333", email: "carla@email.com", birthdate: "1985-11-08", notes: "Preferência por manhã", status: "late" },
  { id: 4, name: "Daniela Torres", phone: "41966664444", email: "dani@email.com", birthdate: "1995-07-30", notes: "", status: "ok" },
];

const INIT_SALES = [
  { id: 1, patientId: 1, serviceId: 2, appointmentId: 1, professional: "Dr. Murilo", date: "2025-01-20", price: 1200, paymentMethod: "pix", installments: 1, paidInstallments: 1, creditFeeRate: 0, cardBrand: "", location: "Clínica", downPaymentAmount: 0, downPaymentMethod: "", netAmount: 1200, products: [{ productId: 4, qty: 20, costAtSale: 12, sessionType: "initial" }] },
  { id: 2, patientId: 2, serviceId: 3, appointmentId: null, professional: "Dr. Murilo", date: "2025-01-21", price: 1800, paymentMethod: "credit", installments: 3, paidInstallments: 3, creditFeeRate: 2.99, products: [{ productId: 1, qty: 1, costAtSale: 320, sessionType: "initial" }] },
  { id: 3, patientId: 3, serviceId: 5, appointmentId: null, professional: "Dr. Murilo", date: "2025-01-22", price: 3500, paymentMethod: "pixInstallment", installments: 3, paidInstallments: 1, creditFeeRate: 0, products: [{ productId: 6, qty: 200, costAtSale: 8, sessionType: "initial" }] },
  { id: 4, patientId: 4, serviceId: 1, appointmentId: null, professional: "Dr. Murilo", date: "2025-01-23", price: 2200, paymentMethod: "pix", installments: 1, paidInstallments: 1, creditFeeRate: 0, products: [{ productId: 4, qty: 50, costAtSale: 12, sessionType: "initial" }] },
];

const INIT_COSTS = [
  { id: 1, name: "Aluguel", type: "fixed", amount: 4500, frequency: "monthly", date: "2025-01-01" },
  { id: 2, name: "Salário Recepcionista", type: "fixed", amount: 2800, frequency: "monthly", date: "2025-01-01" },
  { id: 3, name: "Energia Elétrica", type: "variable", amount: 800, frequency: "monthly", date: "2025-01-15" },
  { id: 4, name: "Marketing Instagram", type: "variable", amount: 1200, frequency: "monthly", date: "2025-01-10" },
];

const INIT_APPOINTMENTS = [
  { id: 1, patientId: 1, serviceId: 2, date: "2025-01-27", time: "09:00", status: "done", saleId: 1 },
  { id: 2, patientId: 2, serviceId: 3, date: "2025-01-27", time: "10:30", status: "scheduled", saleId: null },
  { id: 3, patientId: 4, serviceId: 6, date: "2025-01-27", time: "14:00", status: "scheduled", saleId: null },
  { id: 4, patientId: 3, serviceId: 5, date: "2025-01-28", time: "09:00", status: "scheduled", saleId: null },
];

// ─── PAYMENT FEES ────────────────────────────────────────────────────────────
// Taxas PagSeguro por bandeira e número de parcelas
const FEES = {
  debit:  { mastercard: 1.39, visa: 1.39, elo: 1.45, amex: 1.79 },
  credit: {
    mastercard: { 1:2.91,2:4.58,3:5.35,4:6.11,5:6.85,6:7.59,7:8.37,8:9.09,9:9.81,10:10.51,11:11.22,12:11.91,13:12.60,14:13.28,15:13.95 },
    visa:       { 1:2.91,2:4.58,3:5.35,4:6.11,5:6.85,6:7.59,7:8.37,8:9.09,9:9.81,10:10.51,11:11.22,12:11.91,13:12.60,14:13.28,15:13.95 },
    elo:        { 1:3.24,2:4.73,3:5.50,4:6.26,5:7.00,6:7.74,7:8.57,8:9.29,9:10.01,10:10.71,11:11.42,12:12.11,13:12.80,14:13.48 },
    amex:       { 1:3.24,2:4.73,3:5.50,4:6.26,5:7.00,6:7.74,7:8.57,8:9.29,9:10.01,10:10.71,11:11.42,12:12.11,13:12.80,14:13.48 },
  },
};

function getFeeRate(method, brand, installments) {
  if (!method || method === "pix" || method === "pixInstallment" || method === "cash" || method === "boleto") return 0;
  const b = (brand || "mastercard").toLowerCase();
  if (method === "debit") return FEES.debit[b] || 0;
  if (method === "credit") return (FEES.credit[b] || FEES.credit.mastercard)[installments] || 0;
  return 0;
}

// Locais de atendimento (pode ser gerenciado pelo BD futuramente)
const INIT_LOCATIONS = [
  { id: 1, name: "Buffara" },
  { id: 2, name: "Carambeí" },
  { id: 3, name: "Clínica" },
  { id: 4, name: "Floripa" },
  { id: 5, name: "Oris" },
  { id: 6, name: "Ponta Grossa" },
];

const PAYMENT_METHODS = [
  { value: "pix",            label: "Pix" },
  { value: "pixInstallment", label: "Pix Parcelado" },
  { value: "credit",         label: "Crédito" },
  { value: "debit",          label: "Débito" },
  { value: "cash",           label: "Dinheiro" },
  { value: "boleto",         label: "Boleto" },
];

const CARD_BRANDS = ["Mastercard","Visa","Elo","Amex"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "";
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const sortByName = (arr) => [...arr].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

// Clean phone to digits only
const cleanPhone = (p) => (p || "").replace(/\D/g, "");

// WhatsApp link
const waLink = (phone, msg) => {
  const n = cleanPhone(phone);
  if (!n) return null;
  return `https://wa.me/55${n}?text=${encodeURIComponent(msg)}`;
};

// Birthday helpers
function getDaysUntilBirthday(birthdate) {
  if (!birthdate) return null;
  const now = new Date();
  const bd = new Date(birthdate + "T12:00:00");
  const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next - now) / 86400000);
}

function isBirthdaySoon(birthdate, days = 3) {
  const d = getDaysUntilBirthday(birthdate);
  return d !== null && d >= 0 && d <= days;
}

function calcSaleCost(saleProducts) {
  return (saleProducts || []).reduce((s, p) => s + (p.costAtSale || 0) * p.qty, 0);
}

// Computes pending procedures for a patient = sold qty - already used in attendances
function calcPendingProcedures(patientId, sales, attendances) {
  const sold = {};
  sales.filter((s) => String(s.patientId) === String(patientId)).forEach((s) => {
    if (s.saleServices?.length > 0) {
      s.saleServices.forEach((sv) => {
        const key = sv.serviceId || sv.serviceName;
        if (!sold[key]) sold[key] = { serviceId: sv.serviceId, serviceName: sv.serviceName, total: 0 };
        sold[key].total += (sv.qty || 1);
      });
    } else if (s.serviceId) {
      const key = s.serviceId;
      if (!sold[key]) sold[key] = { serviceId: s.serviceId, serviceName: "", total: 0 };
      sold[key].total += 1;
    }
  });
  attendances.filter((a) => String(a.patientId) === String(patientId)).forEach((a) => {
    (a.procedures || []).forEach((p) => {
      const key = p.serviceId || p.serviceName;
      if (sold[key]) sold[key].total -= p.qtyUsed;
    });
  });
  return Object.values(sold).filter((p) => p.total > 0);
}
function calcNetValue(sale) {
  const productCost = calcSaleCost(sale.products);
  const fee = sale.paymentMethod === "credit" ? (sale.creditFeeRate / 100) * sale.price : 0;
  return sale.price - productCost - fee;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; font-family: 'DM Sans', sans-serif; color: ${T.dark}; min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${T.light}; }
  ::-webkit-scrollbar-thumb { background: ${T.grey}; border-radius: 3px; }

  .login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${T.dark} 0%, ${T.teal} 100%); }
  .login-card { background: white; border-radius: 20px; padding: 48px 44px; width: 100%; max-width: 420px; box-shadow: 0 24px 80px rgba(17,41,51,0.35); }
  .login-logo { text-align: center; margin-bottom: 32px; }
  .login-logo h1 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: ${T.dark}; }
  .login-logo p { font-size: 12px; color: ${T.grey}; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; }
  .login-error { background: #FDECEA; color: ${T.danger}; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .login-hint { margin-top: 16px; font-size: 11px; color: ${T.grey}; text-align: center; line-height: 1.8; background: ${T.light}; border-radius: 8px; padding: 8px; }

  .app { display: flex; min-height: 100vh; }
  .sidebar { width: 240px; min-width: 240px; background: ${T.dark}; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .sidebar-logo { padding: 28px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sidebar-logo h1 { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: white; line-height: 1.3; }
  .sidebar-logo span { font-size: 11px; color: ${T.grey}; letter-spacing: 0.08em; text-transform: uppercase; }
  .sidebar-nav { flex: 1; padding: 12px 0; }
  .nav-group { padding: 8px 0; }
  .nav-group-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${T.grey}; padding: 6px 20px; font-weight: 500; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; border-left: 3px solid transparent; transition: all 0.2s; font-size: 13.5px; color: rgba(255,255,255,0.65); }
  .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
  .nav-item.active { border-left-color: ${T.blue}; background: rgba(79,140,151,0.15); color: white; font-weight: 500; }
  .nav-item .icon { font-size: 15px; min-width: 18px; }
  .sidebar-user { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: rgba(255,255,255,0.55); }
  .sidebar-user strong { display: block; color: white; font-size: 13px; }
  .logout-btn { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; padding: 4px 0; font-family: 'DM Sans', sans-serif; }
  .logout-btn:hover { color: white; }

  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .topbar { background: white; border-bottom: 1px solid rgba(17,41,51,0.08); padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  .topbar h2 { font-size: 18px; font-weight: 600; color: ${T.dark}; }
  .content { flex: 1; padding: 24px 28px; overflow-y: auto; }

  .card { background: white; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(17,41,51,0.06); }
  .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.grey}; font-weight: 600; margin-bottom: 6px; }
  .card-value { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 700; color: ${T.dark}; line-height: 1; }
  .card-sub { font-size: 12px; color: ${T.grey}; margin-top: 4px; }

  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  thead th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.grey}; font-weight: 600; border-bottom: 2px solid ${T.light}; background: ${T.light}; }
  tbody tr { transition: background 0.15s; }
  tbody tr:hover { background: #F7FAFC; }
  tbody td { padding: 11px 12px; border-bottom: 1px solid ${T.light}; color: ${T.dark}; vertical-align: middle; }

  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
  .badge-ok { background: #E8F5E9; color: #27AE60; }
  .badge-late { background: #FDECEA; color: #C0392B; }
  .badge-warning { background: #FFF3E0; color: #E67E22; }
  .badge-info { background: #E3F2FD; color: #1565C0; }
  .badge-scheduled { background: #E8EAF6; color: #3949AB; }
  .badge-done { background: #E8F5E9; color: #2E7D32; }
  .badge-cancelled { background: #F3E5F5; color: #6A1B9A; }
  .badge-grey { background: ${T.light}; color: ${T.grey}; }
  .badge-birthday { background: #FFF8E1; color: #F9A825; }

  .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; gap: 7px; text-decoration: none; }
  .btn-primary { background: ${T.teal}; color: white; }
  .btn-primary:hover { background: ${T.dark}; }
  .btn-secondary { background: ${T.light}; color: ${T.dark}; }
  .btn-secondary:hover { background: #D5E5EE; }
  .btn-danger { background: #FDECEA; color: ${T.danger}; }
  .btn-danger:hover { background: ${T.danger}; color: white; }
  .btn-success { background: #E8F5E9; color: ${T.success}; }
  .btn-success:hover { background: ${T.success}; color: white; }
  .btn-wa { background: #E8F5E9; color: #25D366; }
  .btn-wa:hover { background: #25D366; color: white; }
  .btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 6px; }
  .btn-ghost { background: transparent; color: ${T.grey}; padding: 6px 10px; }
  .btn-ghost:hover { background: ${T.light}; color: ${T.dark}; }

  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 12px; font-weight: 500; color: ${T.grey}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em; }
  .form-control { width: 100%; padding: 9px 12px; border: 1.5px solid #D5E5EE; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: ${T.dark}; background: white; transition: border-color 0.2s; outline: none; }
  .form-control:focus { border-color: ${T.blue}; }
  .form-row { display: grid; gap: 14px; }
  .form-row-2 { grid-template-columns: 1fr 1fr; }
  .form-row-3 { grid-template-columns: 1fr 1fr 1fr; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(17,41,51,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .modal { background: white; border-radius: 16px; width: 100%; max-width: 640px; max-height: 92vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(17,41,51,0.25); }
  .modal-lg { max-width: 780px; }
  .modal-header { padding: 20px 24px; border-bottom: 1px solid ${T.light}; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 1; }
  .modal-title { font-size: 17px; font-weight: 600; color: ${T.dark}; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid ${T.light}; display: flex; justify-content: flex-end; gap: 10px; }

  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
  .section-title { font-size: 15px; font-weight: 600; color: ${T.dark}; }
  .section-sub { font-size: 13px; color: ${T.grey}; }

  .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .alert-content { display: flex; align-items: center; gap: 8px; flex: 1; }
  .alert-danger { background: #FDECEA; color: #C0392B; border-left: 4px solid #C0392B; }
  .alert-warning { background: #FFF3E0; color: #E67E22; border-left: 4px solid #E67E22; }
  .alert-info { background: #E3F2FD; color: #1565C0; border-left: 4px solid #1565C0; }
  .alert-success { background: #E8F5E9; color: ${T.success}; border-left: 4px solid ${T.success}; }
  .alert-birthday { background: #FFF8E1; color: #F9A825; border-left: 4px solid #F9A825; }

  .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${T.light}; font-size: 13.5px; }
  .stat-row:last-child { border-bottom: none; }
  .stat-label { color: ${T.grey}; }
  .stat-value { font-weight: 600; color: ${T.dark}; }

  .empty { text-align: center; padding: 40px; color: ${T.grey}; font-size: 14px; }
  .tag { display: inline-block; background: ${T.light}; color: ${T.blue}; font-size: 11.5px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }

  .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: ${T.light}; padding: 4px; border-radius: 10px; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border-radius: 7px; cursor: pointer; font-size: 13.5px; font-weight: 500; color: ${T.grey}; border: none; background: transparent; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .tab.active { background: white; color: ${T.dark}; box-shadow: 0 1px 4px rgba(17,41,51,0.08); }

  .search-wrap { position: relative; }
  .search-wrap input { padding-left: 36px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${T.grey}; font-size: 14px; pointer-events: none; }

  .progress-bar { height: 6px; background: ${T.light}; border-radius: 3px; overflow: hidden; margin-top: 8px; }
  .progress-fill { height: 100%; border-radius: 3px; background: ${T.blue}; }
  .progress-fill.danger { background: ${T.danger}; }
  .progress-fill.warning { background: ${T.warning}; }

  .divider { border: none; border-top: 1px solid ${T.light}; margin: 16px 0; }
  .product-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; padding: 10px; background: ${T.light}; border-radius: 8px; }
  .product-row select, .product-row input { background: white; }
  .return-badge { display: inline-flex; align-items: center; gap: 4px; background: #FFF3E0; color: #E67E22; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }

  @media (max-width: 900px) {
    .sidebar { width: 200px; min-width: 200px; }
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 700px) {
    .sidebar { display: none !important; }
    .content { padding: 12px; padding-bottom: 80px; }
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
    .topbar { padding: 12px 16px; padding-top: max(12px, env(safe-area-inset-top)); }
    .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
    .product-row { flex-wrap: wrap; }
    .table-wrap { display: block; -webkit-overflow-scrolling: touch; }
    table { min-width: max-content; }
  }

  /* ── Bottom nav (mobile only) ── */
  .bottom-nav { display: none; }
  @media (max-width: 700px) {
    .bottom-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      background: ${T.dark}; z-index: 100; border-top: 1px solid rgba(255,255,255,0.08);
      padding: 0; padding-bottom: env(safe-area-inset-bottom);
    }
    .bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 8px 4px; cursor: pointer;
      color: rgba(255,255,255,0.45); font-size: 10px; gap: 3px;
      border: none; background: none; font-family: 'DM Sans', sans-serif;
      transition: color 0.2s; -webkit-tap-highlight-color: transparent;
    }
    .bottom-nav-item.active { color: ${T.blue}; }
    .bottom-nav-item .bn-icon { font-size: 20px; line-height: 1; }
    .bottom-nav-more {
      position: fixed; bottom: 60px; right: 0; left: 0;
      background: ${T.dark}; border-top: 1px solid rgba(255,255,255,0.1);
      padding: 8px 0; z-index: 99;
    }
    .bottom-nav-more-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 24px; color: rgba(255,255,255,0.7);
      cursor: pointer; font-size: 14px;
      -webkit-tap-highlight-color: transparent;
    }
    .bottom-nav-more-item.active { color: white; background: rgba(79,140,151,0.2); }
    .bottom-nav-more-item:active { background: rgba(255,255,255,0.05); }
  }
  .hamburger-btn { display: none; }
  @media (max-width: 700px) {
    .hamburger-btn {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; color: ${T.grey};
      font-size: 20px; cursor: pointer; padding: 4px;
    }
  }
`;

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg }}>
      <div style={{ fontSize:14,color:T.grey }}>Verificando sessão...</div>
    </div>
  );
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <MainApp user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} />;
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError("E-mail ou senha incorretos.");
    else {
      onLogin(data.user);
      if (data.user.email === "murillodovalle@gmail.com") subscribeToPush(1);
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <h1>Dr. Murilo do Valle</h1>
            <p>Sistema de Gestão Estética</p>
          </div>
          {error && <div className="login-error">⚠️ {error}</div>}
          <div className="form-group">
            <label>E-mail</label>
            <input className="form-control" type="text" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          <button className="btn btn-primary" onClick={handleLogin} disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 8 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState(INIT_LOCATIONS);
  const [stockEntries, setStockEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sales, setSales] = useState([]);
  const [costs, setCosts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [manualExits, setManualExits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [pendingReturn, setPendingReturn] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [gcalMappings, setGcalMappings] = useState(() => loadMappings());
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalLastSync, setGcalLastSync] = useState(null);

  useEffect(() => {
    Promise.all([
      db.fetchLocations(),
      db.fetchProducts(),
      db.fetchStockEntries(),
      db.fetchServices(),
      db.fetchPatients(),
      db.fetchSales(),
      db.fetchCosts(),
      db.fetchAppointments(),
      db.fetchQuotations(),
      db.fetchSuppliers().catch(() => []),
      db.fetchAttendances().catch(() => []),
      db.fetchTasks().catch(() => []),
      db.fetchManualExits().catch(() => []),
    ]).then(([locs, prods, stock, svcs, pats, sls, cts, appts, quots, supps, atts, tsks, mexits]) => {
      setLocations(locs.length > 0 ? locs : INIT_LOCATIONS);
      setProducts(prods);
      setStockEntries(stock);
      setServices(svcs);
      setPatients(pats);
      setSales(sls);
      setCosts(cts);
      setAppointments(appts);
      setQuotations(quots);
      setSuppliers(supps || []);
      setAttendances(atts || []);
      setTasks(tsks || []);
      setManualExits(mexits || []);
      setDataLoading(false);
    }).catch((err) => {
      console.error("Erro ao carregar dados:", err);
      setDataLoading(false);
    });
  }, []);

  async function triggerSync() {
    if (gcalSyncing) return;
    const validMappings = gcalMappings.filter((m) => m.calendarId && m.location);
    if (validMappings.length === 0) return;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return;
    setGcalSyncing(true);
    try {
      const newDrafts = await syncGoogleCalendars(validMappings);
      if (newDrafts.length > 0) setAppointments((prev) => [...prev, ...newDrafts]);
      setGcalLastSync(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      throw err;
    } finally {
      setGcalSyncing(false);
    }
  }

  useEffect(() => {
    if (dataLoading || !import.meta.env.VITE_GOOGLE_API_KEY) return;
    triggerSync();
    const id = setInterval(() => triggerSync(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [dataLoading]);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";
  const userForCtx = { ...user, name: displayName };

  const [showMore, setShowMore] = useState(false);

  const ctx = {
    user: userForCtx, products, setProducts, stockEntries, setStockEntries,
    services, setServices, patients, setPatients, sales, setSales,
    costs, setCosts, appointments, setAppointments, modal, setModal,
    pendingReturn, setPendingReturn, setPage, locations, setLocations,
    quotations, setQuotations,
    suppliers, setSuppliers,
    attendances, setAttendances,
    manualExits, setManualExits,
    tasks, setTasks,
    gcalMappings, setGcalMappings,
    gcalSyncing, gcalLastSync,
    triggerSync,
    db,
  };

  useEffect(() => {
    if (!pendingReturn) return;
    setModal({
      content: <ReturnPromptModal pr={pendingReturn} ctx={ctx} onClose={() => { setModal(null); setPendingReturn(null); }} />,
      onClose: () => { setModal(null); setPendingReturn(null); },
    });
  }, [pendingReturn]);

  if (dataLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div style={{ fontSize: 14, color: T.grey }}>Carregando dados...</div>
    </div>
  );

  const NAV = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "appointments", icon: "📅", label: "Agenda", group: "op" },
    { id: "quotations", icon: "📋", label: "Orçamentos", group: "op" },
    { id: "sales", icon: "💳", label: "Vendas", group: "op" },
    { id: "patients", icon: "👤", label: "Pacientes", group: "op" },
    { id: "stock", icon: "📦", label: "Estoque", group: "cad" },
    { id: "services", icon: "💉", label: "Procedimentos", group: "cad" },
    { id: "costs", icon: "🧾", label: "Custos", group: "cad" },
    { id: "locations", icon: "📍", label: "Locais", group: "cad" },
    { id: "gcal", icon: "📅", label: "Google Agenda", group: "cad" },
    { id: "finance", icon: "📊", label: "Financeiro", group: "fin" },
  ];
  const groups = {};
  NAV.forEach((n) => { const g = n.group || "main"; (groups[g] = groups[g] || []).push(n); });

  const PAGES = { dashboard: DashboardPage, appointments: AppointmentsPage, sales: SalesPage, quotations: QuotationsPage, patients: PatientsPage, stock: StockPage, services: ServicesPage, costs: CostsPage, locations: LocationsPage, finance: FinancePage, gcal: GoogleCalendarSettingsPage };
  const PageComponent = PAGES[page] || DashboardPage;

  // Bottom nav: 4 pinned + "Mais" drawer
  const BOTTOM_NAV = [
    { id: "dashboard",    icon: "🏠", label: "Início" },
    { id: "appointments", icon: "📅", label: "Agenda" },
    { id: "sales",        icon: "💳", label: "Vendas" },
    { id: "patients",     icon: "👤", label: "Pacientes" },
  ];
  const MORE_NAV = NAV.filter((n) => !BOTTOM_NAV.find((b) => b.id === n.id));

  function navTo(id) { setPage(id); setShowMore(false); }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Dr. Murilo do Valle</h1>
            <span>Estética Clínica</span>
          </div>
          <nav className="sidebar-nav">
            {[{ key: "main", label: null }, { key: "op", label: "Operacional" }, { key: "cad", label: "Cadastros" }, { key: "fin", label: "Financeiro" }].map(({ key, label }) =>
              groups[key] ? (
                <div className="nav-group" key={key}>
                  {label && <div className="nav-group-label">{label}</div>}
                  {groups[key].map((n) => (
                    <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                      <span className="icon">{n.icon}</span>{n.label}
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </nav>
          <div className="sidebar-user">
            <strong>{user.name}</strong>
            <span style={{ fontSize: 11 }}>{user.role === "admin" ? "Administrador" : "Atendente"}</span>
            <div><button className="logout-btn" onClick={onLogout}>↩ Sair</button></div>
          </div>
        </aside>
        <div className="main">
          <div className="topbar">
            <h2>{NAV.find((n) => n.id === page)?.label || "Dashboard"}</h2>
            <span style={{ fontSize: 13, color: T.grey }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
          <div className="content"><PageComponent ctx={ctx} /></div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      {showMore && (
        <div className="bottom-nav-more" onClick={() => setShowMore(false)}>
          {MORE_NAV.map((n) => (
            <div key={n.id} className={`bottom-nav-more-item ${page === n.id ? "active" : ""}`} onClick={() => navTo(n.id)}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </div>
          ))}
          <div className="bottom-nav-more-item" onClick={() => { onLogout(); setShowMore(false); }}>
            <span style={{ fontSize: 18 }}>↩</span>Sair
          </div>
        </div>
      )}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map((n) => (
          <button key={n.id} className={`bottom-nav-item ${page === n.id ? "active" : ""}`} onClick={() => navTo(n.id)}>
            <span className="bn-icon">{n.icon}</span>{n.label}
          </button>
        ))}
        <button className={`bottom-nav-item ${showMore ? "active" : ""}`} onClick={() => setShowMore((v) => !v)}>
          <span className="bn-icon">⋯</span>Mais
        </button>
      </nav>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && modal.onClose?.()}>
          <div className={`modal ${modal.lg ? "modal-lg" : ""}`}>{modal.content}</div>
        </div>
      )}
    </>
  );
}

// ─── RETURN PROMPT ─────────────────────────────────────────────────────────────
function ReturnPromptModal({ pr, ctx, onClose }) {
  const { setModal, setPage } = ctx;
  const suggestedDate = addDays(pr.appointment.date, pr.service.returnDays);

  function scheduleNow() {
    onClose();
    setTimeout(() => {
      setModal({
        content: <AppointmentForm ctx={ctx}
          prefill={{ patientId: pr.appointment.patientId, serviceId: pr.appointment.serviceId, date: suggestedDate, note: pr.service.returnNote }}
          onClose={() => setModal(null)} />,
        onClose: () => setModal(null),
      });
      setPage("appointments");
    }, 100);
  }

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">🔄 Agendar {pr.service.returnType === "retoque" ? "Retoque" : "Retorno"}?</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="alert alert-info" style={{ display: "block" }}>
          O procedimento <strong>{pr.service.name}</strong> para <strong>{pr.patient?.name}</strong> requer <strong>{pr.service.returnType}</strong> após <strong>{pr.service.returnDays} dias</strong>.
          {pr.service.returnNote && <div style={{ marginTop: 4 }}>{pr.service.returnNote}</div>}
        </div>
        <p style={{ fontSize: 14, marginTop: 8 }}>Data sugerida: <strong>{fmtDate(suggestedDate)}</strong></p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Não agendar</button>
        <button className="btn btn-secondary" onClick={onClose}>Agendar depois</button>
        <button className="btn btn-primary" onClick={scheduleNow}>📅 Agendar agora</button>
      </div>
    </>
  );
}

// ─── WA BUTTON ────────────────────────────────────────────────────────────────
function WaBtn({ phone, message, label = "WhatsApp" }) {
  const link = waLink(phone, message);
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
      📲 {label}
    </a>
  );
}

// ─── SEARCH SELECT ────────────────────────────────────────────────────────────
function SearchSelect({ options, value, onChange, placeholder = "Buscar…" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="form-control"
        value={open ? query : (selected?.label || "")}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {open && (
        <div style={{
          position: "absolute", zIndex: 999, background: "#fff",
          border: "1.5px solid #D5E5EE", borderRadius: 8, width: "100%",
          maxHeight: 200, overflowY: "auto",
          boxShadow: "0 4px 12px rgba(17,41,51,0.15)", marginTop: 2,
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 12px", color: T.grey, fontSize: 13 }}>Sem resultados</div>
          )}
          {filtered.map((o) => (
            <div key={o.value}
              onMouseDown={() => { onChange(o.value); setOpen(false); setQuery(""); }}
              style={{
                padding: "9px 12px", cursor: "pointer", fontSize: 13.5,
                background: String(o.value) === String(value) ? T.light : "transparent",
                borderBottom: `1px solid ${T.light}`,
              }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TASKS WIDGET ─────────────────────────────────────────────────────────────
function TasksWidget({ ctx }) {
  const { tasks, setTasks } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const dragItem = useRef(null);

  const urgencyLabel = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "🔴 Urgente" };
  const urgencyColor = { low: T.grey, normal: T.teal, high: T.warning, urgent: T.danger };

  function onDragStart(i) { dragItem.current = i; }
  function onDragOver(e, i) { e.preventDefault(); setDragOver(i); }
  async function onDrop(i) {
    if (dragItem.current === null || dragItem.current === i) { dragItem.current = null; setDragOver(null); return; }
    const reordered = [...tasks];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(i, 0, moved);
    const withOrder = reordered.map((t, idx) => ({ ...t, sortOrder: idx }));
    setTasks(withOrder);
    dragItem.current = null;
    setDragOver(null);
    try { await db.updateTaskOrder(withOrder); } catch (e) { console.error(e); }
  }

  async function deleteTask(task) {
    try {
      await db.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSelected(null);
    } catch (e) { console.error(e); }
  }

  async function toggleCompleted(e, task) {
    e.stopPropagation();
    const updated = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try { await db.updateTask(updated); } catch (err) { console.error(err); }
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);
  const sortedTasks = [...pendingTasks, ...doneTasks];

  return (
    <div className="card" style={{ height: "fit-content" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>📋 Tarefas</div>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>+ Tarefa</button>
      </div>
      {tasks.length === 0 && <div className="empty" style={{ padding: "20px 0" }}>Nenhuma tarefa pendente</div>}
      {sortedTasks.map((task, i) => {
        const isOverdue = task.dueDate && task.dueDate < today() && !task.completed;
        const origIndex = tasks.indexOf(task);
        return (
          <div key={task.id}
            draggable={!task.completed}
            onDragStart={() => !task.completed && onDragStart(origIndex)}
            onDragOver={(e) => !task.completed && onDragOver(e, origIndex)}
            onDrop={() => !task.completed && onDrop(origIndex)}
            onClick={() => setSelected(task)}
            style={{
              cursor: "pointer", padding: "10px 0",
              borderBottom: `1px solid ${T.light}`,
              borderTop: dragOver === origIndex && !task.completed ? `2px solid ${T.blue}` : undefined,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              opacity: task.completed ? 0.55 : 1,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              <span
                onClick={(e) => toggleCompleted(e, task)}
                title={task.completed ? "Desmarcar" : "Marcar como concluída"}
                style={{ fontSize: 17, lineHeight: 1, flexShrink: 0, cursor: "pointer" }}>
                {task.completed ? "✅" : "☐"}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? T.grey : T.dark }}>
                  {task.title}
                </div>
                {task.dueDate && !task.completed && (
                  <div style={{ fontSize: 11, color: isOverdue ? T.danger : T.grey, marginTop: 2 }}>
                    📅 {fmtDate(task.dueDate)}{isOverdue && " — vencida"}
                  </div>
                )}
              </div>
            </div>
            {!task.completed && (
              <span style={{ fontSize: 11, color: urgencyColor[task.urgency] || T.grey, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>
                {urgencyLabel[task.urgency] || task.urgency}
              </span>
            )}
          </div>
        );
      })}

      {showForm && (
        <TaskFormModal ctx={ctx} onClose={() => setShowForm(false)} />
      )}
      {editTask && (
        <TaskFormModal ctx={ctx} editTask={editTask} onClose={() => setEditTask(null)} />
      )}
      {selected && (
        <TaskDetailModal task={selected} onDelete={deleteTask} onEdit={(t) => { setSelected(null); setEditTask(t); }} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function TaskFormModal({ ctx, onClose, editTask = null }) {
  const { tasks, setTasks } = ctx;
  const [form, setForm] = useState(
    editTask
      ? { title: editTask.title, description: editTask.description || "", urgency: editTask.urgency || "normal", dueDate: editTask.dueDate || "" }
      : { title: "", description: "", urgency: "normal", dueDate: "" }
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editTask) {
        const updated = await db.updateTask({ ...editTask, ...form });
        setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
      } else {
        const sortOrder = tasks.length;
        const created = await db.createTask({ ...form, sortOrder });
        setTasks((prev) => [...prev, created]);
      }
      onClose();
    } catch (e) { console.error(e); setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editTask ? "Editar Tarefa" : "Nova Tarefa"}</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label>Título *</label><input className="form-control" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-group"><label>Descrição</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Urgência</label>
              <select className="form-control" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="form-group"><label>Data Limite</label><input type="date" className="form-control" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : editTask ? "Salvar" : "Criar Tarefa"}</button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onDelete, onEdit, onClose }) {
  const urgencyLabel = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "🔴 Urgente" };
  const urgencyColor = { low: T.grey, normal: T.teal, high: T.warning, urgent: T.danger };
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{task.title}</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {task.description && <p style={{ fontSize: 14, color: T.dark, marginBottom: 16 }}>{task.description}</p>}
          <div className="stat-row"><span className="stat-label">Urgência</span><span style={{ color: urgencyColor[task.urgency], fontWeight: 600 }}>{urgencyLabel[task.urgency]}</span></div>
          {task.dueDate && <div className="stat-row"><span className="stat-label">Data Limite</span><span style={{ color: task.dueDate < today() ? T.danger : T.dark }}>{fmtDate(task.dueDate)}{task.dueDate < today() && " — vencida"}</span></div>}
          <div className="stat-row"><span className="stat-label">Criada em</span><span>{task.createdAt ? new Date(task.createdAt).toLocaleDateString("pt-BR") : "—"}</span></div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div>
            {!confirmDel ? (
              <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>🗑 Excluir</button>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: T.danger }}>Confirmar exclusão?</span>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(task)}>✓ Sim</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(false)}>Não</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => { onEdit(task); onClose(); }}>✏️ Editar</button>
            <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ ctx }) {
  const { sales, costs, patients, appointments, products, services, attendances, setModal, setPage } = ctx;
  const todayStr = today();
  const curMonth = todayStr.slice(0, 7);

  function openAttendance(appt) {
    setModal({ lg: true, content: <AttendanceForm appointment={appt} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }

  const todaySales = sales.filter((s) => s.date === todayStr);
  const monthSales = sales.filter((s) => s.date.startsWith(curMonth));
  const todayRevenue = todaySales.reduce((s, x) => s + x.price, 0);
  const monthRevenue = monthSales.reduce((s, x) => s + x.price, 0);
  const monthAttendances = (attendances || []).filter((a) => a.date?.startsWith(curMonth));
  const monthProductCost = monthAttendances.reduce((sum, a) => sum + (a.products || []).reduce((s, p) => s + p.qty * p.costAtUse, 0), 0);
  const monthFees = monthSales.reduce((s, x) => s + (x.paymentMethod === "credit" ? (x.creditFeeRate / 100) * x.price : 0), 0);
  const monthCosts = costs.filter((c) => c.date.startsWith(curMonth)).reduce((s, c) => s + c.amount, 0);
  const realProfit = monthRevenue - monthProductCost - monthFees - monthCosts;
  const todayAppt = appointments.filter((a) => a.date === todayStr);

  const latePatients = patients.filter((p) => p.status === "late");
  const alertDate = new Date(); alertDate.setHours(0, 0, 0, 0);
  const alertIn3 = new Date(alertDate); alertIn3.setDate(alertDate.getDate() + 3);
  const latePix = sales.filter((s) => {
    if (s.paymentMethod !== "pixInstallment") return false;
    if (s.paidInstallments >= s.installments) return false;
    if (s.installmentsData?.length > 0) {
      return s.installmentsData.some((inst) => {
        if (inst.paid) return false;
        const due = new Date(inst.dueDate + "T12:00:00");
        return due <= alertIn3;
      });
    }
    return true; // legado: sem data, sempre alerta
  });
  const lowStock = products.filter((p) => p.minStock > 0 && p.totalQty <= p.minStock);
  const birthdaySoon = patients.filter((p) => isBirthdaySoon(p.birthdate, 3));

  const pendingFillAppts = appointments.filter((a) => a.status === "scheduled" && a.date < todayStr);
  const pendingDrafts = appointments.filter((a) => a.status === "draft");
  const hasAlerts = latePatients.length > 0 || latePix.length > 0 || lowStock.length > 0 || birthdaySoon.length > 0 || pendingFillAppts.length > 0 || pendingDrafts.length > 0;

  return (
    <div>
      <div className="grid-4">
        <MetricCard icon="💰" title="Faturamento Hoje" value={fmt(todayRevenue)} sub={`${todaySales.length} procedimentos`} />
        <MetricCard icon="📈" title="Faturamento Mês" value={fmt(monthRevenue)} sub="mês atual" />
        <MetricCard icon="✅" title="Lucro Líquido" value={fmt(realProfit)} sub="mês atual" color={realProfit >= 0 ? T.success : T.danger} />
        <MetricCard icon="📅" title="Agenda Hoje" value={todayAppt.length} sub="atendimentos" />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">⚠️ Alertas</div></div>
          {!hasAlerts && <div className="alert alert-success"><div className="alert-content">✅ Nenhum alerta no momento</div></div>}

          {pendingDrafts.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="alert alert-warning" style={{ display: "block" }}>
                <strong>📅 {pendingDrafts.length} pré-agendamento(s) importados do Google aguardando confirmação</strong>
                <div style={{ marginTop: 4, fontSize: 12, cursor: "pointer", textDecoration: "underline" }} onClick={() => setPage("appointments")}>
                  Acesse a Agenda para completar →
                </div>
              </div>
            </div>
          )}

          {pendingFillAppts.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="alert alert-warning" style={{ display: "block" }}>
                <strong>⏳ {pendingFillAppts.length} atendimento(s) aguardando preenchimento</strong>
                {pendingFillAppts.slice(0, 5).map((a) => {
                  const pat = patients.find((p) => String(p.id) === String(a.patientId));
                  const svc = services.find((s) => String(s.id) === String(a.serviceId));
                  return (
                    <div key={a.id} style={{ marginTop: 6, cursor: "pointer", textDecoration: "underline", fontSize: 13 }}
                      onClick={() => openAttendance(a)}>
                      📅 {fmtDate(a.date)} — {pat?.name} — {svc?.name || "Procedimento"}
                    </div>
                  );
                })}
                {pendingFillAppts.length > 5 && <div style={{ marginTop: 4, fontSize: 12 }}>+ {pendingFillAppts.length - 5} outros</div>}
              </div>
            </div>
          )}

          {birthdaySoon.map((p) => {
            const days = getDaysUntilBirthday(p.birthdate);
            const msg = days === 0
              ? `Feliz aniversário, ${p.name.split(" ")[0]}! 🎉 A Clínica Dr. Murilo do Valle deseja um dia maravilhoso para você!`
              : `Olá, ${p.name.split(" ")[0]}! 🎂 Seu aniversário está chegando e gostaríamos de celebrar com você! Entre em contato para saber sobre nossas condições especiais.`;
            return (
              <div key={p.id} className="alert alert-birthday">
                <div className="alert-content">
                  🎂 <span><strong>{p.name}</strong> — aniversário {days === 0 ? "hoje!" : days === 1 ? "amanhã!" : `em ${days} dias`}</span>
                </div>
                <WaBtn phone={p.phone} message={msg} label="Parabéns" />
              </div>
            );
          })}

          {latePatients.map((p) => {
            const msg = `Olá, ${p.name.split(" ")[0]}! Tudo bem? Passando para lembrar que há um pagamento pendente na Clínica Dr. Murilo do Valle. Podemos resolver isso? 😊`;
            return (
              <div key={p.id} className="alert alert-danger">
                <div className="alert-content">👤 Cobrança pendente: <strong>{p.name}</strong></div>
                <WaBtn phone={p.phone} message={msg} label="Cobrar" />
              </div>
            );
          })}

          {latePix.map((s) => {
            const p = patients.find((x) => String(x.id) === String(s.patientId));
            const svc = services.find((x) => String(x.id) === String(s.serviceId));
            const remaining = s.installments - s.paidInstallments;
            const installVal = fmt(s.price / s.installments);
            const msg = `Olá, ${p?.name?.split(" ")[0]}! Passando para lembrar da parcela do ${svc?.name || "procedimento"} (${installVal}). Quando puder, nos envie o Pix. 🙏`;
            return (
              <div key={s.id} className="alert alert-warning">
                <div className="alert-content">💳 Pix parcelado: <strong>{p?.name}</strong> — {remaining} parcela(s) pendente(s)</div>
                <WaBtn phone={p?.phone} message={msg} label="Cobrar" />
              </div>
            );
          })}

          {lowStock.map((p) => (
            <div key={p.id} className="alert alert-warning">
              <div className="alert-content">📦 Estoque baixo: <strong>{p.name}</strong> — {p.totalQty} {p.unit}(s)</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="section-header"><div className="section-title">📅 Agenda de Hoje</div></div>
            {todayAppt.length === 0 && <div className="empty">Nenhum agendamento hoje</div>}
            {todayAppt.map((a) => {
              const p = patients.find((x) => String(x.id) === String(a.patientId));
              const s = services.find((x) => String(x.id) === String(a.serviceId));
              const statusInfo = apptStatusInfo(a);
              return (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.light}` }}>
                  <div><div style={{ fontWeight: 500, fontSize: 14 }}>{p?.name}</div><div style={{ fontSize: 12, color: T.grey }}>{s?.name}</div></div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{a.time}</div>
                    <span className={`badge ${statusInfo.badgeClass}`}>{statusInfo.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <TasksWidget ctx={ctx} />
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">💳 Últimas Vendas</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Paciente</th><th>Procedimento</th><th>Valor</th><th>Lucro</th></tr></thead>
              <tbody>
                {sales.slice(0, 5).map((s) => {
                  const p = patients.find((x) => x.id === s.patientId);
                  const sv = services.find((x) => x.id === s.serviceId);
                  const net = calcNetValue(s);
                  return (
                    <tr key={s.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.date)}</td><td>{p?.name}</td><td>{sv?.name}</td><td>{fmt(s.price)}</td>
                      <td style={{ color: net >= 0 ? T.success : T.danger, fontWeight: 600 }}>{fmt(net)}</td></tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="section-header"><div className="section-title">📦 Estoque</div></div>
          {sortByName(products).map((p) => {
            const pct = Math.min(100, (p.totalQty / Math.max(p.minStock * 3, 1)) * 100);
            const danger = p.totalQty <= p.minStock;
            const warn = p.totalQty <= p.minStock * 1.5 && !danger;
            return (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{p.name}</span>
                  <span style={{ color: danger ? T.danger : warn ? T.warning : T.grey, fontWeight: 600 }}>{p.totalQty} {p.unit}</span>
                </div>
                <div className="progress-bar"><div className={`progress-fill ${danger ? "danger" : warn ? "warning" : ""}`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, sub, color }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="card-title">{title}</div>
          <div className="card-value" style={color ? { color, fontSize: 26 } : {}}>{value}</div>
          <div className="card-sub">{sub}</div>
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
function apptStatusInfo(a) {
  const todayStr = today();
  if (a.status === "draft") return { label: "📅 Google", badgeClass: "badge-warning", color: T.warning };
  if (a.status === "cancelled") return { label: "Cancelado", badgeClass: "badge-cancelled", color: T.grey };
  if (a.status === "done") return { label: "Finalizado", badgeClass: "badge-done", color: T.success };
  if (a.date < todayStr) return { label: "⏳ Aguardando Preenchimento", badgeClass: "badge-warning", color: T.warning };
  return { label: "Marcado", badgeClass: "badge-scheduled", color: T.blue };
}

function AppointmentsPage({ ctx }) {
  const { appointments, patients, services, attendances, setAppointments, setModal } = ctx;
  const [tab, setTab] = useState("today");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const todayStr = today();

  const drafts = appointments.filter((a) => a.status === "draft");
  const nonDrafts = appointments.filter((a) => a.status !== "draft" && a.status !== "gcal_dismissed");
  const pendingFill = nonDrafts.filter((a) => a.status === "scheduled" && a.date < todayStr);

  const grouped = {
    today: nonDrafts.filter((a) => a.date === todayStr),
    upcoming: nonDrafts.filter((a) => a.date > todayStr),
    past: nonDrafts.filter((a) => a.date < todayStr),
    fill: pendingFill,
  };

  function openNew() {
    setModal({ content: <AppointmentForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openComplete(draft) {
    setModal({
      content: <AppointmentForm ctx={ctx} draftId={draft.id} prefill={{ date: draft.date, time: draft.time, duration: draft.duration, location: draft.location, draftTitle: draft.draftTitle }} onClose={() => setModal(null)} />,
      onClose: () => setModal(null),
    });
  }
  function openSale(appt) {
    setModal({ lg: true, content: <SaleForm ctx={ctx} appointmentId={appt.id} prefillPatient={appt.patientId} prefillService={appt.serviceId} prefillLocation={appt.location} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openQuotation(appt) {
    setModal({ lg: true, content: <QuotationForm ctx={ctx} prefill={{ patientId: appt.patientId, appointmentId: appt.id, location: appt.location }} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openAttendance(appt) {
    setModal({ lg: true, content: <AttendanceForm appointment={appt} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function cancel(id) {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
    db.cancelAppointment(id).catch(console.error);
  }
  async function deleteAppt(id) {
    const appt = appointments.find((a) => a.id === id);
    try {
      if (appt?.source === "google") {
        // Marca como dismissed para bloquear re-importação no próximo sync
        await db.dismissGoogleDraft(id);
      } else {
        await db.unlinkAppointmentFromSales(id);
        await db.deleteAppointment(id);
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao apagar agendamento: " + (e.message || "tente novamente"));
    }
  }
  function openAttendanceView(appt) {
    const att = (attendances || []).find((a) => String(a.appointmentId) === String(appt.id));
    setModal({ lg: true, content: <AttendanceViewModal appointment={appt} attendance={att} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }

  const list = (grouped[tab] || []).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div>
      {drafts.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: `4px solid ${T.warning}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>📅 Pré-agendamentos ({drafts.length})</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Hora</th><th>Título</th><th>Local</th><th>Dur.</th><th>Ações</th></tr></thead>
              <tbody>
                {drafts.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((a) => (
                  <tr key={a.id} style={{ background: "#fffbf0" }}>
                    <td>{fmtDate(a.date)}</td>
                    <td><strong>{a.time}</strong></td>
                    <td><span style={{ color: T.teal, fontStyle: "italic" }}>{a.draftTitle}</span></td>
                    <td><span style={{ color: T.grey, fontSize: 12 }}>{a.location}</span></td>
                    <td style={{ color: T.grey, fontSize: 12 }}>{a.duration || 60}min</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => openComplete(a)}>✏️ Completar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteAppt(a.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-header">
        <div className="tabs">
          {[["today", "Hoje"], ["upcoming", "Próximos"], ["past", "Anteriores"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l} ({grouped[k].length})</button>
          ))}
          <button className={`tab ${tab === "fill" ? "active" : ""}`} onClick={() => setTab("fill")} style={{ color: pendingFill.length > 0 ? T.warning : undefined }}>
            ⏳ A Preencher {pendingFill.length > 0 && `(${pendingFill.length})`}
          </button>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Agendar</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Hora</th><th>Paciente</th><th>Tipo</th><th>Procedimento</th><th>Dur.</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8}><div className="empty">Nenhum agendamento</div></td></tr>}
              {list.map((a) => {
                const p = patients.find((x) => String(x.id) === String(a.patientId));
                const s = services.find((x) => String(x.id) === String(a.serviceId));
                const statusInfo = apptStatusInfo(a);
                return (
                  <tr key={a.id}>
                    <td>{fmtDate(a.date)}</td>
                    <td><strong>{a.time}</strong></td>
                    <td>{p?.name}</td>
                    <td><span className={`badge ${a.appointmentType === "avaliacao" ? "badge-warning" : "badge-scheduled"}`}>{a.appointmentType === "avaliacao" ? "Avaliação" : "Consulta"}</span></td>
                    <td>{s?.name} {s?.needsReturn && <span className="return-badge">🔄 {s.returnType}</span>}</td>
                    <td style={{ color: T.grey, fontSize: 12 }}>{a.duration || 60}min</td>
                    <td><span className={`badge ${statusInfo.badgeClass}`}>{statusInfo.label}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                        {a.status === "scheduled" && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => openAttendance(a)}>⚡ Preencher</button>
                            <button className="btn btn-sm btn-success" onClick={() => openSale(a)}>💰 Venda</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => openQuotation(a)}>📋 Orçamento</button>
                            <button className="btn btn-sm btn-danger" onClick={() => cancel(a.id)}>✕</button>
                          </>
                        )}
                        {a.status === "done" && (
                          <button className="btn btn-sm btn-secondary" onClick={() => openAttendanceView(a)}>👁 Ver</button>
                        )}
                        {a.status === "cancelled" && (
                          confirmDeleteId === a.id ? (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: T.danger }}>Apagar?</span>
                              <button className="btn btn-sm btn-danger" onClick={() => deleteAppt(a.id)}>✓ Sim</button>
                              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(null)}>Não</button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteId(a.id)}>🗑 Apagar</button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── APPOINTMENT FORM ─────────────────────────────────────────────────────────
function AppointmentForm({ ctx, onClose, prefill = {}, draftId }) {
  const { services, setAppointments, locations, patients: ctxPatients, setPatients } = ctx;
  const defaultLocation = (locations || []).find((l) => l.name === "Clínica")?.name || (locations?.[0]?.name || "Clínica");
  const [form, setForm] = useState({
    patientId: prefill.patientId || "",
    serviceId: prefill.serviceId || "",
    date: prefill.date || today(),
    time: prefill.time || "09:00",
    location: prefill.location || defaultLocation,
    note: prefill.note || "",
    appointmentType: "consulta",
    duration: prefill.duration || 60,
  });
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [np, setNp] = useState({ name: "", phone: "", email: "", birthdate: "", notes: "" });

  function handleServiceChange(serviceId) {
    const svc = services.find((s) => String(s.id) === String(serviceId));
    const dur = form.appointmentType === "avaliacao" ? 60 : (svc?.duration || 60);
    setForm((f) => ({ ...f, serviceId, duration: dur }));
  }

  function handleTypeChange(appointmentType) {
    const dur = appointmentType === "avaliacao" ? 60 : (services.find((s) => String(s.id) === String(form.serviceId))?.duration || form.duration);
    setForm((f) => ({ ...f, appointmentType, duration: dur }));
  }

  async function saveNewPatient() {
    if (!np.name) return;
    try {
      const created = await db.createPatient({ ...np, status: "ok" });
      setPatients((prev) => sortByName([...prev, created]));
      setForm((f) => ({ ...f, patientId: created.id }));
      setShowNew(false);
      setNp({ name: "", phone: "", email: "", birthdate: "", notes: "" });
    } catch (e) { console.error("Erro ao criar paciente:", e); }
  }

  async function save() {
    if (!form.patientId) return;
    if (form.appointmentType !== "avaliacao" && !form.serviceId) return;
    setSaving(true);
    try {
      if (draftId) {
        await db.completeDraftAppointment(draftId, {
          patientId: form.patientId,
          serviceId: form.serviceId,
          appointmentType: form.appointmentType,
          duration: form.duration,
        });
        setAppointments((prev) => prev.map((a) => a.id === draftId
          ? { ...a, patientId: form.patientId, serviceId: form.serviceId, status: "scheduled", appointmentType: form.appointmentType, duration: form.duration }
          : a
        ));
      } else {
        const created = await db.createAppointment({
          patientId: form.patientId,
          serviceId: form.serviceId,
          date: form.date,
          time: form.time,
          location: form.location,
          duration: form.duration,
          appointmentType: form.appointmentType,
        });
        setAppointments((prev) => [...prev, created]);
      }
      onClose();
    } catch (e) {
      console.error("Erro ao agendar:", e);
    } finally {
      setSaving(false);
    }
  }

  const sortedPatients = sortByName(ctxPatients);
  const sortedServices = sortByName(services.filter((s) => s.active));

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{draftId ? `Completar: ${prefill.draftTitle || "Importado do Google"}` : prefill.serviceId ? "Agendar Retorno/Retoque" : "Novo Agendamento"}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {!showNew ? (
          <div className="form-group">
            <label>Paciente</label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <SearchSelect
                  options={sortedPatients.map((p) => ({ value: p.id, label: p.name }))}
                  value={form.patientId}
                  onChange={(v) => setForm({ ...form, patientId: v })}
                  placeholder="Buscar paciente…"
                />
              </div>
              <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }} onClick={() => setShowNew(true)}>+ Novo</button>
            </div>
          </div>
        ) : (
          <div style={{ background: T.light, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>👤 Novo Paciente Rápido</div>
            <div className="form-row form-row-2">
              <div className="form-group"><label>Nome *</label><input className="form-control" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} /></div>
              <div className="form-group"><label>Telefone</label><input className="form-control" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} /></div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-group"><label>Email</label><input className="form-control" value={np.email} onChange={(e) => setNp({ ...np, email: e.target.value })} /></div>
              <div className="form-group"><label>Data de Nascimento</label><input type="date" className="form-control" value={np.birthdate} onChange={(e) => setNp({ ...np, birthdate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Observações</label><textarea className="form-control" rows={2} value={np.notes} onChange={(e) => setNp({ ...np, notes: e.target.value })} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={saveNewPatient}>✓ Salvar Paciente</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Tipo</label>
            <select className="form-control" value={form.appointmentType} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="consulta">Consulta</option>
              <option value="avaliacao">Avaliação</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duração (min)</label>
            <input type="number" className="form-control" min={5} step={5} value={form.duration}
              onChange={(e) => setForm({ ...form, duration: +e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Procedimento {form.appointmentType === "avaliacao" && <span style={{ fontWeight: 400, color: T.grey, fontSize: 12 }}>(opcional)</span>}</label>
          <SearchSelect
            options={sortedServices.map((s) => ({ value: s.id, label: s.name }))}
            value={form.serviceId}
            onChange={handleServiceChange}
            placeholder={form.appointmentType === "avaliacao" ? "Buscar procedimento… (opcional)" : "Buscar procedimento…"}
          />
        </div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Data</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-group"><label>Hora</label><input type="time" className="form-control" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
        </div>
        <div className="form-group">
          <label>Local</label>
          <select className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
            {(locations || []).map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        {form.note && <div className="form-group"><label>Observação</label><textarea className="form-control" rows={2} value={form.note} readOnly style={{ background: T.light }} /></div>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Agendando…" : "Agendar"}</button>
      </div>
    </>
  );
}

// ─── SALES PAGE ───────────────────────────────────────────────────────────────
function SalesPage({ ctx }) {
  const { sales, patients, services, setSales, setModal } = ctx;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const openSales = sales.filter((s) =>
    (s.paymentMethod === "pixInstallment" && s.paidInstallments < s.installments)
  );

  const baseList = tab === "open" ? openSales : sales;
  const filtered = baseList.filter((s) => {
    const p = patients.find((x) => x.id === s.patientId);
    const sv = services.find((x) => x.id === s.serviceId);
    const svcName = s.saleServices?.length > 0 ? s.saleServices.map((i) => i.serviceName).join(" ") : (sv?.name || "");
    return ((p?.name || "") + svcName).toLowerCase().includes(search.toLowerCase());
  });

  function openNew() {
    setModal({ lg: true, content: <SaleForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openPix(sale) {
    setModal({ content: <PixInstallmentModal sale={sale} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openEditSale(sale) {
    setModal({ lg: true, content: <SaleForm ctx={ctx} editSale={sale} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function deleteSale(id) {
    if (confirmDelete === id) {
      try {
        await db.deleteSale(id);
        setSales((prev) => prev.filter((s) => s.id !== id));
      } catch (e) { console.error("Erro ao excluir venda:", e); }
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }

  const sessionLabel = { initial: "Inicial", retoque: "Retoque", manutencao: "Manutenção", outro: "Outro" };

  return (
    <div>
      <div className="section-header">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Todas ({sales.length})</button>
            <button className={`tab ${tab === "open" ? "active" : ""}`} onClick={() => setTab("open")}>
              Em aberto ({openSales.length}){openSales.length > 0 && " 🔴"}
            </button>
          </div>
          <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nova Venda</button>
      </div>

      {tab === "open" && openSales.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: "block" }}>
          💳 <strong>{openSales.length} venda(s)</strong> com parcelas de Pix em aberto — total pendente: {fmt(openSales.reduce((s, x) => s + (x.installments - x.paidInstallments) * (x.price / x.installments), 0))}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Paciente</th><th>Procedimento(s)</th><th>Valor</th><th>Pagamento</th><th>Valor Líquido</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7}><div className="empty">Nenhuma venda encontrada</div></td></tr>}
              {filtered.map((s) => {
                const p = patients.find((x) => String(x.id) === String(s.patientId));
                const sv = services.find((x) => String(x.id) === String(s.serviceId));
                const net = calcNetValue(s);
                const isPix = s.paymentMethod === "pixInstallment";
                const allPaid = s.paidInstallments >= s.installments;
                const svcLabel = s.saleServices?.length > 0
                  ? s.saleServices.map((it) => `${it.serviceName}${it.qty > 1 ? ` ×${it.qty}` : ""}`).join(", ")
                  : (sv?.name || "—");
                return (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.date)}</td>
                    <td>{p?.name}</td>
                    <td style={{ fontSize: 13 }}>
                      {svcLabel}
                      {s.quotationId && (
                        <span className="badge badge-info" style={{ marginLeft: 4, fontSize: 10, cursor: "pointer" }}
                          onClick={() => { const q = ctx.quotations?.find((x) => x.id === s.quotationId); if (q) ctx.setModal({ lg: true, content: <QuotationDetailModal quot={q} ctx={ctx} onClose={() => ctx.setModal(null)} />, onClose: () => ctx.setModal(null) }); }}
                        >📋 Orç.</span>
                      )}
                    </td>
                    <td><strong>{fmt(s.price)}</strong></td>
                    <td>
                      <span className={`badge ${s.paymentMethod === "pix" ? "badge-info" : s.paymentMethod === "credit" ? "badge-ok" : "badge-warning"}`}>
                        {s.paymentMethod === "pix" ? "Pix" : s.paymentMethod === "credit" ? `Crédito ${s.installments}x` : `Pix ${s.paidInstallments}/${s.installments}`}
                      </span>
                      {isPix && !allPaid && <div><span className="badge badge-warning" style={{ fontSize: 10, marginTop: 2 }}>pendente</span></div>}
                    </td>
                    <td style={{ color: net >= 0 ? T.success : T.danger, fontWeight: 600 }}>{fmt(net)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditSale(s)}>✏️</button>
                        {isPix && <button className="btn btn-sm btn-secondary" onClick={() => openPix(s)}>💳 Parcelas</button>}
                        {confirmDelete === s.id ? (
                          <>
                            <span style={{ fontSize: 12, color: T.danger, fontWeight: 500 }}>Confirmar?</span>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteSale(s.id)}>✓ Sim</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(null)}>Não</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-danger" onClick={() => deleteSale(s.id)} title="Excluir venda">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SALE DETAIL MODAL ────────────────────────────────────────────────────────
function SaleDetailModal({ sale, ctx, onClose }) {
  const { patients, services } = ctx;
  const patient = patients.find((p) => String(p.id) === String(sale.patientId));
  const sv = services.find((s) => String(s.id) === String(sale.serviceId));
  const svcLabel = sale.saleServices?.length > 0
    ? sale.saleServices
    : sv ? [{ serviceName: sv.name, qty: 1, price: sale.price, finalPrice: sale.price }] : [];

  const pmLabels = { pix: "Pix", credit: "Crédito", pixInstallment: "Pix Parcelado", cash: "Dinheiro", boleto: "Boleto", debit: "Débito" };
  const isInstallment = sale.paymentMethod === "pixInstallment";
  const isCredit = sale.paymentMethod === "credit";
  const net = calcNetValue(sale);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">💰 Venda — {patient?.name}</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="stat-row"><span className="stat-label">Data</span><span>{fmtDate(sale.date)}</span></div>
          {sale.professional && <div className="stat-row"><span className="stat-label">Profissional</span><span>{sale.professional}</span></div>}
          {sale.location && <div className="stat-row"><span className="stat-label">Local</span><span>{sale.location}</span></div>}

          {svcLabel.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: T.teal }}>📋 Procedimentos</div>
              {svcLabel.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.light}` }}>
                  <span style={{ fontSize: 13 }}>{it.serviceName}{it.qty > 1 && ` ×${it.qty}`}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(it.finalPrice ?? it.price)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="stat-row"><span className="stat-label">Forma de pagamento</span><span>{pmLabels[sale.paymentMethod] || sale.paymentMethod}{isCredit && sale.installments > 1 && ` — ${sale.installments}×`}</span></div>
          {isInstallment && (
            <div className="stat-row">
              <span className="stat-label">Parcelas pagas</span>
              <span style={{ color: sale.paidInstallments >= sale.installments ? T.success : T.warning, fontWeight: 600 }}>
                {sale.paidInstallments}/{sale.installments}
                {sale.paidInstallments < sale.installments && " — pendente"}
              </span>
            </div>
          )}
          {sale.downPaymentAmount > 0 && (
            <div className="stat-row"><span className="stat-label">Entrada</span><span>{fmt(sale.downPaymentAmount)} ({pmLabels[sale.downPaymentMethod] || sale.downPaymentMethod})</span></div>
          )}
          {sale.notes && <div className="stat-row"><span className="stat-label">Observações</span><span style={{ fontSize: 13 }}>{sale.notes}</span></div>}

          <div style={{ borderTop: `2px solid ${T.light}`, marginTop: 12, paddingTop: 12 }}>
            <div className="stat-row"><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700, fontSize: 16 }}>{fmt(sale.price)}</span></div>
            <div className="stat-row"><span className="stat-label">Valor líquido</span><span style={{ color: net >= 0 ? T.success : T.danger, fontWeight: 600 }}>{fmt(net)}</span></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── SALE FORM ────────────────────────────────────────────────────────────────
function SaleForm({ ctx, appointmentId, prefillPatient, prefillService, prefillLocation, editSale, onClose, quotationId, quotationItems }) {
  const { patients, setPatients, services, products, setSales, setPendingReturn, locations } = ctx;
  const defaultLocation = prefillLocation || (locations || []).find((l) => l.name === "Clínica")?.name || (locations?.[0]?.name || "Clínica");
  const editing = !!editSale;
  const fromQuotation = !editing && Array.isArray(quotationItems) && quotationItems.length > 0;

  const [saleServices, setSaleServices] = useState(
    fromQuotation ? quotationItems.map((it) => ({ ...it, included: true })) : []
  );

  const quotationTotal = fromQuotation
    ? saleServices.filter((i) => i.included).reduce((s, i) => s + (+i.finalPrice || 0), 0)
    : 0;

  // Multi-procedure list for non-quotation sales
  const initSaleProcedures = () => {
    if (fromQuotation) return [];
    if (editing && editSale.saleServices?.length > 0) {
      return editSale.saleServices.map((sv) => ({
        serviceId: String(sv.serviceId || ""),
        serviceName: sv.serviceName || "",
        qty: String(sv.qty || 1),
        price: String(sv.finalPrice || sv.price || ""),
      }));
    }
    const firstSvcId = prefillService ? String(prefillService) : (editSale?.serviceId ? String(editSale.serviceId) : "");
    const firstSvc = services.find((s) => String(s.id) === firstSvcId);
    return [{ serviceId: firstSvcId, serviceName: firstSvc?.name || "", qty: "1", price: String(editSale?.price || firstSvc?.price || "") }];
  };
  const [saleProcedures, setSaleProcedures] = useState(initSaleProcedures);

  const [form, setForm] = useState({
    patientId: editSale ? String(editSale.patientId) : (prefillPatient || ""),
    professional: editSale?.professional || ctx.user?.name || "Dr. Murilo",
    date: editSale?.date || today(),
    price: editSale?.price || (fromQuotation ? quotationTotal : ""),
    location: editSale?.location || defaultLocation,
    paymentMethod: editSale?.paymentMethod || "pix",
    cardBrand: editSale?.cardBrand || "Mastercard",
    installments: editSale?.installments || 1,
    creditFeeRate: editSale?.creditFeeRate || 0,
    netAmount: editSale?.netAmount || "",
    netAmountEdited: !!editSale,
    downPaymentAmount: editSale?.downPaymentAmount || "",
    downPaymentMethod: editSale?.downPaymentMethod || "pix",
  });

  const [showEntry, setShowEntry] = useState(editing && (editSale.downPaymentAmount > 0));
  const [installmentsPreview, setInstallmentsPreview] = useState([]);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const needsBrand = form.paymentMethod === "credit" || form.paymentMethod === "debit";
  const needsInstallments = form.paymentMethod === "credit" || form.paymentMethod === "pixInstallment";
  const maxInstallments = form.paymentMethod === "credit" ? 15 : 12;

  // In quotation mode: sync form.price with selected services total
  useEffect(() => {
    if (!fromQuotation) return;
    const total = saleServices.filter((i) => i.included).reduce((s, i) => s + (+i.finalPrice || 0), 0);
    setForm((f) => ({ ...f, price: total, netAmountEdited: false }));
  }, [saleServices]);

  // In non-quotation mode: sync form.price with saleProcedures total
  useEffect(() => {
    if (fromQuotation || editing) return;
    const total = saleProcedures.reduce((s, sp) => s + (+sp.qty || 0) * (+sp.price || 0), 0);
    if (total > 0) setForm((f) => ({ ...f, price: total, netAmountEdited: false }));
  }, [saleProcedures]);

  // Auto-calc fee and net when method/brand/installments/price change
  useEffect(() => {
    const rate = getFeeRate(form.paymentMethod, form.cardBrand, form.installments);
    const feeAmt = (rate / 100) * (+form.price || 0);
    setForm((f) => ({
      ...f,
      creditFeeRate: rate,
      netAmount: f.netAmountEdited ? f.netAmount : +(+f.price - feeAmt).toFixed(2),
    }));
  }, [form.paymentMethod, form.cardBrand, form.installments, form.price]);

  // Auto-generate installments preview for pixInstallment
  useEffect(() => {
    if (form.paymentMethod !== "pixInstallment") { setInstallmentsPreview([]); return; }
    const count = +form.installments || 1;
    const total = +form.price || 0;
    const entrada = showEntry ? (+form.downPaymentAmount || 0) : 0;
    const remaining = total - entrada;
    const baseValue = +(remaining / count).toFixed(2);
    const lastValue = +(remaining - baseValue * (count - 1)).toFixed(2);
    const baseDate = form.date ? new Date(form.date + "T12:00:00") : new Date();
    setInstallmentsPreview((prev) => {
      // In edit mode: if existing data matches count, load it once (preserve edits)
      if (editing && editSale.installmentsData?.length === count && prev.length === 0) {
        return editSale.installmentsData.map((item) => ({ ...item }));
      }
      // If count changed or new sale: regenerate
      if (prev.length === count && prev.length > 0) return prev;
      return Array.from({ length: count }, (_, i) => {
        const due = new Date(baseDate);
        due.setMonth(due.getMonth() + i + 1);
        return {
          value: i === count - 1 ? lastValue : baseValue,
          dueDate: due.toISOString().slice(0, 10),
          paid: prev[i]?.paid || false,
        };
      });
    });
  }, [form.paymentMethod, form.installments, form.price, form.date, showEntry, form.downPaymentAmount]);

  function updateInstallmentRow(index, field, value) {
    setInstallmentsPreview((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function saveNewPatient() {
    if (!newPatientName.trim()) return;
    try {
      const created = await db.createPatient({ name: newPatientName.trim(), phone: "", email: "", birthdate: null, notes: "", status: "ok" });
      setPatients((prev) => sortByName([...prev, created]));
      setForm((f) => ({ ...f, patientId: created.id }));
    } catch (e) {
      console.error("Erro ao criar paciente:", e);
    }
    setShowNewPatient(false);
    setNewPatientName("");
  }

  const installmentsSum = installmentsPreview.reduce((s, x) => s + (+x.value || 0), 0);
  const remainingAmount = (+form.price || 0) - (showEntry ? (+form.downPaymentAmount || 0) : 0);
  const sumMismatch = form.paymentMethod === "pixInstallment" && installmentsPreview.length > 0 && Math.abs(installmentsSum - remainingAmount) > 0.01;

  const feeAmt = (+form.price || 0) - (+form.netAmount || 0);
  const netValue = +form.netAmount || 0;

  async function save() {
    if (!form.patientId || !form.price) return;
    if (sumMismatch) return;

    // Build saleServices from saleProcedures (non-quotation) or quotation items
    let svcData, effectiveServiceId, effectivePrice;
    if (fromQuotation) {
      const included = saleServices.filter((i) => i.included);
      svcData = included;
      effectiveServiceId = included[0]?.serviceId || null;
      effectivePrice = included.reduce((s, i) => s + (+i.finalPrice || 0), 0);
    } else {
      const valid = saleProcedures.filter((sp) => sp.serviceId && +sp.qty > 0);
      svcData = valid.map((sp) => {
        const svc = services.find((s) => String(s.id) === String(sp.serviceId));
        return { serviceId: sp.serviceId, serviceName: svc?.name || sp.serviceName, qty: +sp.qty, price: +sp.price, finalPrice: +sp.price };
      });
      effectiveServiceId = svcData[0]?.serviceId || null;
      effectivePrice = +form.price;
    }

    if (!effectiveServiceId && svcData.length === 0) return; // need at least one procedure

    const saleData = {
      ...form,
      patientId: form.patientId,
      serviceId: effectiveServiceId,
      price: effectivePrice,
      installments: +form.installments,
      creditFeeRate: +form.creditFeeRate,
      netAmount: +form.netAmount,
      downPaymentAmount: showEntry ? +form.downPaymentAmount : 0,
      downPaymentMethod: showEntry ? form.downPaymentMethod : "",
      installmentsData: form.paymentMethod === "pixInstallment" ? installmentsPreview : [],
      products: [],
      quotationId: quotationId || null,
      saleServices: svcData,
    };

    if (editing) {
      const updated = {
        ...saleData, id: editSale.id,
        paidInstallments: editSale.paidInstallments,
        appointmentId: editSale.appointmentId,
      };
      setSales((prev) => prev.map((s) => s.id === editSale.id ? updated : s));
      await db.updateSale(updated, []);
    } else {
      const newSaleData = {
        ...saleData,
        paidInstallments: form.paymentMethod === "pixInstallment" ? 0 : +form.installments,
        appointmentId: appointmentId || null,
      };
      const realId = await db.createSale(newSaleData, []);
      setSales((prev) => [...prev, { ...newSaleData, id: realId }]);
      // Check if first procedure needs return
      const firstSvcId = svcData[0]?.serviceId;
      const svc = services.find((s) => String(s.id) === String(firstSvcId));
      const pat = patients.find((p) => String(p.id) === String(form.patientId));
      if (svc?.needsReturn) {
        const appt = { id: appointmentId || null, patientId: form.patientId, serviceId: firstSvcId, date: form.date };
        setPendingReturn({ appointment: appt, service: svc, patient: pat });
      }
    }
    onClose();
  }

  const sortedPatients = sortByName(patients);
  const sortedServices = sortByName(services.filter((s) => s.active));

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{editing ? "Editar Venda" : (appointmentId ? "Realizar Venda" : "Nova Venda")}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">

        {/* Procedimentos do Orçamento */}
        {fromQuotation && (
          <div className="card" style={{ marginBottom: 16, background: T.light }}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: T.teal }}>📋 Procedimentos do Orçamento</div>
            {saleServices.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input type="checkbox" checked={it.included}
                  onChange={(e) => setSaleServices((prev) => prev.map((x, j) => j === i ? { ...x, included: e.target.checked } : x))}
                  style={{ width: 16, height: 16, cursor: "pointer" }} />
                <span style={{ flex: 1, fontSize: 14 }}>{it.serviceName}</span>
                <input type="number" className="form-control" style={{ width: 110 }}
                  value={it.finalPrice}
                  onChange={(e) => setSaleServices((prev) => prev.map((x, j) => j === i ? { ...x, finalPrice: +e.target.value } : x))} />
              </div>
            ))}
            <div style={{ textAlign: "right", fontWeight: 700, marginTop: 8, color: T.teal }}>
              Total: {fmt(saleServices.filter((i) => i.included).reduce((s, i) => s + (+i.finalPrice || 0), 0))}
            </div>
          </div>
        )}

        {/* Paciente */}
        <div className="form-group">
          <label>Paciente</label>
          <SearchSelect
            options={sortedPatients.map((p) => ({ value: p.id, label: p.name }))}
            value={form.patientId}
            onChange={(v) => setForm({ ...form, patientId: v })}
            placeholder="Buscar paciente…"
          />
          {!showNewPatient ? (
            <button type="button" className="btn btn-ghost btn-sm"
              style={{ marginTop: 4, fontSize: 12, padding: "3px 8px" }}
              onClick={() => setShowNewPatient(true)}>+ Novo paciente</button>
          ) : (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input className="form-control" value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Nome do paciente" style={{ flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && saveNewPatient()} />
              <button type="button" className="btn btn-primary btn-sm" onClick={saveNewPatient}>✓</button>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setShowNewPatient(false); setNewPatientName(""); }}>✕</button>
            </div>
          )}
        </div>

        {/* Procedimentos (non-quotation mode) */}
        {!fromQuotation && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: T.grey, fontWeight: 500 }}>Procedimentos</label>
              <button className="btn btn-sm btn-secondary" onClick={() => setSaleProcedures((p) => [...p, { serviceId: "", serviceName: "", qty: "1", price: "" }])}>+ Procedimento</button>
            </div>
            {saleProcedures.map((sp, i) => (
              <div key={i} className="product-row">
                <div style={{ flex: 2 }}>
                  <SearchSelect
                    options={sortedServices.map((s) => ({ value: s.id, label: s.name }))}
                    value={sp.serviceId}
                    onChange={(v) => {
                      const svc = services.find((s) => String(s.id) === String(v));
                      setSaleProcedures((p) => p.map((x, idx) => idx === i ? { ...x, serviceId: String(v), serviceName: svc?.name || "", price: String(svc?.price || x.price) } : x));
                    }}
                    placeholder="Buscar procedimento…"
                  />
                </div>
                <input type="number" className="form-control" placeholder="Qtd" style={{ width: 60 }} min={1} value={sp.qty}
                  onChange={(e) => setSaleProcedures((p) => p.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x))} />
                <input type="number" className="form-control" placeholder="Preço R$" style={{ width: 110 }} step="0.01" value={sp.price}
                  onChange={(e) => setSaleProcedures((p) => p.map((x, idx) => idx === i ? { ...x, price: e.target.value } : x))} />
                {saleProcedures.length > 1 && (
                  <button className="btn btn-sm btn-danger" onClick={() => setSaleProcedures((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Data + Local */}
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Data</label>
            <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Local</label>
            <select className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
              {(locations || []).map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* Valor */}
        <div className="form-group">
          <label>Valor Cobrado (R$) <span style={{ fontSize: 11, color: T.grey, fontWeight: 400 }}>— auto-calculado ou editável</span></label>
          <input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value, netAmountEdited: false })} />
        </div>

        {/* Pagamento principal */}
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Forma de Pagamento</label>
            <select className="form-control" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value, installments: 1, netAmountEdited: false })}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {needsBrand && (
            <div className="form-group">
              <label>Bandeira</label>
              <select className="form-control" value={form.cardBrand} onChange={(e) => setForm({ ...form, cardBrand: e.target.value, netAmountEdited: false })}>
                {CARD_BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          )}
          {needsInstallments && (
            <div className="form-group">
              <label>Parcelas</label>
              <select className="form-control" value={form.installments} onChange={(e) => setForm({ ...form, installments: +e.target.value, netAmountEdited: false })}>
                {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Parcelas preview (pixInstallment) */}
        {form.paymentMethod === "pixInstallment" && installmentsPreview.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: T.grey, fontWeight: 500, marginBottom: 8, display: "block" }}>
              Parcelas — preview editável
            </label>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingBottom: 4, color: T.grey, fontWeight: 500, width: 24 }}>#</th>
                    <th style={{ textAlign: "left", paddingBottom: 4, color: T.grey, fontWeight: 500 }}>Vencimento</th>
                    <th style={{ textAlign: "right", paddingBottom: 4, color: T.grey, fontWeight: 500 }}>Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentsPreview.map((item, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.light}` }}>
                      <td style={{ padding: "6px 0", color: T.grey }}>{i + 1}</td>
                      <td style={{ padding: "6px 4px" }}>
                        <input type="date" className="form-control" style={{ padding: "4px 6px", fontSize: 13 }}
                          value={item.dueDate} onChange={(e) => updateInstallmentRow(i, "dueDate", e.target.value)} />
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right" }}>
                        <input type="number" className="form-control" step="0.01" style={{ padding: "4px 6px", fontSize: 13, textAlign: "right", width: 100 }}
                          value={item.value} onChange={(e) => updateInstallmentRow(i, "value", e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${T.dark}` }}>
                    <td colSpan={2} style={{ paddingTop: 6, fontWeight: 600, fontSize: 13 }}>Total parcelas</td>
                    <td style={{ paddingTop: 6, textAlign: "right", fontWeight: 700, color: sumMismatch ? T.danger : T.success }}>{fmt(installmentsSum)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {sumMismatch && (
              <div style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>
                ⚠️ Soma ({fmt(installmentsSum)}) difere do valor restante ({fmt(remainingAmount)}).
              </div>
            )}
          </div>
        )}

        {/* Entrada (toggle) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: T.teal }}>
            <input type="checkbox" checked={showEntry} onChange={(e) => setShowEntry(e.target.checked)} />
            💵 Registrar entrada
          </label>
          {showEntry && (
            <div className="form-row form-row-2" style={{ marginTop: 10, padding: 12, background: T.light, borderRadius: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Valor da Entrada (R$)</label>
                <input type="number" className="form-control" value={form.downPaymentAmount} onChange={(e) => setForm({ ...form, downPaymentAmount: e.target.value })} placeholder="0,00" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Forma da Entrada</label>
                <select className="form-control" value={form.downPaymentMethod} onChange={(e) => setForm({ ...form, downPaymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Valor Líquido (editável) */}
        <div className="form-group">
          <label>
            Valor Líquido (R$)
            <span style={{ fontSize: 11, color: T.grey, fontWeight: 400, marginLeft: 6 }}>
              {form.creditFeeRate > 0 ? `taxa ${form.creditFeeRate}% calculada automaticamente — ` : ""}editável
            </span>
          </label>
          <input type="number" step="0.01" className="form-control" value={form.netAmount}
            onChange={(e) => setForm({ ...form, netAmount: e.target.value, netAmountEdited: true })}
            style={{ borderColor: form.netAmountEdited ? T.warning : undefined }} />
        </div>

        {/* Resumo */}
        <div className="card" style={{ background: T.light }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📊 Resumo</div>
          <div className="stat-row"><span className="stat-label">Valor cobrado</span><span>{fmt(+form.price || 0)}</span></div>
          {showEntry && +form.downPaymentAmount > 0 && (
            <div className="stat-row"><span className="stat-label">Entrada ({PAYMENT_METHODS.find(m=>m.value===form.downPaymentMethod)?.label})</span><span style={{ color: T.success }}>+{fmt(+form.downPaymentAmount)}</span></div>
          )}
          {feeAmt > 0 && <div className="stat-row"><span className="stat-label">Taxa financeira ({form.creditFeeRate}%)</span><span style={{ color: T.danger }}>-{fmt(feeAmt)}</span></div>}
          <div className="stat-row" style={{ borderTop: `2px solid ${T.dark}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontWeight: 700 }}>Valor líquido recebido</span>
            <span style={{ fontWeight: 700, color: netValue >= 0 ? T.success : T.danger }}>{fmt(netValue)}</span>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        {editing && <span style={{ fontSize: 12, color: T.grey, flex: 1 }}>ℹ️ Editar venda não ajusta estoque automaticamente.</span>}
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={sumMismatch}>{editing ? "Salvar Alterações" : "Salvar Venda"}</button>
      </div>
    </>
  );
}

function PixInstallmentModal({ sale, ctx, onClose }) {
  const { patients, setSales } = ctx;
  const p = patients.find((x) => x.id === sale.patientId);
  const entrada = sale.downPaymentAmount || 0;
  const hasData = sale.installmentsData && sale.installmentsData.length > 0;
  // Legacy: equal value per installment
  const installmentValue = (sale.price - entrada) / sale.installments;
  // New: derived values from installmentsData
  const totalPaid = hasData ? sale.installmentsData.filter((x) => x.paid).length : sale.paidInstallments;
  const pendingBalance = hasData
    ? sale.installmentsData.filter((x) => !x.paid).reduce((s, x) => s + (+x.value || 0), 0)
    : (sale.installments - sale.paidInstallments) * installmentValue;

  // New per-installment toggle
  async function togglePaid(index) {
    const newData = sale.installmentsData.map((item, i) => i === index ? { ...item, paid: !item.paid } : item);
    const newPaidCount = newData.filter((x) => x.paid).length;
    await db.updateInstallmentsData(sale.id, newData);
    setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, installmentsData: newData, paidInstallments: newPaidCount } : s));
  }

  // Legacy sequential pay/unpay
  async function pay() {
    const newPaid = Math.min(sale.installments, sale.paidInstallments + 1);
    await db.registerPixInstallment(sale.id, newPaid);
    setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, paidInstallments: newPaid } : s));
    onClose();
  }
  async function unpay() {
    const newPaid = Math.max(0, sale.paidInstallments - 1);
    await db.registerPixInstallment(sale.id, newPaid);
    setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, paidInstallments: newPaid } : s));
    onClose();
  }

  return (
    <>
      <div className="modal-header"><div className="modal-title">Pix Parcelado — {p?.name}</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="stat-row"><span className="stat-label">Valor total</span><span className="stat-value">{fmt(sale.price)}</span></div>
        <div className="stat-row"><span className="stat-label">Parcelas pagas</span><span className="stat-value">{totalPaid}/{sale.installments}</span></div>
        <div className="stat-row"><span className="stat-label">Saldo pendente</span><span className="stat-value" style={{ color: T.danger }}>{fmt(pendingBalance)}</span></div>
        <hr className="divider" />
        {entrada > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
            <span>Entrada</span><span>{fmt(entrada)}</span>
            <span className="badge badge-ok">✓ Pago</span>
          </div>
        )}
        {hasData ? (
          sale.installmentsData.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.light}`, gap: 8 }}>
              <span style={{ minWidth: 72 }}>Parcela {i + 1}</span>
              <span style={{ fontSize: 12, color: T.grey, flex: 1 }}>{item.dueDate ? fmtDate(item.dueDate) : "—"}</span>
              <span style={{ fontWeight: 600 }}>{fmt(+item.value)}</span>
              <button
                className={`btn btn-sm ${item.paid ? "btn-secondary" : "btn-primary"}`}
                style={{ minWidth: 100 }}
                onClick={() => togglePaid(i)}
              >
                {item.paid ? "✓ Pago" : "Registrar"}
              </button>
            </div>
          ))
        ) : (
          Array.from({ length: sale.installments }, (_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
              <span>Parcela {i + 1}</span><span>{fmt(installmentValue)}</span>
              <span className={`badge ${i < sale.paidInstallments ? "badge-ok" : "badge-warning"}`}>{i < sale.paidInstallments ? "✓ Pago" : "Pendente"}</span>
            </div>
          ))
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        {!hasData && (
          <>
            {sale.paidInstallments > 0 && <button className="btn btn-secondary" onClick={unpay}>↩ Desmarcar</button>}
            {sale.paidInstallments < sale.installments && <button className="btn btn-primary" onClick={pay}>✓ Registrar Pagamento</button>}
          </>
        )}
      </div>
    </>
  );
}

// ─── ATTENDANCE VIEW MODAL ────────────────────────────────────────────────────
function AttendanceViewModal({ appointment, attendance, ctx, onClose }) {
  const { patients, services, products, setAttendances, setAppointments, setProducts } = ctx;
  const patient = patients.find((p) => String(p.id) === String(appointment.patientId));
  const svc = services.find((s) => String(s.id) === String(appointment.serviceId));
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);

  async function undoAttendance() {
    setUndoing(true);
    try {
      await db.deleteAttendance(
        attendance.id,
        attendance.appointmentId,
        attendance.products,
        products
      );
      // Revert products locally
      setProducts((prev) => prev.map((p) => {
        const used = attendance.products?.find((x) => String(x.productId) === String(p.id));
        return used ? { ...p, totalQty: p.totalQty + used.qty } : p;
      }));
      // Revert appointment to scheduled
      setAppointments((prev) => prev.map((a) =>
        String(a.id) === String(attendance.appointmentId) ? { ...a, status: "scheduled" } : a
      ));
      // Remove attendance from state
      setAttendances((prev) => prev.filter((a) => a.id !== attendance.id));
      onClose();
    } catch (e) {
      console.error("Erro ao desfazer atendimento:", e);
      setUndoing(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">👁 Atendimento — {patient?.name}</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="stat-row"><span className="stat-label">Data do agendamento</span><span>{fmtDate(appointment.date)} às {appointment.time}</span></div>
          <div className="stat-row"><span className="stat-label">Procedimento</span><span>{svc?.name || "—"}</span></div>

          {!attendance ? (
            <div className="alert alert-info" style={{ marginTop: 16 }}>Nenhum registro de atendimento encontrado para este agendamento.</div>
          ) : (
            <>
              <div className="stat-row"><span className="stat-label">Data do atendimento</span><span>{fmtDate(attendance.date)}</span></div>
              {attendance.notes && <div className="stat-row"><span className="stat-label">Observações</span><span style={{ fontSize: 13 }}>{attendance.notes}</span></div>}

              {attendance.procedures?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: T.teal }}>📋 Procedimentos Realizados</div>
                  {attendance.procedures.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.light}` }}>
                      <span style={{ fontSize: 13 }}>{p.serviceName || services.find((s) => String(s.id) === String(p.serviceId))?.name || "—"}</span>
                      <span className="badge badge-ok">{p.qtyUsed}x</span>
                    </div>
                  ))}
                </div>
              )}

              {attendance.products?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: T.warning }}>📦 Produtos Utilizados</div>
                  {attendance.products.map((p, i) => {
                    const prod = products.find((x) => String(x.id) === String(p.productId));
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.light}` }}>
                        <span style={{ fontSize: 13 }}>{prod?.name || "—"}{p.note && <span style={{ color: T.grey, fontSize: 11 }}> — {p.note}</span>}</span>
                        <span style={{ fontSize: 13, color: T.dark }}>{p.qty} {prod?.unit || ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!attendance.procedures?.length && !attendance.products?.length) && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>Atendimento registrado sem procedimentos ou produtos.</div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div>
            {attendance && !confirmUndo && (
              <button className="btn btn-danger" onClick={() => setConfirmUndo(true)} disabled={undoing}>
                🗑 Desfazer Atendimento
              </button>
            )}
            {attendance && confirmUndo && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: T.danger }}>
                  {attendance.products?.length > 0 && "⚠️ Os produtos utilizados voltarão ao estoque. "}
                  Confirmar?
                </span>
                <button className="btn btn-sm btn-danger" onClick={undoAttendance} disabled={undoing}>
                  {undoing ? "…" : "✓ Sim"}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmUndo(false)} disabled={undoing}>Não</button>
              </div>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── ATTENDANCE FORM ──────────────────────────────────────────────────────────
function AttendanceForm({ appointment, ctx, onClose }) {
  const { patients, services, products, sales, attendances, setAttendances, setProducts, setAppointments } = ctx;
  const patient = patients.find((p) => String(p.id) === String(appointment.patientId));
  const pendingProcedures = calcPendingProcedures(appointment.patientId, sales, attendances);

  const [procedures, setProcedures] = useState(
    pendingProcedures.map((p) => ({ ...p, qtyToUse: "0" }))
  );
  const [usedProducts, setUsedProducts] = useState([{ productId: "", qty: "", note: "" }]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(appointment.date);
  const [saving, setSaving] = useState(false);

  const sortedProducts = sortByName(products);

  async function save() {
    const procs = procedures.filter((p) => +p.qtyToUse > 0).map((p) => ({
      serviceId: p.serviceId, serviceName: p.serviceName || (services.find((s) => String(s.id) === String(p.serviceId))?.name || ""), qtyUsed: +p.qtyToUse,
    }));
    const prods = usedProducts.filter((p) => p.productId && +p.qty > 0).map((p) => {
      const prod = products.find((x) => String(x.id) === String(p.productId));
      return { productId: p.productId, qty: +p.qty, costAtUse: prod?.avgCost || 0, note: p.note };
    });
    if (procs.length === 0 && prods.length === 0 && !notes) return;
    setSaving(true);
    try {
      const created = await db.createAttendance(
        { appointmentId: appointment.id, patientId: appointment.patientId, date, notes },
        procs, prods, products
      );
      setAttendances((prev) => [created, ...prev]);
      setAppointments((prev) => prev.map((a) => String(a.id) === String(appointment.id) ? { ...a, status: "done" } : a));
      // Update local product state
      for (const p of prods) {
        const prod = products.find((x) => String(x.id) === String(p.productId));
        if (prod) {
          const newQty = Math.max(0, prod.totalQty - p.qty);
          setProducts((prev) => prev.map((x) => String(x.id) === String(prod.id) ? { ...x, totalQty: newQty } : x));
        }
      }
      onClose();
    } catch (e) {
      console.error("Erro ao salvar atendimento:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">⚡ Preenchimento do Atendimento — {patient?.name}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Data do Atendimento</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* Procedimentos Pendentes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: T.teal }}>📋 Procedimentos Pendentes</div>
          {pendingProcedures.length === 0 && (
            <div className="alert alert-info" style={{ display: "block" }}>
              Nenhum procedimento pendente para este paciente. Você ainda pode registrar produtos utilizados.
            </div>
          )}
          {procedures.map((proc, i) => {
            const svcName = proc.serviceName || services.find((s) => String(s.id) === String(proc.serviceId))?.name || "Procedimento";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.light}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{svcName}</div>
                  <div style={{ fontSize: 12, color: T.grey }}>Pendente: <strong>{proc.total}x</strong></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 12, color: T.grey, fontWeight: 500 }}>Qtd realizada:</label>
                  <input type="number" className="form-control" style={{ width: 80 }} min={0} max={proc.total} value={proc.qtyToUse}
                    onChange={(e) => setProcedures((p) => p.map((x, idx) => idx === i ? { ...x, qtyToUse: e.target.value } : x))} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Produtos Utilizados */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.teal }}>📦 Produtos Utilizados</div>
            <button className="btn btn-sm btn-secondary" onClick={() => setUsedProducts((p) => [...p, { productId: "", qty: "", note: "" }])}>+ Produto</button>
          </div>
          {usedProducts.map((up, i) => {
            const prod = products.find((x) => String(x.id) === String(up.productId));
            const overStock = prod && up.qty && +up.qty > prod.totalQty;
            return (
              <div key={i}>
                <div className="product-row">
                  <select className="form-control" value={up.productId} style={{ flex: 2, borderColor: overStock ? T.danger : undefined }}
                    onChange={(e) => setUsedProducts((p) => p.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x))}>
                    <option value="">Selecione produto...</option>
                    {sortedProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.totalQty} {p.unit})</option>)}
                  </select>
                  <input type="number" className="form-control" placeholder="Qtd" style={{ width: 70, borderColor: overStock ? T.danger : undefined }} value={up.qty}
                    onChange={(e) => setUsedProducts((p) => p.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x))} />
                  <input className="form-control" placeholder="Nota opcional" style={{ flex: 1 }} value={up.note}
                    onChange={(e) => setUsedProducts((p) => p.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))} />
                  {usedProducts.length > 1 && (
                    <button className="btn btn-sm btn-danger" onClick={() => setUsedProducts((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                  )}
                </div>
                {overStock && <div style={{ color: T.danger, fontSize: 12, marginTop: 2 }}>Estoque insuficiente — disponível: {prod.totalQty} {prod.unit}</div>}
              </div>
            );
          })}
        </div>

        {/* Observações */}
        <div className="form-group">
          <label>Observações do Atendimento</label>
          <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Evolução, reações, anotações..." />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Salvando…" : "✅ Finalizar Atendimento"}
        </button>
      </div>
    </>
  );
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
function PatientsPage({ ctx }) {
  const { patients, setPatients, sales, services, products, attendances, quotations, appointments, setModal } = ctx;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  function openEditPatient(p) {
    setModal({ content: <PatientForm ctx={ctx} patient={p} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }

  async function deletePatient(p) {
    if (!window.confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await db.deletePatient(p.id);
      setPatients((prev) => prev.filter((x) => x.id !== p.id));
      if (selected?.id === p.id) setSelected(null);
    } catch (e) { console.error("Erro ao excluir paciente:", e); }
  }

  function lastVisit(patientId) {
    const patSales = sales.filter((s) => String(s.patientId) === String(patientId));
    if (patSales.length === 0) return null;
    return patSales.reduce((latest, s) => s.date > latest ? s.date : latest, "");
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortTh({ field, label }) {
    const active = sortField === field;
    return (
      <th onClick={() => toggleSort(field)} style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        {label} <span style={{ opacity: active ? 1 : 0.25, fontSize: 10, marginLeft: 2 }}>{active && sortDir === "desc" ? "▼" : "▲"}</span>
      </th>
    );
  }

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const withMeta = filtered.map((p) => ({ ...p, _lastVisit: lastVisit(p.id) }));
  const sorted = [...withMeta].sort((a, b) => {
    let va = "", vb = "";
    if (sortField === "name") { va = a.name; vb = b.name; }
    else if (sortField === "lastVisit") { va = a._lastVisit || ""; vb = b._lastVisit || ""; }
    const cmp = va.localeCompare(vb, "pt-BR");
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (selected) {
    const patSales = sales.filter((s) => String(s.patientId) === String(selected.id));
    const patQuotations = (quotations || []).filter((q) => String(q.patientId) === String(selected.id));
    const patAppointments = (appointments || []).filter((a) => String(a.patientId) === String(selected.id))
      .slice().sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    const totalSpent = patSales.reduce((s, x) => s + x.price, 0);
    const totalProfit = patSales.reduce((s, x) => s + calcNetValue(x), 0);
    const lastV = lastVisit(selected.id);
    const pendingProcs = calcPendingProcedures(selected.id, sales, attendances || []);
    return (
      <div>
        <div style={{ marginBottom: 16 }}><button className="btn btn-secondary" onClick={() => setSelected(null)}>← Voltar</button></div>
        <div className="grid-3">
          <MetricCard icon="💰" title="Total Gasto" value={fmt(totalSpent)} sub={`${patSales.length} procedimentos`} />
          <MetricCard icon="✅" title="Lucro Gerado" value={fmt(totalProfit)} sub="" color={T.success} />
          <MetricCard icon="🎯" title="Ticket Médio" value={fmt(patSales.length > 0 ? totalSpent / patSales.length : 0)} sub="" />
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div>
              <div className="section-title">{selected.name}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
                <span className="section-sub">{selected.phone}</span>
                {selected.phone && (
                  <WaBtn phone={selected.phone} message={`Olá, ${selected.name.split(" ")[0]}! 😊 Tudo bem? Aqui é a equipe da Clínica Dr. Murilo do Valle.`} label="Contato" />
                )}
              </div>
            </div>
            <span className={`badge badge-${selected.status === "ok" ? "ok" : "late"}`}>{selected.status === "ok" ? "Em dia" : "Pendente"}</span>
          </div>
          {selected.notes && <div className="alert alert-info" style={{ display: "block" }}>📋 {selected.notes}</div>}
          <div className="stat-row"><span className="stat-label">Nascimento</span><span>{selected.birthdate ? fmtDate(selected.birthdate) : "—"}</span></div>
          <div className="stat-row"><span className="stat-label">Último comparecimento</span><span style={{ fontWeight: 600, color: lastV ? T.teal : T.grey }}>{lastV ? fmtDate(lastV) : "Nenhum registro"}</span></div>
          {lastV && (
            <div className="stat-row">
              <span className="stat-label">Há quanto tempo</span>
              <span style={{ color: T.grey }}>
                {Math.round((new Date() - new Date(lastV + "T12:00:00")) / 86400000)} dias atrás
              </span>
            </div>
          )}
        </div>

        {pendingProcs.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: T.warning }}>⏳ Procedimentos Pendentes</div>
            {pendingProcs.map((p, i) => {
              const svcName = p.serviceName || services.find((s) => String(s.id) === String(p.serviceId))?.name || "Procedimento";
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
                  <span>{svcName}</span>
                  <span className="badge badge-warning">{p.total}x pendente</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Histórico de Vendas</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Procedimento(s)</th><th>Valor</th><th>Pagamento</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {patSales.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhuma venda</div></td></tr>}
                {patSales.slice().sort((a, b) => b.date.localeCompare(a.date)).map((s) => {
                  const sv = services.find((x) => String(x.id) === String(s.serviceId));
                  const svcLabel = s.saleServices?.length > 0
                    ? s.saleServices.map((it) => `${it.serviceName}${it.qty > 1 ? ` ×${it.qty}` : ""}`).join(", ")
                    : (sv?.name || "—");
                  const pmLabels = { pix: "Pix", credit: "Crédito", pixInstallment: "Pix Parcelado", cash: "Dinheiro", boleto: "Boleto", debit: "Débito" };
                  const isInstallment = s.paymentMethod === "pixInstallment";
                  const fullyPaid = !isInstallment || (s.paidInstallments >= s.installments);
                  return (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td style={{ fontSize: 13 }}>{svcLabel}</td>
                      <td>{fmt(s.price)}</td>
                      <td style={{ fontSize: 12, color: T.grey }}>{pmLabels[s.paymentMethod] || s.paymentMethod}</td>
                      <td>
                        {fullyPaid
                          ? <span className="badge badge-ok">✓ Pago</span>
                          : <span className="badge badge-warning">⏳ {s.paidInstallments}/{s.installments} parcelas</span>
                        }
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => setModal({ lg: true, content: <SaleDetailModal sale={s} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Orçamentos</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Procedimento(s)</th><th>Total</th><th>Validade</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {patQuotations.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhum orçamento</div></td></tr>}
                {patQuotations.slice().sort((a, b) => b.date.localeCompare(a.date)).map((q) => {
                  const itemsLabel = q.items?.length > 0
                    ? q.items.map((it) => it.serviceName).join(", ")
                    : "—";
                  const statusMap = {
                    pending:  { label: "⏳ Pendente",  cls: "badge-warning" },
                    approved: { label: "✅ Aprovado",  cls: "badge-ok"      },
                    rejected: { label: "❌ Rejeitado", cls: "badge-grey"    },
                  };
                  const st = statusMap[q.status] || statusMap.pending;
                  const isExpired = q.validUntil && q.validUntil < today() && q.status === "pending";
                  return (
                    <tr key={q.id}>
                      <td>{fmtDate(q.date)}</td>
                      <td style={{ fontSize: 13 }}>{itemsLabel}</td>
                      <td>{fmt(q.totalWithDiscount ?? q.total)}</td>
                      <td style={{ fontSize: 12, color: isExpired ? T.danger : T.grey }}>
                        {q.validUntil ? fmtDate(q.validUntil) + (isExpired ? " — vencido" : "") : "—"}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => setModal({ lg: true, content: <QuotationDetailModal quot={q} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Agendamentos</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Hora</th><th>Tipo</th><th>Procedimento</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {patAppointments.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhum agendamento</div></td></tr>}
                {patAppointments.map((a) => {
                  const svc = services.find((x) => String(x.id) === String(a.serviceId));
                  const statusInfo = apptStatusInfo(a);
                  const att = (attendances || []).find((x) => String(x.appointmentId) === String(a.id));
                  return (
                    <tr key={a.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(a.date)}</td>
                      <td>{a.time}</td>
                      <td><span className={`badge ${a.appointmentType === "avaliacao" ? "badge-warning" : "badge-scheduled"}`}>{a.appointmentType === "avaliacao" ? "Avaliação" : "Consulta"}</span></td>
                      <td style={{ fontSize: 13 }}>{svc?.name || "—"}</td>
                      <td><span className={`badge ${statusInfo.badgeClass}`}>{statusInfo.label}</span></td>
                      <td>
                        {a.status === "done" && (
                          <button className="btn btn-sm btn-secondary" onClick={() => setModal({ lg: true, content: <AttendanceViewModal appointment={a} attendance={att} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>👁 Ver</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ content: <PatientForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>+ Novo Paciente</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><SortTh field="name" label="Nome" /><th>Telefone</th><SortTh field="lastVisit" label="Último Comparecimento" /><th>Status</th><th>Aniversário</th><th>Ações</th></tr></thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhum paciente</div></td></tr>}
              {sorted.map((p) => {
                const lv = p._lastVisit;
                const daysAgo = lv ? Math.round((new Date() - new Date(lv + "T12:00:00")) / 86400000) : null;
                const bdSoon = isBirthdaySoon(p.birthdate, 3);
                const bdDays = getDaysUntilBirthday(p.birthdate);
                const recontactMsg = `Olá, ${p.name.split(" ")[0]}! 😊 Faz um tempo que não te vemos por aqui na Clínica Dr. Murilo do Valle. Que tal agendar um horário? Temos novidades para você!`;
                return (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ cursor: "pointer", color: T.teal }} onClick={() => setSelected(p)}>{p.name}</strong>
                      {bdSoon && <span className="badge badge-birthday" style={{ marginLeft: 6 }}>🎂 {bdDays === 0 ? "Hoje!" : bdDays === 1 ? "Amanhã" : `${bdDays}d`}</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {p.phone}
                        {p.phone && <WaBtn phone={p.phone} message={recontactMsg} label="" />}
                      </div>
                    </td>
                    <td>
                      {lv ? (
                        <span style={{ color: daysAgo > 90 ? T.warning : T.grey }}>
                          {fmtDate(lv)} <span style={{ fontSize: 11 }}>({daysAgo}d atrás)</span>
                        </span>
                      ) : <span style={{ color: T.grey }}>—</span>}
                    </td>
                    <td><span className={`badge badge-${p.status === "ok" ? "ok" : "late"}`}>{p.status === "ok" ? "Em dia" : "Pendente"}</span></td>
                    <td style={{ fontSize: 12, color: T.grey }}>{p.birthdate ? fmtDate(p.birthdate) : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditPatient(p)}>✏️ Editar</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelected(p)}>Ver histórico</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deletePatient(p)} title="Excluir paciente">🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PatientForm({ ctx, patient, onClose }) {
  const { setPatients } = ctx;
  const editing = !!patient;
  const [form, setForm] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    birthdate: patient?.birthdate || "",
    notes: patient?.notes || "",
    status: patient?.status || "ok",
  });
  async function save() {
    if (!form.name) return;
    if (editing) {
      const updated = { ...patient, ...form };
      setPatients((prev) => prev.map((p) => p.id === patient.id ? updated : p));
      await db.updatePatient(updated);
    } else {
      const created = await db.createPatient(form);
      setPatients((prev) => sortByName([...prev, created]));
    }
    onClose();
  }
  return (
    <>
      <div className="modal-header"><div className="modal-title">{editing ? "Editar Paciente" : "Novo Paciente"}</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-group"><label>Nome Completo *</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Telefone</label><input className="form-control" placeholder="41999990000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Nascimento</label><input type="date" className="form-control" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} /></div>
        <div className="form-group"><label>Observações Clínicas</label><textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>{editing ? "Salvar" : "Criar Paciente"}</button>
      </div>
    </>
  );
}

// ─── MANUAL EXIT FORM ────────────────────────────────────────────────────────
function ManualExitForm({ ctx, onClose }) {
  const { products, setProducts, manualExits, setManualExits } = ctx;
  const [form, setForm] = useState({ productId: "", qty: "", date: today(), reason: "" });
  const [saving, setSaving] = useState(false);

  const sortedProducts = sortByName(products);

  async function save() {
    if (!form.productId || !form.qty || +form.qty <= 0) return;
    const prod = products.find((p) => String(p.id) === String(form.productId));
    if (!prod) return;
    const newQty = Math.max(0, prod.totalQty - +form.qty);
    setSaving(true);
    try {
      const created = await db.createManualExit({
        productId: form.productId,
        qty: +form.qty,
        reason: form.reason,
        date: form.date,
        newQty,
        avgCost: prod.avgCost,
      });
      setManualExits((prev) => [created, ...prev]);
      setProducts((prev) => prev.map((p) => String(p.id) === String(prod.id) ? { ...p, totalQty: newQty } : p));
      onClose();
    } catch (e) {
      console.error("Erro ao registrar saída:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">↓ Retirada Manual do Estoque</div>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Produto *</label>
            <SearchSelect
              options={sortedProducts.map((p) => ({ value: String(p.id), label: `${p.name} (${p.totalQty} ${p.unit})` }))}
              value={form.productId}
              onChange={(v) => setForm({ ...form, productId: v })}
              placeholder="Selecionar produto…"
            />
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Quantidade *</label>
              <input type="number" className="form-control" min="0.01" step="0.01"
                value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Data *</label>
              <input type="date" className="form-control" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Motivo (opcional)</label>
            <textarea className="form-control" rows={2} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex.: uso interno, extravio, vencimento…" />
          </div>
          {form.productId && form.qty && +form.qty > 0 && (() => {
            const prod = products.find((p) => String(p.id) === String(form.productId));
            if (!prod) return null;
            const after = Math.max(0, prod.totalQty - +form.qty);
            return (
              <div style={{ fontSize: 12, color: after < (prod.minStock || 0) ? T.danger : T.grey, marginTop: 4 }}>
                Estoque após retirada: <strong>{after} {prod.unit}</strong>
                {after < (prod.minStock || 0) && " ⚠️ Abaixo do mínimo!"}
              </div>
            );
          })()}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.productId || !form.qty}>
            {saving ? "Salvando…" : "Registrar Saída"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function StockPage({ ctx }) {
  const { products, stockEntries, setModal, setProducts, setStockEntries, suppliers, setSuppliers,
          attendances, manualExits, setManualExits, patients } = ctx;
  const [tab, setTab] = useState("stock");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [deletingSupId, setDeletingSupId] = useState(null);

  function openNew() { setModal({ content: <ProductForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEditProduct(product) { setModal({ content: <ProductForm ctx={ctx} product={product} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEntry(product) { setModal({ content: <StockEntryModal product={product} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEditEntry(entry) {
    const prod = products.find((p) => p.id === entry.productId);
    if (!prod) return;
    setModal({ content: <StockEntryModal product={prod} ctx={ctx} editEntry={entry} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }

  async function deleteProduct(p) {
    if (!window.confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await db.deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) { console.error(e); }
  }

  async function deleteEntry(entry) {
    if (!window.confirm("Excluir esta compra? O estoque do produto será revertido.")) return;
    try {
      const prod = products.find((p) => p.id === entry.productId);
      await db.deleteStockEntry(entry.id);
      setStockEntries((prev) => prev.filter((e) => e.id !== entry.id));
      if (prod) {
        const newQty = prod.totalQty - entry.qty;
        const newAvg = newQty > 0
          ? (prod.totalQty * prod.avgCost - entry.totalCost) / newQty
          : 0;
        await db.updateProductStock(prod.id, Math.max(0, newQty), Math.max(0, +newAvg.toFixed(4)));
        setProducts((prev) => prev.map((p) => p.id === prod.id
          ? { ...p, totalQty: Math.max(0, newQty), avgCost: Math.max(0, +newAvg.toFixed(4)) }
          : p));
      }
    } catch (e) { console.error(e); }
  }

  async function addSupplier() {
    if (!newSupplierName.trim()) return;
    setSupplierError("");
    setSavingSupplier(true);
    try {
      const created = await db.createSupplier(newSupplierName.trim());
      setSuppliers((prev) => sortByName([...prev, created]));
      setNewSupplierName("");
    } catch (e) {
      console.error(e);
      setSupplierError("Erro ao salvar. Verifique se o nome já existe ou se a tabela foi criada no Supabase.");
    } finally { setSavingSupplier(false); }
  }

  async function deleteSupplier(sup) {
    if (!window.confirm(`Remover fornecedor "${sup.name}"?`)) return;
    try {
      setDeletingSupId(sup.id);
      await db.deleteSupplier(sup.id);
      setSuppliers((prev) => prev.filter((x) => x.id !== sup.id));
    } catch (e) { console.error(e); }
    finally { setDeletingSupId(null); }
  }

  // Build combined exits list
  const attendanceExits = (attendances || []).flatMap((att) =>
    (att.products || []).map((p) => ({
      type: "attendance",
      date: att.date,
      productId: p.productId,
      qty: p.qty,
      note: p.note || "",
      attendance: att,
      patientId: att.patientId,
    }))
  );
  const manualExitsRows = (manualExits || []).map((e) => ({
    type: "manual",
    date: e.date,
    productId: e.productId,
    qty: e.qty,
    note: e.reason || "",
    exitId: e.id,
    exitObj: e,
  }));
  const allExits = [...attendanceExits, ...manualExitsRows]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  async function deleteManualExit(exitObj) {
    const prod = products.find((p) => p.id === exitObj.productId);
    try {
      await db.deleteManualExit(exitObj.id, exitObj.productId, exitObj.qty, prod);
      setManualExits((prev) => prev.filter((e) => e.id !== exitObj.id));
      if (prod) {
        setProducts((prev) => prev.map((p) => p.id === prod.id ? { ...p, totalQty: p.totalQty + exitObj.qty } : p));
      }
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div className="section-header">
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Estoque Atual</button>
          <button className={`tab ${tab === "entries" ? "active" : ""}`} onClick={() => setTab("entries")}>Histórico de Compras</button>
          <button className={`tab ${tab === "suppliers" ? "active" : ""}`} onClick={() => setTab("suppliers")}>Fornecedores</button>
          <button className={`tab ${tab === "exits" ? "active" : ""}`} onClick={() => setTab("exits")}>
            Saídas {allExits.length > 0 && <span className="badge badge-warning" style={{ marginLeft: 4, fontSize: 10 }}>{allExits.length}</span>}
          </button>
        </div>
        {tab === "stock" && <button className="btn btn-primary" onClick={openNew}>+ Novo Produto</button>}
        {tab === "exits" && (
          <button className="btn btn-primary" onClick={() => setModal({ content: <ManualExitForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>
            ↓ Retirada Manual
          </button>
        )}
      </div>
      <div style={{ marginBottom: 20 }} />

      {tab === "stock" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produto</th><th>Unidade</th><th>Estoque</th><th>Mínimo</th><th>Custo Médio</th><th>Valor em Estoque</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sortByName(products).map((p) => {
                  const low = p.totalQty <= p.minStock;
                  const warn = p.totalQty <= p.minStock * 1.5 && !low;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="tag">{p.unit}</span></td>
                      <td style={{ fontWeight: 600, color: low ? T.danger : warn ? T.warning : T.dark }}>{p.totalQty} {p.unit}</td>
                      <td style={{ color: T.grey }}>{p.minStock || "—"}</td>
                      <td style={{ color: T.teal, fontWeight: 600 }}>{fmt(p.avgCost)}</td>
                      <td>{fmt(p.totalQty * p.avgCost)}</td>
                      <td>{low ? <span className="badge badge-late">Crítico</span> : warn ? <span className="badge badge-warning">Baixo</span> : <span className="badge badge-ok">OK</span>}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEditProduct(p)}>✏️</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEntry(p)}>+ Compra</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p)} title="Excluir produto">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "entries" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Qtd Comprada</th><th>Custo Total</th><th>Custo/Unidade</th><th>Fornecedor</th><th></th></tr></thead>
              <tbody>
                {stockEntries.length === 0 && <tr><td colSpan={7}><div className="empty">Nenhuma compra registrada</div></td></tr>}
                {stockEntries.slice().sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                  const prod = products.find((x) => x.id === e.productId);
                  return (
                    <tr key={e.id}>
                      <td>{fmtDate(e.date)}</td><td>{prod?.name}</td>
                      <td>{e.qty} {prod?.unit}</td>
                      <td style={{ color: T.danger }}>{fmt(e.totalCost)}</td>
                      <td style={{ color: T.teal, fontWeight: 600 }}>{fmt(e.costPerUnit)}</td>
                      <td>{e.supplier || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEditEntry(e)}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteEntry(e)} title="Excluir compra">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Fornecedores</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <input className="form-control" placeholder="Nome do fornecedor…" value={newSupplierName}
              onChange={(e) => { setNewSupplierName(e.target.value); setSupplierError(""); }}
              onKeyDown={(e) => e.key === "Enter" && addSupplier()} />
            <button className="btn btn-primary btn-sm" onClick={addSupplier} disabled={savingSupplier}>
              {savingSupplier ? "…" : "+ Adicionar"}
            </button>
          </div>
          {supplierError && <div style={{ color: T.danger, fontSize: 12, marginBottom: 12 }}>{supplierError}</div>}
          {!supplierError && <div style={{ marginBottom: 12 }} />}
          {suppliers.length === 0 && <div className="empty">Nenhum fornecedor cadastrado</div>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {suppliers.map((sup) => (
              <li key={sup.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
                <span>{sup.name}</span>
                <button className="btn btn-sm btn-danger" disabled={deletingSupId === sup.id} onClick={() => deleteSupplier(sup)}>🗑</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "exits" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Tipo</th>
                  <th>Paciente / Motivo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allExits.length === 0 && (
                  <tr><td colSpan={6}><div className="empty">Nenhuma saída registrada</div></td></tr>
                )}
                {allExits.map((exit, i) => {
                  const prod = products.find((p) => String(p.id) === String(exit.productId));
                  const pat = exit.patientId ? patients.find((p) => String(p.id) === String(exit.patientId)) : null;
                  return (
                    <tr key={i}>
                      <td>{fmtDate(exit.date)}</td>
                      <td>{prod?.name || "—"}</td>
                      <td style={{ fontWeight: 600, color: T.danger }}>-{exit.qty} {prod?.unit || ""}</td>
                      <td>
                        {exit.type === "attendance"
                          ? <span className="badge badge-ok" style={{ fontSize: 11 }}>Atendimento</span>
                          : <span className="badge badge-warning" style={{ fontSize: 11 }}>Manual</span>
                        }
                      </td>
                      <td style={{ fontSize: 13, color: T.grey }}>
                        {exit.type === "attendance" ? (pat?.name || "—") : (exit.note || "—")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {exit.type === "attendance" && exit.attendance && (
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => {
                                const appt = (ctx.appointments || []).find((a) => String(a.id) === String(exit.attendance.appointmentId));
                                if (appt) setModal({ lg: true, content: <AttendanceViewModal appointment={appt} attendance={exit.attendance} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
                              }}>
                              👁 Ver
                            </button>
                          )}
                          {exit.type === "manual" && exit.exitObj && (
                            <button className="btn btn-sm btn-danger"
                              onClick={() => deleteManualExit(exit.exitObj)}
                              title="Excluir e reverter estoque">
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductForm({ ctx, product, onClose }) {
  const { setProducts } = ctx;
  const editing = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    unit: product?.unit || "unidade",
    totalQty: product?.totalQty || "",
    avgCost: product?.avgCost || "",
    minStock: product?.minStock ?? "",
  });
  async function save() {
    if (!form.name) return;
    if (editing) {
      const updated = { ...product, name: form.name, unit: form.unit, minStock: +form.minStock || 0 };
      setProducts((prev) => prev.map((p) => p.id === product.id ? updated : p));
      await db.updateProduct(updated);
    } else {
      const created = await db.createProduct({ name: form.name, unit: form.unit, totalQty: +form.totalQty || 0, avgCost: +form.avgCost || 0, minStock: +form.minStock || 0 });
      setProducts((prev) => sortByName([...prev, created]));
    }
    onClose();
  }
  return (
    <>
      <div className="modal-header"><div className="modal-title">{editing ? "Editar Produto" : "Novo Produto"}</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-row form-row-2">
          <div className="form-group"><label>Nome</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group">
            <label>Unidade</label>
            <select className="form-control" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {["unidade", "ml", "ampola", "disparo"].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {editing ? (
          <div className="alert alert-info" style={{ display: "block", marginBottom: 8 }}>ℹ️ Quantidade e custo médio são gerenciados pelas entradas de estoque.</div>
        ) : (
          <div className="form-row form-row-2">
            <div className="form-group"><label>Qtd. Inicial <span style={{ fontWeight: 400, color: "#999" }}>(opcional)</span></label><input type="number" className="form-control" value={form.totalQty} onChange={(e) => setForm({ ...form, totalQty: e.target.value })} /></div>
            <div className="form-group"><label>Custo Médio (R$/{form.unit}) <span style={{ fontWeight: 400, color: "#999" }}>(opcional)</span></label><input type="number" step="0.01" className="form-control" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} /></div>
          </div>
        )}
        <div className="form-group"><label>Estoque Mínimo <span style={{ fontWeight: 400, color: "#999" }}>(opcional)</span></label><input type="number" className="form-control" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>{editing ? "Salvar" : "Criar Produto"}</button>
      </div>
    </>
  );
}

function StockEntryModal({ product, ctx, editEntry, onClose }) {
  const { setProducts, setStockEntries, setSuppliers } = ctx;
  // localSuppliers is initialized from ctx.suppliers at mount time and updated
  // when the user adds a new supplier — avoids the stale-props issue from the
  // modal JSX being stored in state.
  const [localSuppliers, setLocalSuppliers] = useState(ctx.suppliers);
  const editing = !!editEntry;
  const [form, setForm] = useState(
    editing
      ? { qty: String(editEntry.qty), totalCost: String(editEntry.totalCost), supplier: editEntry.supplier || "", date: editEntry.date }
      : { qty: "", totalCost: "", supplier: "", date: today() }
  );
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierErr, setSupplierErr] = useState("");

  // For display calculations
  const cpu = form.qty > 0 && form.totalCost > 0 ? +form.totalCost / +form.qty : null;
  let projectedQty = null, projectedAvg = null;
  if (cpu !== null) {
    if (editing) {
      // Reverse the old entry's contribution, then apply new
      const qtyBase = product.totalQty - editEntry.qty;
      const avgBase = qtyBase > 0 ? (product.totalQty * product.avgCost - editEntry.totalCost) / qtyBase : 0;
      projectedQty = qtyBase + +form.qty;
      projectedAvg = projectedQty > 0 ? (qtyBase * avgBase + +form.totalCost) / projectedQty : 0;
    } else {
      projectedQty = product.totalQty + +form.qty;
      projectedAvg = (product.totalQty * product.avgCost + +form.totalCost) / projectedQty;
    }
  }

  async function addSupplier() {
    if (!newSupplierName.trim()) return;
    setSupplierErr("");
    try {
      const created = await db.createSupplier(newSupplierName.trim());
      // Update both local (for immediate dropdown update) and global ctx
      setLocalSuppliers((prev) => sortByName([...prev, created]));
      setSuppliers((prev) => sortByName([...prev, created]));
      setForm((f) => ({ ...f, supplier: created.name }));
      setNewSupplierName("");
      setShowNewSupplier(false);
    } catch (e) {
      console.error(e);
      setSupplierErr("Erro ao salvar fornecedor.");
    }
  }

  async function save() {
    if (!form.qty || !form.totalCost) return;
    setSaving(true);
    try {
      const cpuVal = +form.totalCost / +form.qty;
      if (editing) {
        const qtyBase = product.totalQty - editEntry.qty;
        const avgBase = qtyBase > 0 ? (product.totalQty * product.avgCost - editEntry.totalCost) / qtyBase : 0;
        const newQty = qtyBase + +form.qty;
        const newAvg = newQty > 0 ? (qtyBase * avgBase + +form.totalCost) / newQty : 0;
        await db.updateStockEntry({ ...editEntry, qty: +form.qty, totalCost: +form.totalCost, costPerUnit: +cpuVal.toFixed(4), supplier: form.supplier, date: form.date });
        await db.updateProductStock(product.id, newQty, +newAvg.toFixed(4));
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, totalQty: newQty, avgCost: +newAvg.toFixed(4) } : p));
        setStockEntries((prev) => prev.map((e) => e.id === editEntry.id ? { ...e, qty: +form.qty, totalCost: +form.totalCost, costPerUnit: +cpuVal.toFixed(4), supplier: form.supplier, date: form.date } : e));
      } else {
        const newQty = product.totalQty + +form.qty;
        const newAvg = (product.totalQty * product.avgCost + +form.totalCost) / newQty;
        const created = await db.createStockEntry({ productId: product.id, qty: +form.qty, totalCost: +form.totalCost, costPerUnit: +cpuVal.toFixed(4), supplier: form.supplier, date: form.date });
        await db.updateProductStock(product.id, newQty, +newAvg.toFixed(4));
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, totalQty: newQty, avgCost: +newAvg.toFixed(4) } : p));
        setStockEntries((prev) => [created, ...prev]);
      }
      onClose();
    } catch (e) { console.error(e); setSaving(false); }
  }

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{editing ? "Editar Compra" : "Registrar Compra"} — {product.name}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="alert alert-info" style={{ display: "block" }}>
          Estoque atual: <strong>{product.totalQty} {product.unit}</strong> · Custo médio: <strong>{fmt(product.avgCost)}</strong>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Qtd ({product.unit})</label><input type="number" className="form-control" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
          <div className="form-group"><label>Custo Total (R$)</label><input type="number" step="0.01" className="form-control" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} /></div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Fornecedor</label>
            <select className="form-control" value={form.supplier}
              onChange={(e) => { if (e.target.value === "__new__") { setShowNewSupplier(true); } else { setForm({ ...form, supplier: e.target.value }); } }}>
              <option value="">— Selecione —</option>
              {localSuppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              <option value="__new__">+ Novo fornecedor…</option>
            </select>
            {showNewSupplier && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input className="form-control" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Nome do fornecedor" style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === "Enter" && addSupplier()} autoFocus />
                <button className="btn btn-primary btn-sm" onClick={addSupplier}>✓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewSupplier(false); setNewSupplierName(""); setSupplierErr(""); }}>✕</button>
              </div>
            )}
            {supplierErr && <div style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{supplierErr}</div>}
          </div>
          <div className="form-group"><label>Data</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        {cpu !== null && (
          <div className="card" style={{ background: T.light }}>
            <div className="stat-row"><span className="stat-label">Custo desta compra</span><span>{fmt(cpu)}/{product.unit}</span></div>
            <div className="stat-row"><span className="stat-label">Novo estoque</span><span>{projectedQty} {product.unit}</span></div>
            <div className="stat-row"><span style={{ fontWeight: 700 }}>Novo custo médio</span><span style={{ fontWeight: 700, color: T.teal }}>{fmt(projectedAvg)}/{product.unit}</span></div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : editing ? "Salvar Alterações" : "Confirmar Compra"}</button>
      </div>
    </>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────
function DeleteServiceModal({ ctx, service, onClose }) {
  const { services, setServices, setAppointments, setSales, setQuotations, setAttendances } = ctx;
  const others = services.filter((s) => s.id !== service.id);
  const [replacementId, setReplacementId] = useState(others[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    const rep = others.find((s) => String(s.id) === String(replacementId));
    if (!rep) return;
    setLoading(true);
    try {
      await db.replaceServiceReferences(service.id, rep.id, rep.name);
      await db.deleteService(service.id);
      // update in-memory state
      setAppointments((prev) => prev.map((a) => a.serviceId === service.id ? { ...a, serviceId: rep.id } : a));
      setSales((prev) => prev.map((s) => {
        const updated = { ...s };
        if (updated.serviceId === service.id) updated.serviceId = rep.id;
        if (Array.isArray(updated.saleServices)) {
          updated.saleServices = updated.saleServices.map((ss) =>
            String(ss.serviceId) === String(service.id) ? { ...ss, serviceId: rep.id, serviceName: rep.name } : ss
          );
        }
        return updated;
      }));
      setQuotations((prev) => prev.map((q) => ({
        ...q,
        items: q.items.map((it) =>
          String(it.serviceId) === String(service.id) ? { ...it, serviceId: rep.id, serviceName: rep.name } : it
        ),
      })));
      setAttendances((prev) => prev.map((a) => ({
        ...a,
        procedures: (a.procedures || []).map((p) =>
          String(p.serviceId) === String(service.id) ? { ...p, serviceId: rep.id, serviceName: rep.name } : p
        ),
      })));
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      onClose();
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">Excluir Procedimento</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-content">Você está excluindo <strong>{service.name}</strong>. Todos os orçamentos, vendas e agendamentos com este procedimento serão atualizados para o substituto.</div>
        </div>
        <div className="form-group">
          <label>Procedimento substituto</label>
          {others.length === 0 ? (
            <div style={{ color: T.danger, fontSize: 13 }}>Não há outros procedimentos disponíveis. Crie outro antes de excluir este.</div>
          ) : (
            <select className="form-control" value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
              {others.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" onClick={confirm} disabled={loading || others.length === 0}>
          {loading ? "Excluindo..." : "Confirmar Exclusão"}
        </button>
      </div>
    </>
  );
}

function ServicesPage({ ctx }) {
  const { services, setModal } = ctx;
  function openNew() { setModal({ content: <ServiceForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEdit(svc) { setModal({ content: <ServiceForm ctx={ctx} service={svc} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openDelete(svc) { setModal({ content: <DeleteServiceModal ctx={ctx} service={svc} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }

  return (
    <div>
      <div className="section-header">
        <div className="section-sub">{services.length} procedimentos</div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Procedimento</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Procedimento</th><th>Duração</th><th>Preço</th><th>Retorno/Retoque</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {sortByName(services).map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.duration} min</td>
                  <td>{fmt(s.price)}</td>
                  <td>{s.needsReturn ? <span className="return-badge">🔄 {s.returnType} em {s.returnDays}d</span> : <span style={{ color: T.grey, fontSize: 12 }}>—</span>}</td>
                  <td><span className={`badge ${s.active ? "badge-ok" : "badge-grey"}`}>{s.active ? "Ativo" : "Inativo"}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>✏️ Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => openDelete(s)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ServiceForm({ ctx, service, onClose }) {
  const { setServices } = ctx;
  const editing = !!service;
  const [form, setForm] = useState({
    name: service?.name || "", price: service?.price || "", duration: service?.duration || 60,
    active: service?.active !== false, needsReturn: service?.needsReturn || false,
    returnType: service?.returnType || "retoque", returnDays: service?.returnDays || 30, returnNote: service?.returnNote || "",
  });

  async function save() {
    if (!form.name) return;
    const data = { ...form, price: +form.price, duration: +form.duration, returnDays: +form.returnDays };
    try {
      if (editing) {
        await db.updateService({ ...service, ...data });
        setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, ...data } : s));
      } else {
        const created = await db.createService(data);
        setServices((prev) => [...prev, created]);
      }
      onClose();
    } catch (e) {
      alert("Erro ao salvar procedimento: " + (e.message || "tente novamente"));
    }
  }

  return (
    <>
      <div className="modal-header"><div className="modal-title">{editing ? "Editar" : "Novo"} Procedimento</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-row form-row-3">
          <div className="form-group" style={{ gridColumn: "span 2" }}><label>Nome</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>Duração (min)</label><input type="number" className="form-control" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Preço Padrão (R$)</label><input type="number" className="form-control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="form-group"><label>Status</label>
            <select className="form-control" value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}>
              <option value="1">Ativo</option><option value="0">Inativo</option>
            </select>
          </div>
        </div>
        <hr className="divider" />
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 14 }}>
          <input type="checkbox" checked={form.needsReturn} onChange={(e) => setForm({ ...form, needsReturn: e.target.checked })} />
          Exige retorno / retoque
        </label>
        {form.needsReturn && (
          <div style={{ background: T.light, borderRadius: 10, padding: 16 }}>
            <div className="form-row form-row-2">
              <div className="form-group"><label>Tipo</label>
                <select className="form-control" value={form.returnType} onChange={(e) => setForm({ ...form, returnType: e.target.value })}>
                  <option value="retoque">Retoque</option><option value="retorno">Retorno</option><option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="form-group"><label>Prazo (dias)</label><input type="number" className="form-control" value={form.returnDays} onChange={(e) => setForm({ ...form, returnDays: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Observação</label><input className="form-control" value={form.returnNote} onChange={(e) => setForm({ ...form, returnNote: e.target.value })} /></div>
          </div>
        )}
        {editing && <div className="alert alert-info" style={{ marginTop: 12, display: "block" }}>ℹ️ Edições não afetam vendas já registradas.</div>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>{editing ? "Salvar" : "Criar Procedimento"}</button>
      </div>
    </>
  );
}

// ─── COSTS ────────────────────────────────────────────────────────────────────
function CostsPage({ ctx }) {
  const { costs, setCosts, setModal } = ctx;
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? costs : costs.filter((c) => c.type === tab);
  const total = filtered.reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="section-header">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[["all", "Todos"], ["fixed", "Fixos"], ["variable", "Variáveis"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ content: <CostForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) })}>+ Novo Custo</button>
      </div>
      <div style={{ marginBottom: 20 }} />
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <MetricCard icon="📊" title="Total Filtrado" value={fmt(total)} sub="" />
        <MetricCard icon="🧾" title="Total Geral" value={fmt(costs.reduce((s, c) => s + c.amount, 0))} sub="" />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Descrição</th><th>Tipo</th><th>Frequência</th><th>Valor</th><th>Data</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><span className={`badge ${c.type === "fixed" ? "badge-info" : "badge-warning"}`}>{c.type === "fixed" ? "Fixo" : "Variável"}</span></td>
                  <td>{c.frequency === "monthly" ? "Mensal" : c.frequency === "weekly" ? "Semanal" : "Único"}</td>
                  <td style={{ fontWeight: 600, color: T.danger }}>{fmt(c.amount)}</td>
                  <td>{fmtDate(c.date)}</td>
                  <td><button className="btn btn-sm btn-danger" onClick={() => setCosts((prev) => prev.filter((x) => x.id !== c.id))}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CostForm({ ctx, onClose }) {
  const { setCosts } = ctx;
  const [form, setForm] = useState({ name: "", type: "fixed", amount: "", frequency: "monthly", date: today() });
  function save() {
    if (!form.name || !form.amount) return;
    setCosts((prev) => [...prev, { id: Date.now(), ...form, amount: +form.amount }]);
    onClose();
  }
  return (
    <>
      <div className="modal-header"><div className="modal-title">Novo Custo</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="form-group"><label>Descrição</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row form-row-3">
          <div className="form-group"><label>Tipo</label><select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="fixed">Fixo</option><option value="variable">Variável</option></select></div>
          <div className="form-group"><label>Frequência</label><select className="form-control" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="once">Único</option></select></div>
          <div className="form-group"><label>Valor (R$)</label><input type="number" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Data</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}


// ─── MONTHLY CHART ────────────────────────────────────────────────────────────
function MonthlyChart({ sales, costs, attendances = [] }) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 7);
  const defaultTo = now.toISOString().slice(0, 7);

  const [fromMonth, setFromMonth] = useState(defaultFrom);
  const [toMonth, setToMonth] = useState(defaultTo);
  const [hovered, setHovered] = useState(null);
  const [visibleLines, setVisibleLines] = useState({ revenue: true, netProfit: true, opCosts: true, clients: true, avgTicket: false });

  // Build months in selected range
  const months = [];
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  let cy = fy, cm = fm;
  while (cy < ty || (cy === ty && cm <= tm)) {
    const key = `${cy}-${String(cm).padStart(2, "0")}`;
    const label = new Date(cy, cm - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const mSales = sales.filter((s) => s.date.startsWith(key));
    const mCosts = costs.filter((c) => c.date.startsWith(key));
    const mAtts = attendances.filter((a) => a.date?.startsWith(key));
    const revenue = mSales.reduce((s, x) => s + x.price, 0);
    const productCost = mAtts.reduce((sum, a) => sum + (a.products || []).reduce((s, p) => s + p.qty * p.costAtUse, 0), 0);
    const fees = mSales.reduce((s, x) => s + (x.paymentMethod === "credit" ? (x.creditFeeRate / 100) * x.price : 0), 0);
    const opCosts = mCosts.reduce((s, c) => s + c.amount, 0);
    const netProfit = revenue - productCost - fees - opCosts;
    const clients = new Set(mSales.map((s) => s.patientId)).size;
    const avgTicket = mSales.length > 0 ? revenue / mSales.length : 0;
    months.push({ key, label, revenue, netProfit, opCosts: opCosts + productCost + fees, clients, avgTicket });
    cm++;
    if (cm > 12) { cm = 1; cy++; }
  }

  const display = months;

  const maxVal = Math.max(...display.map((m) => Math.max(m.revenue, Math.abs(m.netProfit), m.opCosts)), 1) * 1.15;
  const maxClients = Math.max(...display.map((m) => m.clients), 1);

  const W = 100 / display.length;
  const chartH = 180;

  function pct(v) { return Math.max(0, (v / maxVal) * chartH); }
  function pctC(v) { return Math.max(0, (v / maxClients) * chartH); }

  const LINES = [
    { key: "revenue", label: "Faturamento", color: T.blue },
    { key: "netProfit", label: "Lucro Líquido", color: T.success },
    { key: "opCosts", label: "Despesas", color: T.danger },
    { key: "clients", label: "Clientes", color: T.warning, isClients: true },
    { key: "avgTicket", label: "Ticket Médio", color: "#f59e0b" },
  ];

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="section-title">📈 Evolução Mensal</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: T.grey }}>De</span>
            <input type="month" value={fromMonth} max={toMonth} onChange={(e) => setFromMonth(e.target.value)}
              style={{ fontSize: 12, padding: "3px 6px", border: `1.5px solid #D5E5EE`, borderRadius: 6, color: T.dark, background: "white", outline: "none" }} />
            <span style={{ fontSize: 12, color: T.grey }}>até</span>
            <input type="month" value={toMonth} min={fromMonth} onChange={(e) => setToMonth(e.target.value)}
              style={{ fontSize: 12, padding: "3px 6px", border: `1.5px solid #D5E5EE`, borderRadius: 6, color: T.dark, background: "white", outline: "none" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {LINES.map((l) => (
            <label key={l.key} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, fontWeight: 500, color: visibleLines[l.key] ? T.dark : T.grey }}>
              <input type="checkbox" checked={visibleLines[l.key]} onChange={() => setVisibleLines((v) => ({ ...v, [l.key]: !v[l.key] }))} />
              <span style={{ display: "inline-block", width: 12, height: 3, background: l.color, borderRadius: 2 }} />
              {l.label}
            </label>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ position: "relative", height: chartH + 70, overflowX: "auto" }}>
        <div style={{ position: "relative", height: chartH, marginTop: 20, display: "flex", alignItems: "flex-end", gap: 0, borderBottom: `2px solid ${T.light}`, minWidth: 400 }}>
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <div key={f} style={{ position: "absolute", left: 0, right: 0, bottom: chartH * f, borderTop: `1px dashed ${T.light}`, pointerEvents: "none" }}>
              <span style={{ position: "absolute", right: 0, top: -9, fontSize: 9, color: T.grey }}>{fmt(maxVal * f)}</span>
            </div>
          ))}

          {display.map((m, i) => (
            <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", height: "100%" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>

              {/* Hover highlight */}
              {hovered === i && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(79,140,151,0.06)", borderRadius: 4, pointerEvents: "none" }} />
              )}

              {/* Bars for revenue + opCosts */}
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: "100%", paddingBottom: 0 }}>
                {visibleLines.revenue && (
                  <div style={{ width: 12, background: T.blue, borderRadius: "3px 3px 0 0", height: pct(m.revenue), opacity: 0.85, transition: "height 0.3s" }} title={`Faturamento: ${fmt(m.revenue)}`} />
                )}
                {visibleLines.opCosts && (
                  <div style={{ width: 12, background: T.danger, borderRadius: "3px 3px 0 0", height: pct(m.opCosts), opacity: 0.75, transition: "height 0.3s" }} title={`Despesas: ${fmt(m.opCosts)}`} />
                )}
                {visibleLines.netProfit && (
                  <div style={{ width: 12, background: m.netProfit >= 0 ? T.success : T.danger, borderRadius: "3px 3px 0 0", height: pct(Math.abs(m.netProfit)), opacity: m.netProfit >= 0 ? 0.9 : 0.4, transition: "height 0.3s", border: m.netProfit < 0 ? `2px dashed ${T.danger}` : "none" }} title={`Lucro: ${fmt(m.netProfit)}`} />
                )}
                {visibleLines.avgTicket && (
                  <div style={{ width: 12, background: "#f59e0b", borderRadius: "3px 3px 0 0", height: pct(m.avgTicket || 0), opacity: 0.8, transition: "height 0.3s" }} title={`Ticket Médio: ${fmt(m.avgTicket)}`} />
                )}
              </div>

              {/* Clients dot + label */}
              {visibleLines.clients && m.clients > 0 && (
                <>
                  <div style={{ position: "absolute", bottom: pctC(m.clients) - 4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: T.warning, border: `2px solid white`, zIndex: 2 }} title={`Clientes: ${m.clients}`} />
                  <div style={{ position: "absolute", bottom: pctC(m.clients) + 8, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: T.warning, fontWeight: 700, whiteSpace: "nowrap", zIndex: 2 }}>{m.clients}</div>
                </>
              )}

              {/* Tooltip — positioned above short bars, inside chart for tall bars */}
              {hovered === i && (() => {
                const maxBarH = Math.max(
                  visibleLines.revenue ? pct(m.revenue) : 0,
                  visibleLines.opCosts ? pct(m.opCosts) : 0,
                  visibleLines.netProfit ? pct(Math.abs(m.netProfit)) : 0,
                  visibleLines.avgTicket ? pct(m.avgTicket || 0) : 0,
                );
                const tooltipInside = maxBarH > chartH * 0.6;
                return (
                  <div style={{ position: "absolute", ...(tooltipInside ? { top: 4, bottom: "auto" } : { bottom: "calc(100% + 6px)", top: "auto" }), left: "50%", transform: "translateX(-50%)", background: T.dark, color: "white", borderRadius: 8, padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap", zIndex: 10, lineHeight: 1.7, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                    {visibleLines.revenue && <div>💰 Faturamento: <strong>{fmt(m.revenue)}</strong></div>}
                    {visibleLines.netProfit && <div style={{ color: m.netProfit >= 0 ? "#6FCF97" : "#EB5757" }}>✅ Lucro: <strong>{fmt(m.netProfit)}</strong></div>}
                    {visibleLines.opCosts && <div style={{ color: "#EB8057" }}>📦 Despesas: <strong>{fmt(m.opCosts)}</strong></div>}
                    {visibleLines.clients && <div style={{ color: "#F2C94C" }}>👤 Clientes: <strong>{m.clients}</strong></div>}
                    {visibleLines.avgTicket && <div style={{ color: "#f59e0b" }}>🎯 Ticket Médio: <strong>{fmt(m.avgTicket)}</strong></div>}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        {/* X axis labels */}
        <div style={{ display: "flex", marginTop: 6, minWidth: 400 }}>
          {display.map((m) => (
            <div key={m.key} style={{ flex: 1, textAlign: "center", fontSize: 11, color: T.grey, textTransform: "capitalize" }}>{m.label}</div>
          ))}
        </div>
      </div>

      {/* Averages row */}
      {(() => {
        const active = display.filter((m) => m.revenue > 0 || m.opCosts > 0);
        if (active.length === 0) return null;
        const n = active.length;
        const avgRevenue    = active.reduce((s, m) => s + m.revenue, 0) / n;
        const avgProfit     = active.reduce((s, m) => s + m.netProfit, 0) / n;
        const avgCosts      = active.reduce((s, m) => s + m.opCosts, 0) / n;
        const avgClients    = active.reduce((s, m) => s + m.clients, 0) / n;
        const avgTicketAvg  = active.reduce((s, m) => s + (m.avgTicket || 0), 0) / n;
        return (
          <div style={{ display: "flex", gap: 20, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.light}`, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.grey, fontWeight: 600 }}>Média / mês:</span>
            {visibleLines.revenue   && <span style={{ color: T.blue, fontSize: 12 }}>💰 {fmt(avgRevenue)}</span>}
            {visibleLines.netProfit && <span style={{ color: avgProfit >= 0 ? T.success : T.danger, fontSize: 12 }}>✅ {fmt(avgProfit)}</span>}
            {visibleLines.opCosts   && <span style={{ color: T.danger, fontSize: 12 }}>📦 {fmt(avgCosts)}</span>}
            {visibleLines.clients   && <span style={{ color: T.warning, fontSize: 12 }}>👤 {avgClients % 1 === 0 ? avgClients : avgClients.toFixed(1)} clientes</span>}
            {visibleLines.avgTicket && <span style={{ color: "#f59e0b", fontSize: 12 }}>🎯 {fmt(avgTicketAvg)}</span>}
          </div>
        );
      })()}
    </div>
  );
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────
function FinancePage({ ctx }) {
  const { sales, costs, services, products, attendances } = ctx;
  const [month, setMonth] = useState(today().slice(0, 7));

  const mSales = sales.filter((s) => s.date.startsWith(month));
  const mCosts = costs.filter((c) => c.date.startsWith(month));
  const mAttendances = (attendances || []).filter((a) => a.date?.startsWith(month));

  const totalRevenue = mSales.reduce((s, x) => s + x.price, 0);
  // Product cost now comes from attendance_products (actual usage), not sale_products
  const totalProductCost = mAttendances.reduce((sum, a) =>
    sum + (a.products || []).reduce((s, p) => s + p.qty * p.costAtUse, 0), 0
  );
  const totalFees = mSales.reduce((s, x) => s + (x.paymentMethod === "credit" ? (x.creditFeeRate / 100) * x.price : 0), 0);
  const grossProfit = totalRevenue - totalProductCost - totalFees;
  const totalCosts = mCosts.reduce((s, c) => s + c.amount, 0);
  const netProfit = grossProfit - totalCosts;
  const avgTicket = mSales.length > 0 ? totalRevenue / mSales.length : 0;

  // Top services: count from saleServices (multi-procedure) + fallback to serviceId
  const svcCount = {};
  mSales.forEach((s) => {
    if (s.saleServices?.length > 0) {
      s.saleServices.forEach((sv) => {
        const key = String(sv.serviceId || sv.serviceName);
        svcCount[key] = (svcCount[key] || { name: sv.serviceName, count: 0 });
        svcCount[key].count += (sv.qty || 1);
      });
    } else if (s.serviceId) {
      const key = String(s.serviceId);
      svcCount[key] = svcCount[key] || { name: services.find((x) => String(x.id) === key)?.name || "—", count: 0 };
      svcCount[key].count += 1;
    }
  });
  const topServices = Object.values(svcCount).sort((a, b) => b.count - a.count).slice(0, 5);

  const byPayment = {};
  mSales.forEach((s) => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.price; });
  const payLabel = { pix: "Pix", credit: "Crédito", pixInstallment: "Pix Parcelado", cash: "Dinheiro" };

  // Top products from attendance_products (actual usage)
  const prodConsumption = {};
  mAttendances.forEach((a) => {
    (a.products || []).forEach((sp) => {
      const key = String(sp.productId);
      prodConsumption[key] = (prodConsumption[key] || 0) + sp.qty;
    });
  });
  const topProducts = Object.entries(prodConsumption).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, qty]) => { const p = products.find((x) => String(x.id) === id); return { name: p?.name || "—", qty, unit: p?.unit || "" }; });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: T.grey, fontWeight: 500 }}>Mês (detalhes):</label>
        <input type="month" className="form-control" style={{ width: 200 }} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <MonthlyChart sales={sales} costs={costs} attendances={attendances || []} />
      <div className="grid-4">
        <MetricCard icon="💰" title="Faturamento" value={fmt(totalRevenue)} sub={`${mSales.length} vendas`} />
        <MetricCard icon="📦" title="Custo Produtos" value={fmt(totalProductCost)} sub="produtos usados em atendimentos" color={T.danger} />
        <MetricCard icon="✅" title="Lucro Bruto" value={fmt(grossProfit)} sub="após produtos e taxas" color={grossProfit >= 0 ? T.success : T.danger} />
        <MetricCard icon="🏆" title="Lucro Líquido" value={fmt(netProfit)} sub="após operacional" color={netProfit >= 0 ? T.success : T.danger} />
        <MetricCard icon="🎯" title="Ticket Médio" value={fmt(avgTicket)} sub={`${mSales.length} atendimentos no mês`} color="#f59e0b" />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>📊 DRE Simplificado</div>
          <div className="stat-row"><span className="stat-label">Faturamento bruto</span><span className="stat-value">{fmt(totalRevenue)}</span></div>
          <div className="stat-row"><span className="stat-label">(-) Custo de produtos usados</span><span className="stat-value" style={{ color: T.danger }}>-{fmt(totalProductCost)}</span></div>
          <div className="stat-row"><span className="stat-label">(-) Taxas financeiras</span><span className="stat-value" style={{ color: T.danger }}>-{fmt(totalFees)}</span></div>
          <div className="stat-row"><span style={{ fontWeight: 700 }}>= Lucro Bruto</span><span className="stat-value" style={{ fontWeight: 700, color: grossProfit >= 0 ? T.success : T.danger }}>{fmt(grossProfit)}</span></div>
          <div className="stat-row"><span className="stat-label">(-) Custos operacionais</span><span className="stat-value" style={{ color: T.danger }}>-{fmt(totalCosts)}</span></div>
          <div className="stat-row" style={{ paddingTop: 12, borderTop: `2px solid ${T.dark}` }}>
            <span style={{ fontWeight: 700 }}>= Lucro Líquido</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: netProfit >= 0 ? T.success : T.danger }}>{fmt(netProfit)}</span>
          </div>
          <div className="stat-row"><span className="stat-label">Ticket médio</span><span className="stat-value">{fmt(avgTicket)}</span></div>
          <div className="stat-row"><span className="stat-label">Margem líquida</span><span className="stat-value">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</span></div>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>🏅 Top Procedimentos</div>
          {topServices.length === 0 ? <div className="empty">Sem dados</div> : topServices.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
              <span style={{ fontSize: 14 }}>#{i + 1} {s.name}</span><span className="badge badge-info">{s.count}x</span>
            </div>
          ))}
          {topServices.length === 0 && mSales.length > 0 && <div style={{ fontSize: 12, color: T.grey, marginTop: 4 }}>Registre atendimentos com procedimentos para ver dados.</div>}
          <hr className="divider" />
          <div className="section-title" style={{ marginBottom: 12 }}>📦 Produtos Mais Consumidos</div>
          {topProducts.length === 0 ? <div className="empty" style={{ padding: "10px 0" }}>Sem dados</div> : topProducts.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
              <span style={{ fontSize: 14 }}>#{i + 1} {p.name}</span><span className="badge badge-grey">{p.qty} {p.unit}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>💳 Receita por Pagamento</div>
          {Object.entries(byPayment).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="stat-row"><span className="stat-label">{payLabel[k] || k}</span><span className="stat-value">{fmt(v)}</span></div>
          ))}
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>🧾 Custos do Mês</div>
          {mCosts.length === 0 && <div className="empty">Nenhum custo neste mês</div>}
          {mCosts.map((c) => (
            <div key={c.id} className="stat-row">
              <span className="stat-label">{c.name} <span className={`badge ${c.type === "fixed" ? "badge-info" : "badge-warning"}`} style={{ marginLeft: 4 }}>{c.type === "fixed" ? "Fixo" : "Var."}</span></span>
              <span className="stat-value" style={{ color: T.danger }}>{fmt(c.amount)}</span>
            </div>
          ))}
          {mCosts.length > 0 && <div className="stat-row" style={{ borderTop: `2px solid ${T.dark}`, paddingTop: 10 }}><span style={{ fontWeight: 700 }}>TOTAL</span><span style={{ fontWeight: 700, color: T.danger }}>{fmt(totalCosts)}</span></div>}
        </div>
      </div>
    </div>
  );
}

// ─── PDF HELPER ───────────────────────────────────────────────────────────────
function fmtDateLong(d) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function buildQuotationTemplate(quot, patient) {
  const C1 = "#1B4B56";
  const C2 = "#368E99";
  const DARK = "#112933";

  const options = quot.options || [];
  const multipleOptions = options.length > 1;

  // Helper: render a single item row
  function itemRow(item) {
    return `
      <div style="padding:14px 0;border-bottom:1px solid #e5eef0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="font-size:14px;font-weight:400;color:${DARK};line-height:1.5;flex:1;padding-right:20px;">${item.serviceName}</div>
          <div style="font-size:14px;font-weight:600;color:${DARK};white-space:nowrap;">${fmt(item.price)}</div>
        </div>
        ${item.note ? `<div style="font-size:12px;color:#888;margin-top:4px;">${item.note}</div>` : ""}
      </div>
    `;
  }

  let bodyContent;

  if (!multipleOptions) {
    // ── Single option: render exactly as before ──
    const opt = options[0] || { items: [], discount: 0 };
    const itemsHtml = opt.items.map(itemRow).join("");
    const optSubtotal = opt.items.reduce((s, it) => s + (+it.price || 0), 0);
    const optTotal = opt.items.reduce((s, it) => s + (+it.finalPrice || 0), 0);
    const discountHtml = opt.discount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#777;margin-bottom:6px;">
        <span>Subtotal</span><span>${fmt(optSubtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#2e9e6b;margin-bottom:10px;">
        <span>Desconto</span><span>-${fmt(opt.discount)}</span>
      </div>
    ` : "";

    bodyContent = `
      <div style="margin-bottom:20px;">${itemsHtml}</div>
      <div style="padding-top:8px;">
        ${discountHtml}
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:15px;font-weight:700;color:${C1};">Seu Investimento</span>
          <span style="font-size:18px;font-weight:700;color:${C1};">${fmt(optTotal)}</span>
        </div>
      </div>
    `;
  } else {
    // ── Multiple options: render each as a labeled block, no grand total ──
    const optionsHtml = options.map((opt) => {
      const optSubtotal = opt.items.reduce((s, it) => s + (+it.price || 0), 0);
      const optTotal = opt.items.reduce((s, it) => s + (+it.finalPrice || 0), 0);
      const itemsHtml = opt.items.map(itemRow).join("");
      const discountHtml = opt.discount > 0 ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#777;margin-top:6px;margin-bottom:2px;">
          <span>Subtotal</span><span>${fmt(optSubtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#2e9e6b;margin-bottom:4px;">
          <span>Desconto</span><span>-${fmt(opt.discount)}</span>
        </div>
      ` : "";

      return `
        <div data-option-block style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:${C1};letter-spacing:0.5px;padding-bottom:6px;margin-bottom:2px;border-bottom:2px solid ${C1};">
            ${opt.label}
          </div>
          ${itemsHtml}
          <div style="padding-top:6px;text-align:right;">
            ${discountHtml}
            <span style="font-size:14px;font-weight:700;color:${C1};">Total: ${fmt(optTotal)}</span>
          </div>
        </div>
      `;
    }).join("");

    bodyContent = `<div style="margin-bottom:8px;">${optionsHtml}</div>`;
  }

  const expiryDate = (() => {
    const base = quot.validUntil || quot.date;
    if (!base) return null;
    const d = new Date(base + "T12:00:00");
    if (!quot.validUntil) d.setDate(d.getDate() + 5);
    return fmtDate(d.toISOString().slice(0, 10));
  })();
  const validUntilBadge = expiryDate
    ? `<div style="display:inline-block;background:#e8f4f5;color:${C1};border:1px solid ${C2};border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;margin-bottom:20px;">⏰ Proposta válida até ${expiryDate}</div>`
    : "";

  return `
    <div style="
      width:794px;background:transparent;position:relative;
      font-family:'Josefin Sans',sans-serif;box-sizing:border-box;
    ">

      <!-- HEADER -->
      <div style="position:relative;z-index:1;padding:32px 56px 0 56px;">
        <div style="text-align:center;margin-bottom:18px;">
          <img src="/pdf-assets/logo.png" crossorigin="anonymous" style="width:320px;height:auto;display:inline-block;" />
        </div>
        <div style="text-align:right;line-height:1.7;">
          <div style="font-size:12px;color:${C2};font-weight:600;">+55 41 98836-6745</div>
          <div style="font-size:11px;color:${DARK};">Av. República Argentina, 2056,</div>
          <div style="font-size:11px;color:${DARK};">Sala 72 - Água Verde Curitiba &bull; PR</div>
        </div>
      </div>

      <!-- Separator -->
      <div style="position:relative;z-index:1;margin:18px 0 0 0;">
        <img src="/pdf-assets/separator.png" crossorigin="anonymous" style="width:100%;height:3px;display:block;" />
      </div>

      <!-- BODY -->
      <div style="position:relative;z-index:1;padding:40px 56px 40px 56px;">
        <div style="font-size:17px;font-weight:700;color:${DARK};margin-bottom:8px;line-height:1.3;">
          Proposta de Tratamento
        </div>
        ${validUntilBadge}
        <div style="font-size:13px;color:${DARK};margin-bottom:24px;line-height:1.7;">
          Prezado(a) <strong>${patient?.name || ""}</strong>,<br/>
          Segue abaixo a proposta de tratamento elaborada especialmente para você.
        </div>
        ${bodyContent}
        <div style="margin-top:28px;font-size:13px;color:${DARK};">
          Curitiba, ${fmtDateLong(quot.date)}
        </div>
      </div>
    </div>
  `;
}

function buildQuotationFooter() {
  const C1 = "#1B4B56";
  const C2 = "#368E99";
  return `
    <div style="width:794px;background:#fff;font-family:'Josefin Sans',sans-serif;box-sizing:border-box;">
      <div style="text-align:center;font-size:11px;color:${C2};margin-bottom:16px;line-height:1.7;padding-top:16px;">
        Qualquer dúvida, entre em contato com:<br/>
        <strong style="font-size:13px;">+55 41 98836-6745</strong>
      </div>
      <div style="text-align:center;padding:0 56px 0 56px;margin-bottom:16px;">
        <div style="border-top:1px solid #b0c4c9;width:380px;margin:0 auto 14px auto;"></div>
        <div style="font-size:15px;font-weight:700;color:${C1};letter-spacing:1px;">DR. MURILO DO VALLE</div>
        <div style="font-size:13px;color:${C2};margin-top:4px;font-weight:600;">CRO 30342</div>
      </div>
      <img src="/pdf-assets/separator.png" crossorigin="anonymous" style="width:100%;height:3px;display:block;" />
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;">
        <img src="/pdf-assets/icon-ig.png" crossorigin="anonymous" style="width:22px;height:22px;object-fit:contain;" />
        <span style="font-size:12px;color:${C2};font-weight:600;">drmurilodovalle</span>
      </div>
    </div>
  `;
}

async function generateQuotationPDF(quot, patient) {
  const scale = 2;
  const A4_W = 794;
  const A4_H = 1122;
  const TOP_PAD_PX = 120 * scale; // ~2 dedos de margem no topo das páginas 2+
  const FOOTER_BUFFER_PX = 48 * scale; // espaço extra acima do rodapé para não colar

  // Render content (header + body, no footer)
  const contentEl = document.createElement("div");
  contentEl.style.cssText = "position:fixed;top:-99999px;left:-99999px;z-index:-1;width:794px;";
  contentEl.innerHTML = buildQuotationTemplate(quot, patient);
  document.body.appendChild(contentEl);

  // Render footer separately
  const footerEl = document.createElement("div");
  footerEl.style.cssText = "position:fixed;top:-99999px;left:-99999px;z-index:-1;width:794px;";
  footerEl.innerHTML = buildQuotationFooter();
  document.body.appendChild(footerEl);

  try {
    await document.fonts.ready;

    // Collect option-block start positions (canvas coords) to avoid orphaned headers
    const contentContainer = contentEl.firstElementChild;
    const containerTop = contentContainer.getBoundingClientRect().top;
    const optionBlockEls = Array.from(contentContainer.querySelectorAll("[data-option-block]"));
    const blockStartsPx = optionBlockEls.map((el) => (el.getBoundingClientRect().top - containerTop) * scale);

    // Load watermark image to draw on every page
    const watermarkImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/pdf-assets/decor.png";
    });

    const [contentCanvas, footerCanvas] = await Promise.all([
      html2canvas(contentEl.firstElementChild, { scale, useCORS: true, backgroundColor: null, width: A4_W }),
      html2canvas(footerEl.firstElementChild, { scale, useCORS: true, backgroundColor: null, width: A4_W }),
    ]);

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    const A4_H_PX = A4_H * scale;
    const footerH = footerCanvas.height;
    const usableH = A4_H_PX - footerH - FOOTER_BUFFER_PX; // content area per page (buffer before footer)

    // Build page slices accounting for top padding on pages 2+
    // Also avoid cutting just after an option-block header (orphan prevention)
    const ORPHAN_ZONE_PX = 90 * scale; // if header falls in last 90px of page, push to next
    const pages = [];
    let srcY = 0;
    while (srcY < contentCanvas.height) {
      const topPad = pages.length > 0 ? TOP_PAD_PX : 0;
      const availH = usableH - topPad;
      let sliceEnd = srcY + availH;

      if (sliceEnd < contentCanvas.height) {
        // Check if any option-block header would be orphaned near the bottom of this slice
        for (const bStart of blockStartsPx) {
          if (bStart > srcY && bStart < sliceEnd && (sliceEnd - bStart) < ORPHAN_ZONE_PX) {
            sliceEnd = bStart; // cut just before the header so it moves to next page
            break;
          }
        }
      }

      const srcH = Math.min(sliceEnd - srcY, contentCanvas.height - srcY);
      if (srcH <= 0) break; // safety guard
      pages.push({ srcY, srcH, topPad });
      srcY += srcH;
    }

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const { srcY: pSrcY, srcH: pSrcH, topPad } = pages[i];

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = A4_W * scale;
      pageCanvas.height = A4_H_PX;
      const ctx = pageCanvas.getContext("2d");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Watermark centered on this page
      if (watermarkImg) {
        const wSize = 700 * scale;
        ctx.drawImage(watermarkImg, (pageCanvas.width - wSize) / 2, (A4_H_PX - wSize) / 2, wSize, wSize);
      }

      // Content slice drawn with top padding
      ctx.drawImage(contentCanvas, 0, pSrcY, pageCanvas.width, pSrcH, 0, topPad, pageCanvas.width, pSrcH);

      // Footer fixed at bottom of every page
      ctx.drawImage(footerCanvas, 0, 0, pageCanvas.width, footerH, 0, A4_H_PX - footerH, pageCanvas.width, footerH);

      pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH);
    }

    const patSlug = (patient?.name || "proposta").replace(/\s+/g, "-").toLowerCase();
    pdf.save(`proposta-${patSlug}.pdf`);
  } finally {
    document.body.removeChild(contentEl);
    document.body.removeChild(footerEl);
  }
}

// ─── QUOTATIONS PAGE ──────────────────────────────────────────────────────────
function QuotationsPage({ ctx }) {
  const { quotations, setQuotations, patients, setModal } = ctx;
  const [tab, setTab] = useState("pending");

  const grouped = {
    all: quotations,
    pending: quotations.filter((q) => q.status === "pending"),
    approved: quotations.filter((q) => q.status === "approved"),
    rejected: quotations.filter((q) => q.status === "rejected"),
  };
  const list = (grouped[tab] || []).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  function openNew() {
    setModal({ lg: true, content: <QuotationForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openDetail(q) {
    setModal({ lg: true, content: <QuotationDetailModal quot={q} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openEdit(q) {
    setModal({ lg: true, content: <QuotationForm ctx={ctx} editQuotation={q} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openApprove(q) {
    setModal({ lg: true, content: <ApproveQuotationModal quot={q} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  async function reject(q) {
    await db.updateQuotationStatus(q.id, "rejected");
    setQuotations((prev) => prev.map((x) => x.id === q.id ? { ...x, status: "rejected" } : x));
  }

  const statusLabel = { pending: "Pendente", approved: "Aprovado", rejected: "Recusado" };
  const statusBadge = { pending: "badge-warning", approved: "badge-ok", rejected: "badge-danger" };

  return (
    <div>
      <div className="section-header">
        <div className="tabs">
          {[["pending", "Pendentes"], ["approved", "Aprovados"], ["rejected", "Recusados"], ["all", "Todos"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l} ({grouped[k].length})</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Orçamento</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Data</th><th>Paciente</th><th>Procedimentos</th><th>Total</th><th>Válido até</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7}><div className="empty">Nenhum orçamento</div></td></tr>}
              {list.map((q) => {
                const p = patients.find((x) => x.id === q.patientId);
                return (
                  <tr key={q.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(q.date)}</td>
                    <td>{p?.name || "—"}</td>
                    <td style={{ fontSize: 12 }}>
                      {(q.options?.length || 0) > 1
                        ? `${q.options.length} opções`
                        : `${q.options?.[0]?.items?.length || 0} procedimento(s)`}
                    </td>
                    <td>
                      {(q.options?.length || 0) > 1 ? (
                        <span style={{ color: T.grey, fontSize: 12 }}>ver opções</span>
                      ) : (
                        <><strong>{fmt(q.totalWithDiscount)}</strong>{q.discount > 0 && <div style={{ fontSize: 11, color: T.success }}>-{fmt(q.discount)} desc.</div>}</>
                      )}
                    </td>
                    <td style={{ color: T.grey, fontSize: 12 }}>{q.validUntil ? fmtDate(q.validUntil) : "—"}</td>
                    <td><span className={`badge ${statusBadge[q.status] || "badge-grey"}`}>{statusLabel[q.status] || q.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openDetail(q)}>Ver</button>
                        <button className="btn btn-sm btn-secondary" onClick={async () => { await generateQuotationPDF(q, p); }}>PDF</button>
                        {q.status === "pending" && (
                          <>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(q)}>✏️</button>
                            <button className="btn btn-sm btn-success" onClick={() => openApprove(q)}>✓ Aprovar</button>
                            <button className="btn btn-sm btn-danger" onClick={() => reject(q)}>✕ Recusar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── QUOTATION FORM ───────────────────────────────────────────────────────────
function QuotationForm({ ctx, onClose, prefill = {}, editQuotation }) {
  const { services, patients, setQuotations, locations } = ctx;
  const editing = !!editQuotation;
  const defaultLocation = (locations || []).find((l) => l.name === "Clínica")?.name || (locations?.[0]?.name || "");

  const [form, setForm] = useState({
    patientId: editQuotation?.patientId || prefill.patientId || "",
    date: editQuotation?.date || today(),
    validUntil: editQuotation?.validUntil || "",
    location: editQuotation?.location || prefill.location || defaultLocation,
    professional: editQuotation?.professional || ctx.user?.name || "Dr. Murilo do Valle",
    notes: editQuotation?.notes || "",
    appointmentId: editQuotation?.appointmentId || prefill.appointmentId || null,
  });

  // Initialize options from editQuotation or start with one empty option
  const [options, setOptions] = useState(() => {
    if (editQuotation?.options?.length > 0) {
      return editQuotation.options.map((opt) => ({
        label: opt.label,
        discount: opt.discount || 0,
        items: opt.items.length > 0
          ? opt.items.map((it) => ({ serviceId: it.serviceId, serviceName: it.serviceName, price: it.price, note: it.note }))
          : [{ serviceId: "", serviceName: "", price: "", note: "" }],
      }));
    }
    return [{ label: "Opção 1", discount: 0, items: [{ serviceId: "", serviceName: "", price: "", note: "" }] }];
  });

  const [saving, setSaving] = useState(false);
  const sortedPatients = sortByName(patients);
  const sortedServices = sortByName(services.filter((s) => s.active));

  // Option-level helpers
  function addOption() {
    setOptions((prev) => [...prev, { label: `Opção ${prev.length + 1}`, discount: 0, items: [{ serviceId: "", serviceName: "", price: "", note: "" }] }]);
  }
  function removeOption(oi) {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, j) => j !== oi));
  }
  function updateOptionLabel(oi, val) {
    setOptions((prev) => prev.map((opt, j) => j === oi ? { ...opt, label: val } : opt));
  }
  function updateOptionDiscount(oi, val) {
    setOptions((prev) => prev.map((opt, j) => j === oi ? { ...opt, discount: val } : opt));
  }

  // Item-level helpers
  function addItem(oi) {
    setOptions((prev) => prev.map((opt, j) => j === oi ? { ...opt, items: [...opt.items, { serviceId: "", serviceName: "", price: "", note: "" }] } : opt));
  }
  function removeItem(oi, ii) {
    setOptions((prev) => prev.map((opt, j) => j === oi
      ? { ...opt, items: opt.items.length > 1 ? opt.items.filter((_, k) => k !== ii) : opt.items }
      : opt));
  }
  function updateItem(oi, ii, field, val) {
    setOptions((prev) => prev.map((opt, j) => j === oi
      ? { ...opt, items: opt.items.map((it, k) => k === ii ? { ...it, [field]: val } : it) }
      : opt));
  }
  function handleServiceSelect(oi, ii, serviceId) {
    const svc = services.find((s) => String(s.id) === String(serviceId));
    setOptions((prev) => prev.map((opt, j) => j === oi
      ? { ...opt, items: opt.items.map((it, k) => k === ii ? { ...it, serviceId, serviceName: svc?.name || "", price: svc?.price || "" } : it) }
      : opt));
  }

  // Compute final options with proportional discount per option
  function computeOptions() {
    return options.map((opt) => {
      const validItems = opt.items.filter((it) => it.serviceName);
      if (!validItems.length) return { ...opt, items: [] };
      const subtotal = validItems.reduce((s, it) => s + (+it.price || 0), 0);
      const disc = Math.min(+opt.discount || 0, subtotal);
      const totalAfterDisc = subtotal - disc;
      const ratio = subtotal > 0 ? totalAfterDisc / subtotal : 1;
      const mapped = validItems.map((it) => ({
        serviceId: it.serviceId || null,
        serviceName: it.serviceName,
        price: +it.price || 0,
        finalPrice: Math.round((+it.price || 0) * ratio * 100) / 100,
        note: it.note || "",
      }));
      // Fix rounding residual on last item
      const sumFinal = mapped.reduce((s, it) => s + it.finalPrice, 0);
      const diff = Math.round((totalAfterDisc - sumFinal) * 100) / 100;
      if (mapped.length > 0) mapped[mapped.length - 1].finalPrice += diff;
      return { label: opt.label, discount: disc, items: mapped };
    });
  }

  async function save() {
    const computed = computeOptions();
    const hasItems = computed.some((opt) => opt.items.length > 0);
    if (!form.patientId || !hasItems) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await db.updateQuotation({ ...form, id: editQuotation.id }, computed);
        setQuotations((prev) => prev.map((x) => x.id === editQuotation.id ? updated : x));
      } else {
        const created = await db.createQuotation(form, computed);
        setQuotations((prev) => [created, ...prev]);
      }
      onClose();
    } catch (e) {
      console.error("Erro ao salvar orçamento:", e);
      alert("Erro ao salvar orçamento: " + (e.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  }

  const multipleOptions = options.length > 1;

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{editing ? "Editar Orçamento" : "Novo Orçamento"}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Paciente</label>
            <SearchSelect
              options={sortedPatients.map((p) => ({ value: p.id, label: p.name }))}
              value={form.patientId}
              onChange={(v) => setForm({ ...form, patientId: v })}
              placeholder="Buscar paciente…"
            />
          </div>
          <div className="form-group">
            <label>Profissional</label>
            <input className="form-control" value={form.professional} onChange={(e) => setForm({ ...form, professional: e.target.value })} />
          </div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Data</label>
            <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Válido até (opcional)</label>
            <input type="date" className="form-control" value={form.validUntil || ""} onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })} />
          </div>
        </div>
        <div className="form-group">
          <label>Local</label>
          <select className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
            {(locations || []).map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>

        {/* Options */}
        {options.map((opt, oi) => {
          const subtotal = opt.items.reduce((s, it) => s + (+it.price || 0), 0);
          const disc = Math.min(+opt.discount || 0, subtotal);
          const total = subtotal - disc;
          return (
            <div key={oi} style={{ border: `2px solid ${T.teal}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              {/* Option header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {multipleOptions ? (
                  <input
                    className="form-control"
                    value={opt.label}
                    onChange={(e) => updateOptionLabel(oi, e.target.value)}
                    style={{ fontWeight: 700, color: T.teal, fontSize: 14, flex: 1 }}
                  />
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.teal, flex: 1 }}>Procedimentos</span>
                )}
                {multipleOptions && (
                  <button className="btn btn-sm btn-danger" onClick={() => removeOption(oi)} title="Remover opção">🗑</button>
                )}
              </div>

              {/* Items */}
              {opt.items.map((it, ii) => (
                <div key={ii} style={{ background: T.light, borderRadius: 10, padding: "12px 12px 8px", marginBottom: 10 }}>
                  <div className="form-row form-row-2" style={{ marginBottom: 6 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Procedimento</label>
                      <SearchSelect
                        options={sortedServices.map((s) => ({ value: s.id, label: s.name }))}
                        value={it.serviceId}
                        onChange={(v) => handleServiceSelect(oi, ii, v)}
                        placeholder="Buscar procedimento…"
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label style={{ fontSize: 12 }}>Valor (R$)</label>
                        <input type="number" className="form-control" value={it.price}
                          onChange={(e) => updateItem(oi, ii, "price", e.target.value)} />
                      </div>
                      <button className="btn btn-sm btn-danger" style={{ marginBottom: 2 }} onClick={() => removeItem(oi, ii)} disabled={opt.items.length === 1}>🗑</button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-control" value={it.note} placeholder="Observação opcional..."
                      onChange={(e) => updateItem(oi, ii, "note", e.target.value)} style={{ fontSize: 13 }} />
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => addItem(oi)} style={{ marginBottom: 12 }}>+ Adicionar procedimento</button>

              {/* Option totals */}
              <div style={{ borderTop: `1px solid ${T.blue}30`, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.grey, fontSize: 13 }}>Desconto (R$):</span>
                  <input type="number" className="form-control" style={{ width: 110 }}
                    value={opt.discount} onChange={(e) => updateOptionDiscount(oi, e.target.value)} min={0} max={subtotal} />
                </div>
                <div style={{ textAlign: "right" }}>
                  {disc > 0 && <div style={{ fontSize: 12, color: T.grey }}>Subtotal: {fmt(subtotal)}&nbsp;&nbsp;Desconto: -{fmt(disc)}</div>}
                  <strong style={{ color: T.teal, fontSize: 16 }}>Total: {fmt(total)}</strong>
                </div>
              </div>
            </div>
          );
        })}

        <button className="btn btn-secondary btn-sm" onClick={addOption} style={{ marginBottom: 16 }}>+ Adicionar Opção</button>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar Orçamento"}</button>
      </div>
    </>
  );
}

// ─── QUOTATION DETAIL MODAL ───────────────────────────────────────────────────
function QuotationDetailModal({ quot, ctx, onClose }) {
  const { patients, sales, setQuotations, setModal } = ctx;
  const patient = patients.find((p) => p.id === quot.patientId);
  const linkedSales = (sales || []).filter((s) => s.quotationId === quot.id);
  const [confirmDel, setConfirmDel] = useState(false);

  const statusLabel = { pending: "Pendente", approved: "Aprovado", rejected: "Recusado" };
  const statusBadge = { pending: "badge-warning", approved: "badge-ok", rejected: "badge-danger" };

  async function reject() {
    await db.updateQuotationStatus(quot.id, "rejected");
    setQuotations((prev) => prev.map((x) => x.id === quot.id ? { ...x, status: "rejected" } : x));
    onClose();
  }
  async function revertToPending() {
    await db.updateQuotationStatus(quot.id, "pending");
    setQuotations((prev) => prev.map((x) => x.id === quot.id ? { ...x, status: "pending" } : x));
    onClose();
  }
  async function deleteQuot() {
    await db.deleteQuotation(quot.id);
    setQuotations((prev) => prev.filter((x) => x.id !== quot.id));
    onClose();
  }
  function openEdit() {
    onClose();
    setModal({ lg: true, content: <QuotationForm ctx={ctx} editQuotation={quot} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openApprove() {
    onClose();
    setModal({ lg: true, content: <ApproveQuotationModal quot={quot} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">📋 Orçamento — {patient?.name}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <span className={`badge ${statusBadge[quot.status] || "badge-grey"}`} style={{ fontSize: 13, padding: "4px 12px" }}>{statusLabel[quot.status] || quot.status}</span>
          <span style={{ color: T.grey, fontSize: 13 }}>{fmtDate(quot.date)}</span>
          {quot.validUntil && <span style={{ color: T.grey, fontSize: 13 }}>Válido até {fmtDate(quot.validUntil)}</span>}
          <span style={{ color: T.grey, fontSize: 13 }}>{quot.professional}</span>
        </div>

        {/* Options / Items */}
        {(quot.options || []).map((opt, oi) => {
          const optSubtotal = opt.items.reduce((s, it) => s + (+it.price || 0), 0);
          const optTotal = opt.items.reduce((s, it) => s + (+it.finalPrice || 0), 0);
          const multipleOptions = (quot.options || []).length > 1;
          return (
            <div key={oi} style={{ marginBottom: 16 }}>
              {multipleOptions && (
                <div style={{ fontWeight: 700, color: T.teal, fontSize: 14, marginBottom: 6, borderBottom: `2px solid ${T.teal}`, paddingBottom: 4 }}>{opt.label}</div>
              )}
              {opt.items.map((it, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${T.light}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>• {it.serviceName}</span>
                      {it.note && <div style={{ color: T.grey, fontSize: 12, marginTop: 3 }}>{it.note}</div>}
                    </div>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>{fmt(it.price)}</span>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 8, textAlign: "right" }}>
                {opt.discount > 0 && (
                  <div style={{ fontSize: 12, color: T.grey, marginBottom: 2 }}>
                    Subtotal: {fmt(optSubtotal)}&nbsp;&nbsp;Desconto: -{fmt(opt.discount)}
                  </div>
                )}
                <strong style={{ color: T.teal }}>Total: {fmt(optTotal)}</strong>
              </div>
            </div>
          );
        })}

        {/* Linked sales */}
        {linkedSales.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, color: T.teal, marginBottom: 8 }}>Vendas vinculadas ({linkedSales.length})</div>
            {linkedSales.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.light}`, fontSize: 13 }}>
                <span>{fmtDate(s.date)}</span>
                <strong>{fmt(s.price)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer" style={{ flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!confirmDel ? (
            <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>🗑 Excluir</button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.danger }}>Confirmar exclusão?</span>
              <button className="btn btn-sm btn-danger" onClick={deleteQuot}>✓ Sim</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(false)}>Não</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={async () => { await generateQuotationPDF(quot, patient); }}>⬇ PDF</button>
          {quot.status !== "pending" && (
            <button className="btn btn-secondary" onClick={revertToPending}>↩ Pendente</button>
          )}
          {quot.status === "pending" && (
            <>
              <button className="btn btn-secondary" onClick={openEdit}>✏️ Editar</button>
              <button className="btn btn-danger" onClick={reject}>✕ Recusar</button>
              <button className="btn btn-success" onClick={openApprove}>✓ Aprovar</button>
            </>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </>
  );
}

// ─── APPROVE QUOTATION MODAL ──────────────────────────────────────────────────
function ApproveQuotationModal({ quot, ctx, onClose }) {
  const { patients, setQuotations, setModal } = ctx;
  const patient = patients.find((p) => p.id === quot.patientId);
  const multipleOptions = (quot.options || []).length > 1;

  // Flatten all items from all options, keeping optionLabel for display
  const [approvalItems, setApprovalItems] = useState(() =>
    (quot.options || []).flatMap((opt) =>
      opt.items.map((it) => ({ ...it, included: true, optionLabel: opt.label }))
    )
  );

  const total = approvalItems.filter((i) => i.included).reduce((s, i) => s + (+i.finalPrice || 0), 0);

  function toggleItem(idx, val) {
    setApprovalItems((prev) => prev.map((x, j) => j === idx ? { ...x, included: val } : x));
  }
  function updatePrice(idx, val) {
    setApprovalItems((prev) => prev.map((x, j) => j === idx ? { ...x, finalPrice: +val } : x));
  }

  async function createSale() {
    const selected = approvalItems.filter((i) => i.included);
    if (!selected.length) return;
    await db.updateQuotationStatus(quot.id, "approved");
    setQuotations((prev) => prev.map((x) => x.id === quot.id ? { ...x, status: "approved" } : x));
    onClose();
    setModal({
      lg: true,
      content: <SaleForm
        ctx={ctx}
        prefillPatient={quot.patientId}
        quotationId={quot.id}
        quotationItems={selected}
        onClose={() => setModal(null)}
      />,
      onClose: () => setModal(null),
    });
  }

  // Group by optionLabel for display when multipleOptions
  const grouped = multipleOptions
    ? (quot.options || []).map((opt) => ({
        label: opt.label,
        items: approvalItems.filter((it) => it.optionLabel === opt.label),
      }))
    : [{ label: null, items: approvalItems }];

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">✓ Aprovar Orçamento — {patient?.name}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div style={{ color: T.grey, fontSize: 13, marginBottom: 16 }}>Selecione os procedimentos que o paciente aprovou e ajuste os valores se necessário.</div>
        {grouped.map((group, gi) => (
          <div key={gi} style={{ marginBottom: multipleOptions ? 16 : 0 }}>
            {multipleOptions && (
              <div style={{ fontWeight: 700, color: T.teal, fontSize: 13, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.blue}40` }}>{group.label}</div>
            )}
            {group.items.map((it) => {
              const idx = approvalItems.indexOf(it);
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.light}` }}>
                  <input type="checkbox" checked={it.included} onChange={(e) => toggleItem(idx, e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <span style={{ flex: 1, fontWeight: it.included ? 600 : 400, color: it.included ? T.dark : T.grey }}>{it.serviceName}</span>
                  {it.note && <span style={{ fontSize: 11, color: T.grey, maxWidth: 100 }}>{it.note}</span>}
                  <input type="number" className="form-control" style={{ width: 110 }} disabled={!it.included}
                    value={it.finalPrice} onChange={(e) => updatePrice(idx, e.target.value)} />
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <strong style={{ color: T.teal, fontSize: 17 }}>Total selecionado: {fmt(total)}</strong>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-success" onClick={createSale} disabled={!approvalItems.some((i) => i.included)}>💰 Criar Venda</button>
      </div>
    </>
  );
}

// ─── LOCATIONS ─────────────────────────────────────────────────────────────────
// ─── GOOGLE CALENDAR SETTINGS ─────────────────────────────────────────────────
function GoogleCalendarSettingsPage({ ctx }) {
  const { gcalMappings, setGcalMappings, gcalSyncing, gcalLastSync, triggerSync, locations } = ctx;
  const [mappings, setMappings] = useState(gcalMappings);
  const [syncError, setSyncError] = useState("");
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_API_KEY;

  function updateMapping(i, field, value) {
    const updated = mappings.map((m, idx) => idx === i ? { ...m, [field]: value } : m);
    setMappings(updated);
    setGcalMappings(updated);
    saveMappings(updated);
  }

  async function doSync() {
    setSyncError("");
    try {
      await triggerSync();
    } catch (e) {
      setSyncError(e.message || "Erro ao sincronizar");
    }
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-sub">Importe eventos do Google Calendar como pre-agendamentos</div>
      </div>

      {!hasApiKey && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-content">⚠️ <strong>VITE_GOOGLE_API_KEY</strong> não configurada no <code>.env.local</code>. Adicione a chave e reinicie o app.</div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Sincronização</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {hasApiKey && <span className="badge badge-ok">✓ API Key configurada</span>}
            <button className="btn btn-secondary btn-sm" onClick={doSync} disabled={gcalSyncing || !hasApiKey}>
              {gcalSyncing ? "Sincronizando..." : "🔄 Sincronizar agora"}
            </button>
            {gcalLastSync && <span style={{ fontSize: 12, color: T.grey }}>Última sync: {gcalLastSync}</span>}
            {syncError && <span style={{ fontSize: 12, color: T.danger }}>{syncError}</span>}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Agendas e Locais</div>
          <p style={{ fontSize: 13, color: T.grey, marginBottom: 16 }}>Configure qual Local do sistema cada agenda do Google representa.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mappings.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Nome da Agenda</label>
                  <input className="form-control" value={m.label} onChange={(e) => updateMapping(i, "label", e.target.value)} placeholder="Ex: Agenda Clínica" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Local no Sistema</label>
                  <select className="form-control" value={m.location} onChange={(e) => updateMapping(i, "location", e.target.value)}>
                    <option value="">— Selecione —</option>
                    {(locations || []).map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Como funciona</div>
          <ul style={{ fontSize: 13, color: T.grey, paddingLeft: 20, lineHeight: 2 }}>
            <li>Eventos adicionados no Google Calendar são importados automaticamente como <strong>pre-agendamentos</strong></li>
            <li>Sincronização automática a cada 5 minutos enquanto o app estiver aberto</li>
            <li>Cada pre-agendamento aparece na aba <strong>📅 Google</strong> da Agenda</li>
            <li>Clique em <strong>Completar</strong> para adicionar paciente e procedimento</li>
            <li>Eventos de dia inteiro são ignorados (apenas eventos com horário são importados)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LocationsPage({ ctx }) {
  const { locations, setLocations } = ctx;
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await db.createLocation(newName.trim());
      setLocations((prev) => sortByName([...prev, created]));
      setNewName("");
    } catch (e) {
      console.error("Erro ao criar local:", e);
    }
    setSaving(false);
  }

  async function remove(id) {
    try {
      await db.deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error("Erro ao remover local:", e);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">📍 Locais de Atendimento</div>
          <div className="section-sub">Gerencie os locais disponíveis em agendamentos e vendas</div>
        </div>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            className="form-control"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do novo local..."
            onKeyDown={(e) => e.key === "Enter" && add()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={add} disabled={saving || !newName.trim()}>
            {saving ? "..." : "+ Adicionar"}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Local</th><th style={{ width: 80 }}>Ação</th></tr>
            </thead>
            <tbody>
              {locations.length === 0 && (
                <tr><td colSpan={2}><div className="empty">Nenhum local cadastrado</div></td></tr>
              )}
              {locations.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(l.id)} title="Remover">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
