'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/app/utils/axiosInstance';
import { ShieldCheck, ShieldAlert, Clock, RefreshCcw, Eye, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminPaymentLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['admin-payment-logs', page],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/admin/payment-logs?page=${page}`);
      console.log('📊 Payment logs response:', response.data);
      return response.data;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <ShieldCheck className="text-emerald-500 dark:text-emerald-400" size={16} strokeWidth={2.5} />;
      case 'ERROR': 
      case 'FAILED_SIGNATURE': return <ShieldAlert className="text-rose-500 dark:text-rose-400" size={16} strokeWidth={2.5} />;
      default: return <Clock className="text-gray-400 dark:text-slate-500" size={16} strokeWidth={2.5} />;
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <div className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
          Loading Audit Trail...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] dark:bg-slate-950 transition-colors p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 shadow-lg rounded-[24px] p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-rose-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Error Loading Logs</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          {error instanceof Error ? error.message : 'Failed to fetch payment logs'}
        </p>
        <button 
          onClick={() => refetch()} 
          className="px-6 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-32 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Payment Audit Logs
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Monitoring PayHere Webhook Activity
            </p>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCcw size={16} className={isRefetching ? "animate-spin" : ""} /> 
            {isRefetching ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        {/* MAIN TABLE CONTAINER */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/30">
              Live Monitoring
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800 custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-gray-50/80 dark:bg-slate-950/80 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                <tr>
                  <th className="p-5 pl-6 whitespace-nowrap">Status</th>
                  <th className="p-5 whitespace-nowrap">Order ID</th>
                  <th className="p-5 whitespace-nowrap">Payment ID</th>
                  <th className="p-5 whitespace-nowrap">PayHere Code</th>
                  <th className="p-5 whitespace-nowrap">Date/Time</th>
                  <th className="p-5 text-right pr-6 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                {data?.logs && data.logs.length > 0 ? (
                  data.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                      
                      {/* Status */}
                      <td className="p-4 pl-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className={`text-xs font-bold uppercase tracking-wide ${
                            log.status === 'SUCCESS' ? 'text-emerald-700 dark:text-emerald-400' : 
                            log.status === 'ERROR' || log.status === 'FAILED_SIGNATURE' ? 'text-rose-700 dark:text-rose-400' : 
                            'text-gray-700 dark:text-gray-300'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      
                      {/* Order ID */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-700 transition-colors group-hover:border-blue-300 dark:group-hover:border-blue-700">
                          #{log.orderId}
                        </span>
                      </td>
                      
                      {/* Payment ID */}
                      <td className="p-4 text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {log.paymentId || <span className="italic text-gray-300 dark:text-slate-600">N/A</span>}
                      </td>
                      
                      {/* PayHere Code */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          log.statusCode === "2" 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                          {log.statusCode || 'NONE'}
                        </span>
                      </td>
                    
                      {/* Date */}
                      <td className="p-4 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    
                      {/* Actions */}
                      <td className="p-4 text-right pr-6 whitespace-nowrap">
                        <button 
                          onClick={() => console.log(log.rawPayload)} 
                          className="inline-flex p-2 rounded-xl text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-800/30"
                          title="View Raw Payload"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <Clock size={32} className="text-gray-300 dark:text-slate-600" />
                        </div>
                        <p className="text-base font-medium text-gray-900 dark:text-white">No payment logs yet</p>
                        <p className="text-sm mt-1">Payment notifications will appear here once webhooks are received.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Page <span className="text-gray-900 dark:text-white font-bold">{page}</span> of <span className="text-gray-900 dark:text-white font-bold">{data?.totalPages || 1}</span>
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button 
                disabled={page >= (data?.totalPages || 1)}
                onClick={() => setPage(p => p + 1)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}