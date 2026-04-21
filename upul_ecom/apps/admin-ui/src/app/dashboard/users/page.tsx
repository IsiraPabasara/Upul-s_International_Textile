"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axiosInstance";
import {
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import UserDetailsModal from "./components/UserDetailsModal";
import RoleChangeModal from "./components/RoleChangeModal";
import UserSearchBar from "./components/UserSearchBar";

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const limitsPerPage = 10;

  // Fetch users
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "admin-users",
      searchQuery,
      currentPage,
      selectedRole,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/admin/users", {
        params: {
          search: searchQuery,
          page: currentPage,
          limit: limitsPerPage,
          role: selectedRole || undefined,
          sortBy,
          sortOrder,
        },
      });
      return response.data;
    },
    staleTime: 30000,
  });

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/admin/users/statistics");
      return response.data.data;
    },
    staleTime: 60000,
  });

  // Fetch user details when modal opens
  const { data: userDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["user-details", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;
      const response = await axiosInstance.get(
        `/api/admin/users/${selectedUser.id}`,
      );
      return response.data.data;
    },
    enabled: !!selectedUser?.id,
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; newRole: string }) => {
      const response = await axiosInstance.put(
        `/api/admin/users/${data.userId}/role`,
        { role: data.newRole },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`✅ Role updated to ${data.data.role}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] });
      setShowRoleModal(false);
      setSelectedUserForRole(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update role";
      toast.error(`❌ ${message}`);
    },
  });

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleChangeRole = (user: any) => {
    setSelectedUserForRole(user);
    setShowRoleModal(true);
  };

  const handleRoleChange = (newRole: string) => {
    if (selectedUserForRole?.id) {
      updateRoleMutation.mutate({
        userId: selectedUserForRole.id,
        newRole,
      });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role: string | null) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Pagination helpers
  const totalPages = usersData?.pagination?.totalPages || 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-32 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              User Management
            </h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Manage users, view their orders, and update roles.
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Users"
              value={stats.total}
              color="blue"
              icon={<Users size={28} strokeWidth={2} />}
            />
            <StatCard
              label="Admins"
              value={stats.byRole.admin}
              color="purple"
              icon={<ShieldCheck size={28} strokeWidth={2} />}
            />
            <StatCard
              label="New This Week"
              value={stats.newUsersThisWeek}
              color="green"
              icon={<UserPlus size={28} strokeWidth={2} />}
            />
            <StatCard
              label="New This Month"
              value={stats.newUsersThisMonth}
              color="cyan"
              icon={<BarChart3 size={28} strokeWidth={2} />}
            />
          </div>
        )}

        {/* Search and Filters Container */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96 flex-1">
            <UserSearchBar onSearch={handleSearch} />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            <button
              onClick={() => handleRoleFilter(null)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                selectedRole === null
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30"
                  : "bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              All Users
            </button>
            {["user", "admin"].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize whitespace-nowrap ${
                  selectedRole === role
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30"
                    : "bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                {role}s
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] p-20 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <span className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
              Loading users...
            </span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 rounded-[24px] p-8 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Error loading users
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {(error as any)?.response?.data?.message ||
                  "Please try again later."}
              </p>
            </div>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && usersData?.data && (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[24px] shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-gray-50/80 dark:bg-slate-950/80 text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                  <tr>
                    <th className="p-5 pl-6">
                      <button
                        onClick={() => toggleSort("firstname")}
                        className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        Name
                        {sortBy === "firstname" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp size={14} className="text-blue-500" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-500" />
                          ))}
                      </button>
                    </th>
                    <th className="p-5 font-semibold">Email</th>
                    <th className="p-5 font-semibold">Phone</th>
                    <th className="p-5">
                      <button
                        onClick={() => toggleSort("role")}
                        className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        Role
                        {sortBy === "role" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp size={14} className="text-blue-500" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-500" />
                          ))}
                      </button>
                    </th>
                    <th className="p-5">
                      <button
                        onClick={() => toggleSort("createdAt")}
                        className="flex items-center gap-1.5 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors group"
                      >
                        Joined
                        {sortBy === "createdAt" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp size={14} className="text-blue-500" />
                          ) : (
                            <ChevronDown size={14} className="text-blue-500" />
                          ))}
                      </button>
                    </th>
                    <th className="p-5 pr-6 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {usersData.data.map((user: any) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-5 pl-6">
                        <div className="font-bold text-gray-900 dark:text-white text-base">
                          {user.firstname} {user.lastname}
                        </div>
                      </td>
                      <td className="p-5 text-gray-500 dark:text-slate-400 font-medium">
                        {user.email}
                      </td>
                      <td className="p-5 text-gray-500 dark:text-slate-400 font-medium">
                        {user.phonenumber || (
                          <span className="italic opacity-50">N/A</span>
                        )}
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === "admin"
                              ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800/50 dark:text-purple-400"
                              : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-5 pr-6">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 rounded-xl text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-800/30"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleChangeRole(user)}
                            className="p-2 rounded-xl text-gray-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all active:scale-95 border border-transparent hover:border-purple-100 dark:hover:border-purple-800/30"
                            title="Change role"
                          >
                            <Shield size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {usersData.data.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Users
                    size={32}
                    className="text-gray-300 dark:text-slate-600"
                  />
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  No users found
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Try adjusting your search or role filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-2 border-t border-gray-200 dark:border-slate-800">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 hidden sm:block">
              Showing Page{" "}
              <span className="text-gray-900 dark:text-white font-bold">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="text-gray-900 dark:text-white font-bold">
                {totalPages}
              </span>
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent shadow-sm bg-transparent"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-sm ${
                      currentPage === page
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent shadow-sm bg-transparent"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <UserDetailsModal
          user={userDetails}
          isOpen={showDetailsModal}
          isLoading={detailsLoading}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />

        <RoleChangeModal
          user={selectedUserForRole}
          isOpen={showRoleModal}
          isLoading={updateRoleMutation.isPending}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUserForRole(null);
          }}
          onConfirm={handleRoleChange}
        />
      </div>
    </div>
  );
}

// Upgraded Statistics Card Component
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode; // <-- Changed from string to React.ReactNode
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> =
    {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-100 dark:border-blue-800/30",
        text: "text-blue-600 dark:text-blue-400",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-100 dark:border-purple-800/30",
        text: "text-purple-600 dark:text-purple-400",
      },
      green: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-100 dark:border-emerald-800/30",
        text: "text-emerald-600 dark:text-emerald-400",
      },
      cyan: {
        bg: "bg-cyan-50 dark:bg-cyan-900/20",
        border: "border-cyan-100 dark:border-cyan-800/30",
        text: "text-cyan-600 dark:text-cyan-400",
      },
    };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
      {/* Removed text-2xl here so Lucide icons size themselves correctly */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-center ${theme.bg} ${theme.border} ${theme.text}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
