"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import toast from "react-hot-toast"; 
import {
  FileText,
  Download,
  Calendar,
  ShoppingCart,
  Package,
  Users,
  FileSpreadsheet,
  Tags,
  BarChart,
  Ticket,
  PieChart,
} from "lucide-react";

export default function ReportsPage() {
  const [activeSection, setActiveSection] = useState("ORDERS");

  // --- States (Only keeping the data filters!) ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [orderFormat, setOrderFormat] = useState("PDF");

  const [inventoryStatus, setInventoryStatus] = useState("ALL");
  const [inventoryFormat, setInventoryFormat] = useState("PDF");

  const [productVisibility, setProductVisibility] = useState("ALL");
  const [productFormat, setProductFormat] = useState("PDF");

  const [userRegistrationStart, setUserRegistrationStart] = useState("");
  const [userRegistrationEnd, setUserRegistrationEnd] = useState("");
  const [userRole, setUserRole] = useState("ALL");
  const [userFormat, setUserFormat] = useState("PDF");

  // --- Cart Frequency State ---
  const [cartFrequencyFormat, setCartFrequencyFormat] = useState("PDF");

  // --- Coupon Report State ---
  const [couponStatus, setCouponStatus] = useState("ALL");
  const [couponType, setCouponType] = useState("ALL");
  const [couponFormat, setCouponFormat] = useState("PDF");

  // --- Category Analytics State ---
  const [categoryStartDate, setCategoryStartDate] = useState("");
  const [categoryEndDate, setCategoryEndDate] = useState("");
  const [categoryFormat, setCategoryFormat] = useState("PDF");


  // 1. ORDER REPORT MUTATION

  const orderMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/orders/admin/report", {
        params: { startDate, endDate, status: orderStatus, format: orderFormat },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = orderFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Order_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Order report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate order report.");
    },
  });
  

  // 2. INVENTORY REPORT MUTATION

  const inventoryMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/products/inventory/report", {
        params: { status: inventoryStatus, format: inventoryFormat },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = inventoryFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Inventory_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Inventory report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate inventory report.");
    },
  });


  // 3. PRODUCT REPORT MUTATION

  const productMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/products/report", {
        params: { visibility: productVisibility, format: productFormat },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = productFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Product_Catalog.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Product catalog downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate product catalog.");
    },
  });

  // 4. USER REPORT MUTATION
  const userMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/admin/users/report", {
        params: {
          startDate: userRegistrationStart,
          endDate: userRegistrationEnd,
          role: userRole,
          format: userFormat,
        },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = userFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Users_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("User report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate user report.");
    },
  });

  // 5. CART FREQUENCY REPORT MUTATION

  const cartFrequencyMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/cart/report", {
        params: { format: cartFrequencyFormat },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = cartFrequencyFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Cart_Frequency_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Cart Frequency report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate Cart Frequency report.");
    },
  });


  // 7. CATEGORY REPORT MUTATION

  const categoryMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/api/categories/report", {
        params: { 
          
        },
        responseType: "blob",
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = categoryFormat === "EXCEL" ? "xlsx" : "pdf";
      link.setAttribute("download", `Upuls_Category_Analytics.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Category analytics report downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to generate Category report.");
    },
  });



  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* PAGE HEADER */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Generate and download business data for Upul's International
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-2">
              <button
                onClick={() => setActiveSection("ORDERS")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "ORDERS"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <ShoppingCart size={18} /> Order Reports
              </button>

              <button
                onClick={() => setActiveSection("INVENTORY")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "INVENTORY"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Package size={18} /> Inventory Reports
              </button>
              
              <button
                onClick={() => setActiveSection("PRODUCTS")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "PRODUCTS"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Tags size={18} /> Product Reports
              </button>
              
              <button
                onClick={() => setActiveSection("USERS")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "USERS"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Users size={18} /> User Reports
              </button>

              <button
                onClick={() => setActiveSection("CART_FREQUENCY")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "CART_FREQUENCY"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart size={18} /> Cart Analytics
              </button>

              <button
                onClick={() => setActiveSection("COUPONS")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "COUPONS"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Ticket size={18} /> Coupon Reports
              </button>

              <button
                onClick={() => setActiveSection("CATEGORIES")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeSection === "CATEGORIES"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <PieChart size={18} /> Category Analytics
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1">
            
            {/* ORDERS SECTION */}
            {activeSection === "ORDERS" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="text-blue-500" size={20} />
                    Generate Order Report
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Filter historical order data and export as PDF or Excel.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); orderMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Order Status</label>
                      <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Statuses</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="INTRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURNED">Returned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setOrderFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${orderFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setOrderFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${orderFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={orderMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {orderMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {orderMutation.isPending ? "Generating..." : "Generate & Download"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* INVENTORY SECTION */}
            {activeSection === "INVENTORY" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Package className="text-blue-500" size={20} /> Generate Inventory Report
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Export real-time stock levels, variants, and estimated asset values.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); inventoryMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Stock Status</label>
                      <select value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Inventory</option>
                        <option value="LOW_STOCK">Low Stock (Below 10)</option>
                        <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setInventoryFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${inventoryFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setInventoryFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${inventoryFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={inventoryMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {inventoryMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {inventoryMutation.isPending ? "Generating..." : "Generate & Download"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PRODUCTS SECTION */}
            {activeSection === "PRODUCTS" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Tags className="text-blue-500" size={20} /> Generate Product Catalog
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Export your complete product list, including pricing, discounts, and visibility status.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); productMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Visibility Status</label>
                      <select value={productVisibility} onChange={(e) => setProductVisibility(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Products</option>
                        <option value="ACTIVE">Active (Live) Only</option>
                        <option value="DRAFT">Drafts (Hidden) Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setProductFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${productFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setProductFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${productFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> EXCEL
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={productMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {productMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {productMutation.isPending ? "Generating..." : "Generate Catalog"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* USERS SECTION */}
            {activeSection === "USERS" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Users className="text-blue-500" size={20} /> Generate User Report
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Export user data by registration date range with contact information and account details.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); userMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={userRegistrationStart} onChange={(e) => setUserRegistrationStart(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">End Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={userRegistrationEnd} onChange={(e) => setUserRegistrationEnd(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">User Role</label>
                      <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Users</option>
                        <option value="admin">Admins Only</option>
                        <option value="user">Regular Users Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setUserFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${userFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setUserFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${userFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={userMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {userMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {userMutation.isPending ? "Generating..." : "Generate & Download"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CART FREQUENCY SECTION */}
            {activeSection === "CART_FREQUENCY" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BarChart className="text-blue-500" size={20} /> Generate Cart Frequency Report
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Export analytics on the most frequently added products in registered users' carts.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); cartFrequencyMutation.mutate(); }} className="space-y-6">
                  
                  <div className="grid grid-cols-1 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3 max-w-md">
                        <button type="button" onClick={() => setCartFrequencyFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${cartFrequencyFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setCartFrequencyFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${cartFrequencyFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={cartFrequencyMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {cartFrequencyMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {cartFrequencyMutation.isPending ? "Generating..." : "Generate & Download"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* COUPONS SECTION */}
            {activeSection === "COUPONS" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Ticket className="text-blue-500" size={20} /> Generate Coupon Report
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Export coupon usage, status, and configuration details.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); couponMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Coupon Status</label>
                      <select value={couponStatus} onChange={(e) => setCouponStatus(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Discount Type</label>
                      <select value={couponType} onChange={(e) => setCouponType(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer">
                        <option value="ALL">All Types</option>
                        <option value="PERCENTAGE">Percentage (%) Only</option>
                        <option value="FIXED">Fixed Amount (Rs.) Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3 max-w-md">
                        <button type="button" onClick={() => setCouponFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${couponFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setCouponFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${couponFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={couponMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {couponMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {couponMutation.isPending ? "Generating..." : "Generate & Download"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CATEGORIES SECTION */}
            {activeSection === "CATEGORIES" && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 dark:border-slate-800 pb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <PieChart className="text-blue-500" size={20} /> Generate Category Analytics
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Discover your most popular product categories based on actual sales data.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); categoryMutation.mutate(); }} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Start Date (Optional)</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={categoryStartDate} onChange={(e) => setCategoryStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">End Date (Optional)</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="date" value={categoryEndDate} onChange={(e) => setCategoryEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Export Format</label>
                      <div className="flex gap-3 max-w-md">
                        <button type="button" onClick={() => setCategoryFormat("PDF")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${categoryFormat === "PDF" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileText size={18} /> PDF
                        </button>
                        <button type="button" onClick={() => setCategoryFormat("EXCEL")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-sm ${categoryFormat === "EXCEL" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <FileSpreadsheet size={18} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={categoryMutation.isPending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      {categoryMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                      {categoryMutation.isPending ? "Generating..." : "Generate Analytics"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}