import { useState, useEffect } from "react";
import * as db from "./db";
import { supabase } from "./supabase";

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
    .topbar { padding: 12px 16px; }
    .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
    .product-row { flex-wrap: wrap; }
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
    else onLogin(data.user);
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
  const [modal, setModal] = useState(null);
  const [pendingReturn, setPendingReturn] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

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
    ]).then(([locs, prods, stock, svcs, pats, sls, cts, appts]) => {
      setLocations(locs.length > 0 ? locs : INIT_LOCATIONS);
      setProducts(prods);
      setStockEntries(stock);
      setServices(svcs);
      setPatients(pats);
      setSales(sls);
      setCosts(cts);
      setAppointments(appts);
      setDataLoading(false);
    }).catch((err) => {
      console.error("Erro ao carregar dados:", err);
      setDataLoading(false);
    });
  }, []);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";
  const userForCtx = { ...user, name: displayName };

  const ctx = {
    user: userForCtx, products, setProducts, stockEntries, setStockEntries,
    services, setServices, patients, setPatients, sales, setSales,
    costs, setCosts, appointments, setAppointments, modal, setModal,
    pendingReturn, setPendingReturn, setPage, locations, setLocations,
    db,
  };

  if (dataLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div style={{ fontSize: 14, color: T.grey }}>Carregando dados...</div>
    </div>
  );

  useEffect(() => {
    if (!pendingReturn) return;
    setModal({
      content: <ReturnPromptModal pr={pendingReturn} ctx={ctx} onClose={() => { setModal(null); setPendingReturn(null); }} />,
      onClose: () => { setModal(null); setPendingReturn(null); },
    });
  }, [pendingReturn]);

  const NAV = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "appointments", icon: "📅", label: "Agenda", group: "op" },
    { id: "sales", icon: "💳", label: "Vendas", group: "op" },
    { id: "patients", icon: "👤", label: "Pacientes", group: "op" },
    { id: "stock", icon: "📦", label: "Estoque", group: "cad" },
    { id: "services", icon: "💉", label: "Procedimentos", group: "cad" },
    { id: "costs", icon: "🧾", label: "Custos", group: "cad" },
    { id: "finance", icon: "📊", label: "Financeiro", group: "fin" },
  ];
  const groups = {};
  NAV.forEach((n) => { const g = n.group || "main"; (groups[g] = groups[g] || []).push(n); });

  const PAGES = { dashboard: DashboardPage, appointments: AppointmentsPage, sales: SalesPage, patients: PatientsPage, stock: StockPage, services: ServicesPage, costs: CostsPage, finance: FinancePage };
  const PageComponent = PAGES[page] || DashboardPage;

  // Bottom nav: 4 pinned + "Mais" drawer
  const BOTTOM_NAV = [
    { id: "dashboard",    icon: "🏠", label: "Início" },
    { id: "appointments", icon: "📅", label: "Agenda" },
    { id: "sales",        icon: "💳", label: "Vendas" },
    { id: "patients",     icon: "👤", label: "Pacientes" },
  ];
  const MORE_NAV = NAV.filter((n) => !BOTTOM_NAV.find((b) => b.id === n.id));
  const [showMore, setShowMore] = useState(false);

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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ ctx }) {
  const { sales, costs, patients, appointments, products, services } = ctx;
  const todayStr = today();
  const curMonth = todayStr.slice(0, 7);

  const todaySales = sales.filter((s) => s.date === todayStr);
  const monthSales = sales.filter((s) => s.date.startsWith(curMonth));
  const todayRevenue = todaySales.reduce((s, x) => s + x.price, 0);
  const monthRevenue = monthSales.reduce((s, x) => s + x.price, 0);
  const monthProfit = monthSales.reduce((s, x) => s + calcNetValue(x), 0);
  const monthCosts = costs.filter((c) => c.date.startsWith(curMonth)).reduce((s, c) => s + c.amount, 0);
  const realProfit = monthProfit - monthCosts;
  const todayAppt = appointments.filter((a) => a.date === todayStr);

  const latePatients = patients.filter((p) => p.status === "late");
  const latePix = sales.filter((s) => s.paymentMethod === "pixInstallment" && s.paidInstallments < s.installments);
  const lowStock = products.filter((p) => p.totalQty <= p.minStock);
  const birthdaySoon = patients.filter((p) => isBirthdaySoon(p.birthdate, 3));

  const hasAlerts = latePatients.length > 0 || latePix.length > 0 || lowStock.length > 0 || birthdaySoon.length > 0;

  return (
    <div>
      <div className="grid-4">
        <MetricCard icon="💰" title="Faturamento Hoje" value={fmt(todayRevenue)} sub={`${todaySales.length} procedimentos`} />
        <MetricCard icon="📈" title="Faturamento Mês" value={fmt(monthRevenue)} sub="mês atual" />
        <MetricCard icon="✅" title="Lucro Estimado" value={fmt(realProfit)} sub="após custos e taxas" color={realProfit >= 0 ? T.success : T.danger} />
        <MetricCard icon="📅" title="Agenda Hoje" value={todayAppt.length} sub="atendimentos" />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">⚠️ Alertas</div></div>
          {!hasAlerts && <div className="alert alert-success"><div className="alert-content">✅ Nenhum alerta no momento</div></div>}

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
            const p = patients.find((x) => x.id === s.patientId);
            const svc = services.find((x) => x.id === s.serviceId);
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

        <div className="card">
          <div className="section-header"><div className="section-title">📅 Agenda de Hoje</div></div>
          {todayAppt.length === 0 && <div className="empty">Nenhum agendamento hoje</div>}
          {todayAppt.map((a) => {
            const p = patients.find((x) => x.id === a.patientId);
            const s = services.find((x) => x.id === a.serviceId);
            return (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.light}` }}>
                <div><div style={{ fontWeight: 500, fontSize: 14 }}>{p?.name}</div><div style={{ fontSize: 12, color: T.grey }}>{s?.name}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>{a.time}</div>
                  <span className={`badge badge-${a.status}`}>{a.status === "scheduled" ? "Agendado" : a.status === "done" ? "Realizado" : "Cancelado"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">💳 Últimas Vendas</div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Paciente</th><th>Procedimento</th><th>Valor</th><th>Lucro</th></tr></thead>
              <tbody>
                {sales.slice(-5).reverse().map((s) => {
                  const p = patients.find((x) => x.id === s.patientId);
                  const sv = services.find((x) => x.id === s.serviceId);
                  const net = calcNetValue(s);
                  return (
                    <tr key={s.id}><td>{p?.name}</td><td>{sv?.name}</td><td>{fmt(s.price)}</td>
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
function AppointmentsPage({ ctx }) {
  const { appointments, patients, services, setAppointments, setModal } = ctx;
  const [tab, setTab] = useState("today");
  const todayStr = today();

  const grouped = {
    today: appointments.filter((a) => a.date === todayStr),
    upcoming: appointments.filter((a) => a.date > todayStr),
    past: appointments.filter((a) => a.date < todayStr),
  };

  function openNew() {
    setModal({ content: <AppointmentForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openSale(appt) {
    setModal({ lg: true, content: <SaleForm ctx={ctx} appointmentId={appt.id} prefillPatient={appt.patientId} prefillService={appt.serviceId} prefillLocation={appt.location} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function cancel(id) {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
  }

  const list = (grouped[tab] || []).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div>
      <div className="section-header">
        <div className="tabs">
          {[["today", "Hoje"], ["upcoming", "Próximos"], ["past", "Anteriores"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l} ({grouped[k].length})</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Agendar</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Hora</th><th>Paciente</th><th>Procedimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhum agendamento</div></td></tr>}
              {list.map((a) => {
                const p = patients.find((x) => x.id === a.patientId);
                const s = services.find((x) => x.id === a.serviceId);
                return (
                  <tr key={a.id}>
                    <td>{fmtDate(a.date)}</td>
                    <td><strong>{a.time}</strong></td>
                    <td>{p?.name}</td>
                    <td>{s?.name} {s?.needsReturn && <span className="return-badge">🔄 {s.returnType}</span>}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status === "scheduled" ? "Agendado" : a.status === "done" ? "Realizado" : "Cancelado"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {a.status === "scheduled" && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => openSale(a)}>💰 Realizar Venda</button>
                            <button className="btn btn-sm btn-danger" onClick={() => cancel(a.id)}>✕</button>
                          </>
                        )}
                        {a.status === "done" && <span className="badge badge-ok">✓ Realizado</span>}
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
function AppointmentForm({ ctx, onClose, prefill = {} }) {
  // KEY FIX: patients comes from ctx directly, not destructured once
  const { services, setAppointments, locations } = ctx;
  const defaultLocation = (locations || []).find((l) => l.name === "Clínica")?.name || (locations?.[0]?.name || "Clínica");
  // Use local patients state that stays in sync
  const [localPatients, setLocalPatients] = useState(ctx.patients);
  const [form, setForm] = useState({
    patientId: prefill.patientId || "",
    serviceId: prefill.serviceId || "",
    date: prefill.date || today(),
    time: "09:00",
    location: prefill.location || defaultLocation,
    note: prefill.note || "",
  });
  const [showNew, setShowNew] = useState(false);
  const [np, setNp] = useState({ name: "", phone: "", email: "", birthdate: "", notes: "" });

  function saveNewPatient() {
    if (!np.name) return;
    const newP = { id: Date.now(), ...np, status: "ok" };
    ctx.setPatients((prev) => [...prev, newP]);
    setLocalPatients((prev) => [...prev, newP]);
    setForm((f) => ({ ...f, patientId: newP.id }));
    setShowNew(false);
    setNp({ name: "", phone: "", email: "", birthdate: "", notes: "" });
  }

  function save() {
    if (!form.patientId || !form.serviceId) return;
    setAppointments((prev) => [...prev, { id: Date.now(), ...form, patientId: +form.patientId, serviceId: +form.serviceId, status: "scheduled", saleId: null }]);
    onClose();
  }

  const sortedPatients = sortByName(localPatients);
  const sortedServices = sortByName(services.filter((s) => s.active));

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{prefill.serviceId ? "Agendar Retorno/Retoque" : "Novo Agendamento"}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {!showNew ? (
          <div className="form-group">
            <label>Paciente</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="form-control" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Selecione...</option>
                {sortedPatients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
        <div className="form-group">
          <label>Procedimento</label>
          <select className="form-control" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
            <option value="">Selecione...</option>
            {sortedServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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
        <button className="btn btn-primary" onClick={save}>Agendar</button>
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
    return (p?.name + sv?.name).toLowerCase().includes(search.toLowerCase());
  });

  function openNew() {
    setModal({ lg: true, content: <SaleForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  function openPix(sale) {
    setModal({ content: <PixInstallmentModal sale={sale} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) });
  }
  const [confirmDelete, setConfirmDelete] = useState(null);

  function deleteSale(id) {
    if (confirmDelete === id) {
      setSales((prev) => prev.filter((s) => s.id !== id));
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
              <tr><th>Data</th><th>Paciente</th><th>Procedimento</th><th>Produto(s)</th><th>Sessão</th><th>Valor</th><th>Pagamento</th><th>Custo</th><th>Lucro</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10}><div className="empty">Nenhuma venda encontrada</div></td></tr>}
              {filtered.slice().reverse().map((s) => {
                const p = patients.find((x) => x.id === s.patientId);
                const sv = services.find((x) => x.id === s.serviceId);
                const cost = calcSaleCost(s.products);
                const net = calcNetValue(s);
                const isPix = s.paymentMethod === "pixInstallment";
                const allPaid = s.paidInstallments >= s.installments;
                const sessionTypes = [...new Set(s.products.map((p) => p.sessionType))];
                return (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.date)}</td>
                    <td>{p?.name}</td>
                    <td>{sv?.name}</td>
                    <td style={{ fontSize: 12 }}>
                      {s.products.map((sp, i) => {
                        const prod = ctx.products.find((x) => x.id === sp.productId);
                        return <div key={i}>{prod?.name}: {sp.qty} {prod?.unit}</div>;
                      })}
                    </td>
                    <td>{sessionTypes.map((t) => <span key={t} className="badge badge-grey" style={{ marginRight: 2, fontSize: 11 }}>{sessionLabel[t] || t}</span>)}</td>
                    <td><strong>{fmt(s.price)}</strong></td>
                    <td>
                      <span className={`badge ${s.paymentMethod === "pix" ? "badge-info" : s.paymentMethod === "credit" ? "badge-ok" : "badge-warning"}`}>
                        {s.paymentMethod === "pix" ? "Pix" : s.paymentMethod === "credit" ? `Crédito ${s.installments}x` : `Pix ${s.paidInstallments}/${s.installments}`}
                      </span>
                      {isPix && !allPaid && <div><span className="badge badge-warning" style={{ fontSize: 10, marginTop: 2 }}>pendente</span></div>}
                    </td>
                    <td style={{ color: T.danger }}>{fmt(cost)}</td>
                    <td style={{ color: net >= 0 ? T.success : T.danger, fontWeight: 600 }}>{fmt(net)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {isPix && !allPaid && <button className="btn btn-sm btn-secondary" onClick={() => openPix(s)}>💳 Parcelas</button>}
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

// ─── SALE FORM ────────────────────────────────────────────────────────────────
function SaleForm({ ctx, appointmentId, prefillPatient, prefillService, prefillLocation, onClose }) {
  const { patients, services, products, setSales, setProducts, setAppointments, setPendingReturn, locations } = ctx;
  const defaultLocation = prefillLocation || (locations || []).find((l) => l.name === "Clínica")?.name || (locations?.[0]?.name || "Clínica");

  const [form, setForm] = useState({
    patientId: prefillPatient || "",
    serviceId: prefillService || "",
    professional: ctx.user?.name || "Dr. Murilo",
    date: today(),
    price: "",
    location: defaultLocation,
    paymentMethod: "pix",
    cardBrand: "Mastercard",
    installments: 1,
    creditFeeRate: 0,
    netAmount: "",
    netAmountEdited: false,
    downPaymentAmount: "",
    downPaymentMethod: "pix",
  });
  const [saleProducts, setSaleProducts] = useState([{ productId: "", qty: "", sessionType: "initial" }]);
  const [showEntry, setShowEntry] = useState(false);

  const needsBrand = form.paymentMethod === "credit" || form.paymentMethod === "debit";
  const needsInstallments = form.paymentMethod === "credit" || form.paymentMethod === "pixInstallment";
  const maxInstallments = form.paymentMethod === "credit" ? 15 : 12;

  // Auto-select service price
  const selectedService = services.find((s) => s.id === +form.serviceId);
  useEffect(() => {
    if (selectedService) setForm((f) => ({ ...f, price: selectedService.price, netAmountEdited: false }));
  }, [form.serviceId]);

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

  const productCost = saleProducts.reduce((sum, sp) => {
    const prod = products.find((x) => x.id === +sp.productId);
    return sum + (prod ? prod.avgCost * (+sp.qty || 0) : 0);
  }, 0);
  const feeAmt = (+form.price || 0) - (+form.netAmount || 0);
  const netValue = (+form.netAmount || 0) - productCost;

  function save() {
    if (!form.patientId || !form.serviceId || !form.price) return;
    const validProds = saleProducts.filter((sp) => sp.productId && sp.qty > 0);
    const enriched = validProds.map((sp) => {
      const prod = products.find((x) => x.id === +sp.productId);
      return { productId: +sp.productId, qty: +sp.qty, costAtSale: prod?.avgCost || 0, sessionType: sp.sessionType };
    });
    const newSale = {
      id: Date.now(), ...form,
      patientId: +form.patientId, serviceId: +form.serviceId,
      price: +form.price, installments: +form.installments,
      creditFeeRate: +form.creditFeeRate, netAmount: +form.netAmount,
      downPaymentAmount: showEntry ? +form.downPaymentAmount : 0,
      downPaymentMethod: showEntry ? form.downPaymentMethod : "",
      paidInstallments: form.paymentMethod === "pixInstallment" ? (showEntry ? 1 : 0) : +form.installments,
      products: enriched, appointmentId: appointmentId || null,
    };
    setSales((prev) => [...prev, newSale]);
    setProducts((prev) => prev.map((p) => {
      const consumed = enriched.filter((x) => x.productId === p.id).reduce((s, x) => s + x.qty, 0);
      return consumed > 0 ? { ...p, totalQty: Math.max(0, p.totalQty - consumed) } : p;
    }));
    if (appointmentId) setAppointments((prev) => prev.map((a) => a.id === appointmentId ? { ...a, status: "done", saleId: newSale.id } : a));
    const svc = services.find((s) => s.id === +form.serviceId);
    const pat = patients.find((p) => p.id === +form.patientId);
    if (svc?.needsReturn) {
      const appt = { id: appointmentId || null, patientId: +form.patientId, serviceId: +form.serviceId, date: form.date };
      setPendingReturn({ appointment: appt, service: svc, patient: pat });
    }
    onClose();
  }

  const sortedProducts = sortByName(products);
  const sortedPatients = sortByName(patients);
  const sortedServices = sortByName(services.filter((s) => s.active));

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{appointmentId ? "Realizar Venda" : "Nova Venda"}</div>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">

        {/* Paciente + Procedimento */}
        <div className="form-row form-row-2">
          <div className="form-group">
            <label>Paciente</label>
            <select className="form-control" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Selecione...</option>
              {sortedPatients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Procedimento</label>
            <select className="form-control" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
              <option value="">Selecione...</option>
              {sortedServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

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

        {/* Produtos utilizados */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: T.grey, fontWeight: 500 }}>Produtos Utilizados <span style={{ color: T.grey, fontWeight: 400, fontSize: 11 }}>(opcional)</span></label>
            <button className="btn btn-sm btn-secondary" onClick={() => setSaleProducts((p) => [...p, { productId: "", qty: "", sessionType: "initial" }])}>+ Produto</button>
          </div>
          {saleProducts.map((sp, i) => {
            const prod = products.find((x) => x.id === +sp.productId);
            return (
              <div key={i} className="product-row">
                <select className="form-control" value={sp.productId} onChange={(e) => setSaleProducts((p) => p.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x))} style={{ flex: 2 }}>
                  <option value="">Selecione produto...</option>
                  {sortedProducts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.totalQty} {p.unit})</option>)}
                </select>
                <input type="number" className="form-control" placeholder="Qtd" style={{ width: 70 }} value={sp.qty}
                  onChange={(e) => setSaleProducts((p) => p.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x))} />
                <select className="form-control" value={sp.sessionType} onChange={(e) => setSaleProducts((p) => p.map((x, idx) => idx === i ? { ...x, sessionType: e.target.value } : x))} style={{ flex: 1 }}>
                  <option value="initial">Inicial</option>
                  <option value="retoque">Retoque</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="outro">Outro</option>
                </select>
                {saleProducts.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => setSaleProducts((p) => p.filter((_, idx) => idx !== i))}>✕</button>}
              </div>
            );
          })}
        </div>

        {/* Valor */}
        <div className="form-group">
          <label>Valor Cobrado (R$)</label>
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
          <div className="stat-row"><span className="stat-label">Valor líquido recebido</span><span style={{ fontWeight: 600 }}>{fmt(+form.netAmount || 0)}</span></div>
          {productCost > 0 && <div className="stat-row"><span className="stat-label">Custo produtos (CM)</span><span style={{ color: T.danger }}>-{fmt(productCost)}</span></div>}
          <div className="stat-row" style={{ borderTop: `2px solid ${T.dark}`, paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontWeight: 700 }}>Lucro estimado</span>
            <span style={{ fontWeight: 700, color: netValue >= 0 ? T.success : T.danger }}>{fmt(netValue)}</span>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Salvar Venda</button>
      </div>
    </>
  );
}

function PixInstallmentModal({ sale, ctx, onClose }) {
  const { patients, setSales } = ctx;
  const p = patients.find((x) => x.id === sale.patientId);
  const installmentValue = sale.price / sale.installments;

  function pay() {
    setSales((prev) => prev.map((s) => s.id === sale.id ? { ...s, paidInstallments: Math.min(s.installments, s.paidInstallments + 1) } : s));
    onClose();
  }

  return (
    <>
      <div className="modal-header"><div className="modal-title">Pix Parcelado — {p?.name}</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="stat-row"><span className="stat-label">Valor total</span><span className="stat-value">{fmt(sale.price)}</span></div>
        <div className="stat-row"><span className="stat-label">Parcelas pagas</span><span className="stat-value">{sale.paidInstallments}/{sale.installments}</span></div>
        <div className="stat-row"><span className="stat-label">Por parcela</span><span className="stat-value">{fmt(installmentValue)}</span></div>
        <div className="stat-row"><span className="stat-label">Saldo pendente</span><span className="stat-value" style={{ color: T.danger }}>{fmt((sale.installments - sale.paidInstallments) * installmentValue)}</span></div>
        <hr className="divider" />
        {Array.from({ length: sale.installments }, (_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.light}` }}>
            <span>Parcela {i + 1}</span><span>{fmt(installmentValue)}</span>
            <span className={`badge ${i < sale.paidInstallments ? "badge-ok" : "badge-warning"}`}>{i < sale.paidInstallments ? "✓ Pago" : "Pendente"}</span>
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        {sale.paidInstallments < sale.installments && <button className="btn btn-primary" onClick={pay}>✓ Registrar Pagamento</button>}
      </div>
    </>
  );
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
function PatientsPage({ ctx }) {
  const { patients, setPatients, sales, services, products, setModal } = ctx;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  function lastVisit(patientId) {
    const patSales = sales.filter((s) => s.patientId === patientId);
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
    const patSales = sales.filter((s) => s.patientId === selected.id);
    const totalSpent = patSales.reduce((s, x) => s + x.price, 0);
    const totalProfit = patSales.reduce((s, x) => s + calcNetValue(x), 0);
    const sessionLabel = { initial: "Inicial", retoque: "Retoque", manutencao: "Manutenção", outro: "Outro" };
    const lastV = lastVisit(selected.id);
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
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Histórico de Procedimentos</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Procedimento</th><th>Produto(s)</th><th>Valor</th><th>Lucro</th></tr></thead>
              <tbody>
                {patSales.length === 0 && <tr><td colSpan={5}><div className="empty">Nenhum procedimento</div></td></tr>}
                {patSales.slice().sort((a, b) => b.date.localeCompare(a.date)).map((s) => {
                  const sv = services.find((x) => x.id === s.serviceId);
                  const net = calcNetValue(s);
                  return (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td>{sv?.name}</td>
                      <td style={{ fontSize: 12 }}>
                        {s.products.map((sp, i) => {
                          const prod = products.find((x) => x.id === sp.productId);
                          return <div key={i}>{prod?.name}: {sp.qty} {prod?.unit} <span className="badge badge-grey" style={{ fontSize: 10 }}>{sessionLabel[sp.sessionType] || sp.sessionType}</span></div>;
                        })}
                      </td>
                      <td>{fmt(s.price)}</td>
                      <td style={{ color: T.success, fontWeight: 600 }}>{fmt(net)}</td>
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
                    <td><button className="btn btn-sm btn-secondary" onClick={() => setSelected(p)}>Ver histórico</button></td>
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

function PatientForm({ ctx, onClose }) {
  const { setPatients } = ctx;
  const [form, setForm] = useState({ name: "", phone: "", email: "", birthdate: "", notes: "", status: "ok" });
  function save() {
    if (!form.name) return;
    setPatients((prev) => [...prev, { id: Date.now(), ...form }]);
    onClose();
  }
  return (
    <>
      <div className="modal-header"><div className="modal-title">Novo Paciente</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
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
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function StockPage({ ctx }) {
  const { products, stockEntries, setModal } = ctx;
  const [tab, setTab] = useState("stock");

  function openNew() { setModal({ content: <ProductForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEntry(product) { setModal({ content: <StockEntryModal product={product} ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }

  return (
    <div>
      <div className="section-header">
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Estoque Atual</button>
          <button className={`tab ${tab === "entries" ? "active" : ""}`} onClick={() => setTab("entries")}>Histórico de Compras</button>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Produto</button>
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
                      <td><button className="btn btn-sm btn-secondary" onClick={() => openEntry(p)}>+ Compra</button></td>
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
              <thead><tr><th>Data</th><th>Produto</th><th>Qtd Comprada</th><th>Custo Total</th><th>Custo/Unidade</th><th>Fornecedor</th></tr></thead>
              <tbody>
                {stockEntries.length === 0 && <tr><td colSpan={6}><div className="empty">Nenhuma compra registrada</div></td></tr>}
                {stockEntries.slice().reverse().map((e) => {
                  const prod = products.find((x) => x.id === e.productId);
                  return (
                    <tr key={e.id}>
                      <td>{fmtDate(e.date)}</td><td>{prod?.name}</td>
                      <td>{e.qty} {prod?.unit}</td>
                      <td style={{ color: T.danger }}>{fmt(e.totalCost)}</td>
                      <td style={{ color: T.teal, fontWeight: 600 }}>{fmt(e.costPerUnit)}</td>
                      <td>{e.supplier || "—"}</td>
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

function ProductForm({ ctx, onClose }) {
  const { setProducts } = ctx;
  const [form, setForm] = useState({ name: "", unit: "unidade", totalQty: "", avgCost: "", minStock: "" });
  function save() {
    if (!form.name) return;
    setProducts((prev) => [...prev, { id: Date.now(), name: form.name, unit: form.unit, totalQty: +form.totalQty || 0, avgCost: +form.avgCost || 0, minStock: +form.minStock || 0 }]);
    onClose();
  }
  return (
    <>
      <div className="modal-header"><div className="modal-title">Novo Produto</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
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
        <div className="form-row form-row-3">
          <div className="form-group"><label>Qtd. Inicial</label><input type="number" className="form-control" value={form.totalQty} onChange={(e) => setForm({ ...form, totalQty: e.target.value })} /></div>
          <div className="form-group"><label>Custo Médio (R$/{form.unit})</label><input type="number" step="0.01" className="form-control" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} /></div>
          <div className="form-group"><label>Estoque Mínimo</label><input type="number" className="form-control" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

function StockEntryModal({ product, ctx, onClose }) {
  const { setProducts, setStockEntries } = ctx;
  const [form, setForm] = useState({ qty: "", totalCost: "", supplier: "", date: today() });
  const costPerUnit = form.qty > 0 && form.totalCost > 0 ? (+form.totalCost / +form.qty) : null;
  const newAvg = costPerUnit !== null ? (product.totalQty * product.avgCost + +form.totalCost) / (product.totalQty + +form.qty) : null;

  function save() {
    if (!form.qty || !form.totalCost) return;
    const cpu = +form.totalCost / +form.qty;
    const na = (product.totalQty * product.avgCost + +form.totalCost) / (product.totalQty + +form.qty);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, totalQty: p.totalQty + +form.qty, avgCost: +na.toFixed(4) } : p));
    setStockEntries((prev) => [...prev, { id: Date.now(), productId: product.id, qty: +form.qty, totalCost: +form.totalCost, costPerUnit: +cpu.toFixed(4), supplier: form.supplier, date: form.date }]);
    onClose();
  }

  return (
    <>
      <div className="modal-header"><div className="modal-title">Registrar Compra — {product.name}</div><button className="btn btn-ghost" onClick={onClose}>✕</button></div>
      <div className="modal-body">
        <div className="alert alert-info" style={{ display: "block" }}>
          Estoque atual: <strong>{product.totalQty} {product.unit}</strong> · Custo médio: <strong>{fmt(product.avgCost)}</strong>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Qtd ({product.unit})</label><input type="number" className="form-control" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
          <div className="form-group"><label>Custo Total (R$)</label><input type="number" step="0.01" className="form-control" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} /></div>
        </div>
        <div className="form-row form-row-2">
          <div className="form-group"><label>Fornecedor</label><input className="form-control" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          <div className="form-group"><label>Data</label><input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        {costPerUnit !== null && (
          <div className="card" style={{ background: T.light }}>
            <div className="stat-row"><span className="stat-label">Custo desta compra</span><span>{fmt(costPerUnit)}/{product.unit}</span></div>
            <div className="stat-row"><span className="stat-label">Novo estoque</span><span>{product.totalQty + +form.qty} {product.unit}</span></div>
            <div className="stat-row"><span style={{ fontWeight: 700 }}>Novo custo médio</span><span style={{ fontWeight: 700, color: T.teal }}>{fmt(newAvg)}/{product.unit}</span></div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Confirmar Compra</button>
      </div>
    </>
  );
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────
function ServicesPage({ ctx }) {
  const { services, setModal } = ctx;
  function openNew() { setModal({ content: <ServiceForm ctx={ctx} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }
  function openEdit(svc) { setModal({ content: <ServiceForm ctx={ctx} service={svc} onClose={() => setModal(null)} />, onClose: () => setModal(null) }); }

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
                  <td><button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>✏️ Editar</button></td>
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

  function save() {
    if (!form.name) return;
    const data = { ...form, price: +form.price, duration: +form.duration, returnDays: +form.returnDays };
    if (editing) setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, ...data } : s));
    else setServices((prev) => [...prev, { id: Date.now(), ...data }]);
    onClose();
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
function MonthlyChart({ sales, costs }) {
  // Build last 12 months of data
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const mSales = sales.filter((s) => s.date.startsWith(key));
    const mCosts = costs.filter((c) => c.date.startsWith(key));
    const revenue = mSales.reduce((s, x) => s + x.price, 0);
    const productCost = mSales.reduce((s, x) => s + calcSaleCost(x.products), 0);
    const fees = mSales.reduce((s, x) => s + (x.paymentMethod === "credit" ? (x.creditFeeRate / 100) * x.price : 0), 0);
    const opCosts = mCosts.reduce((s, c) => s + c.amount, 0);
    const netProfit = revenue - productCost - fees - opCosts;
    const clients = new Set(mSales.map((s) => s.patientId)).size;
    months.push({ key, label, revenue, netProfit, opCosts: opCosts + productCost + fees, clients });
  }

  // Only show months with data or last 6 if all empty
  const active = months.filter((m) => m.revenue > 0 || m.opCosts > 0);
  const display = active.length > 0 ? months.filter((m) => {
    const idx = months.indexOf(m);
    return idx >= months.length - 6;
  }) : months.slice(-6);

  const maxVal = Math.max(...display.map((m) => Math.max(m.revenue, Math.abs(m.netProfit), m.opCosts)), 1);
  const maxClients = Math.max(...display.map((m) => m.clients), 1);

  const [hovered, setHovered] = useState(null);
  const [visibleLines, setVisibleLines] = useState({ revenue: true, netProfit: true, opCosts: true, clients: true });

  const W = 100 / display.length;
  const chartH = 180;

  function pct(v) { return Math.max(0, (v / maxVal) * chartH); }
  function pctC(v) { return Math.max(0, (v / maxClients) * chartH); }

  const LINES = [
    { key: "revenue", label: "Faturamento", color: T.blue },
    { key: "netProfit", label: "Lucro Líquido", color: T.success },
    { key: "opCosts", label: "Despesas", color: T.danger },
    { key: "clients", label: "Clientes", color: T.warning, isClients: true },
  ];

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div className="section-title">📈 Evolução Mensal</div>
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
      <div style={{ position: "relative", height: chartH + 50, overflowX: "auto" }}>
        <div style={{ position: "relative", height: chartH, display: "flex", alignItems: "flex-end", gap: 0, borderBottom: `2px solid ${T.light}`, minWidth: 400 }}>
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
              </div>

              {/* Clients dot */}
              {visibleLines.clients && m.clients > 0 && (
                <div style={{ position: "absolute", bottom: pctC(m.clients) - 4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: T.warning, border: `2px solid white`, zIndex: 2 }} title={`Clientes: ${m.clients}`} />
              )}

              {/* Tooltip */}
              {hovered === i && (
                <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", background: T.dark, color: "white", borderRadius: 8, padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap", zIndex: 10, marginBottom: 6, lineHeight: 1.7, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                  {visibleLines.revenue && <div>💰 Faturamento: <strong>{fmt(m.revenue)}</strong></div>}
                  {visibleLines.netProfit && <div style={{ color: m.netProfit >= 0 ? "#6FCF97" : "#EB5757" }}>✅ Lucro: <strong>{fmt(m.netProfit)}</strong></div>}
                  {visibleLines.opCosts && <div style={{ color: "#EB8057" }}>📦 Despesas: <strong>{fmt(m.opCosts)}</strong></div>}
                  {visibleLines.clients && <div style={{ color: "#F2C94C" }}>👤 Clientes: <strong>{m.clients}</strong></div>}
                </div>
              )}
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

      {/* Legend summary row */}
      <div style={{ display: "flex", gap: 20, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.light}`, flexWrap: "wrap" }}>
        {display.slice(-1).map((m) => (
          <div key="summary" style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12 }}>
            <span style={{ color: T.blue }}>💰 {fmt(m.revenue)}</span>
            <span style={{ color: m.netProfit >= 0 ? T.success : T.danger }}>✅ {fmt(m.netProfit)}</span>
            <span style={{ color: T.danger }}>📦 {fmt(m.opCosts)}</span>
            <span style={{ color: T.warning }}>👤 {m.clients} clientes</span>
          </div>
        ))}
        <span style={{ color: T.grey, fontSize: 11, marginLeft: "auto" }}>Último mês com dados</span>
      </div>
    </div>
  );
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────
function FinancePage({ ctx }) {
  const { sales, costs, services, products } = ctx;
  const [month, setMonth] = useState(today().slice(0, 7));

  const mSales = sales.filter((s) => s.date.startsWith(month));
  const mCosts = costs.filter((c) => c.date.startsWith(month));
  const totalRevenue = mSales.reduce((s, x) => s + x.price, 0);
  const totalProductCost = mSales.reduce((s, x) => s + calcSaleCost(x.products), 0);
  const totalFees = mSales.reduce((s, x) => s + (x.paymentMethod === "credit" ? (x.creditFeeRate / 100) * x.price : 0), 0);
  const grossProfit = totalRevenue - totalProductCost - totalFees;
  const totalCosts = mCosts.reduce((s, c) => s + c.amount, 0);
  const netProfit = grossProfit - totalCosts;
  const avgTicket = mSales.length > 0 ? totalRevenue / mSales.length : 0;

  const svcCount = {};
  mSales.forEach((s) => { svcCount[s.serviceId] = (svcCount[s.serviceId] || 0) + 1; });
  const topServices = Object.entries(svcCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, count]) => ({ name: services.find((s) => s.id === +id)?.name || "—", count }));

  const byPayment = {};
  mSales.forEach((s) => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.price; });
  const payLabel = { pix: "Pix", credit: "Crédito", pixInstallment: "Pix Parcelado", cash: "Dinheiro" };

  const prodConsumption = {};
  mSales.forEach((s) => s.products.forEach((sp) => { prodConsumption[sp.productId] = (prodConsumption[sp.productId] || 0) + sp.qty; }));
  const topProducts = Object.entries(prodConsumption).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, qty]) => { const p = products.find((x) => x.id === +id); return { name: p?.name || "—", qty, unit: p?.unit || "" }; });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: T.grey, fontWeight: 500 }}>Mês (detalhes):</label>
        <input type="month" className="form-control" style={{ width: 200 }} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <MonthlyChart sales={sales} costs={costs} />
      <div className="grid-4">
        <MetricCard icon="💰" title="Faturamento" value={fmt(totalRevenue)} sub={`${mSales.length} vendas`} />
        <MetricCard icon="📦" title="Custo Produtos" value={fmt(totalProductCost)} sub="custo médio" color={T.danger} />
        <MetricCard icon="✅" title="Lucro Bruto" value={fmt(grossProfit)} sub="após produtos e taxas" color={grossProfit >= 0 ? T.success : T.danger} />
        <MetricCard icon="🏆" title="Lucro Líquido" value={fmt(netProfit)} sub="após operacional" color={netProfit >= 0 ? T.success : T.danger} />
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>📊 DRE Simplificado</div>
          <div className="stat-row"><span className="stat-label">Faturamento bruto</span><span className="stat-value">{fmt(totalRevenue)}</span></div>
          <div className="stat-row"><span className="stat-label">(-) Custo de produtos (CM)</span><span className="stat-value" style={{ color: T.danger }}>-{fmt(totalProductCost)}</span></div>
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
