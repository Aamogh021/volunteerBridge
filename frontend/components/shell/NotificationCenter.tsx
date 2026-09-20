/**
 * NotificationCenter component — Real-time notification bell dropdown and toast notifications.
 * Rendered in TopBar for all roles.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { AppNotification } from "@/types";

export default function NotificationCenter() {
  const router = useRouter();
  const { role } = useUserProfile();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    activeToast,
    clearToast,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNavigationPath = (notif: AppNotification): string => {
    if (role === "USER") {
      return "/user/requests";
    } else if (role === "VOLUNTEER") {
      return "/volunteer/assignments";
    } else if (role === "NGO_ADMIN") {
      if (notif.need_id) return "/dashboard/map";
      return "/dashboard";
    }
    return "/";
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    const targetPath = getNavigationPath(notif);
    setIsOpen(false);
    router.push(targetPath);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CRITICAL_NEED":
        return <AlertTriangle size={18} className="text-red-400" />;
      case "NEW_NEED":
        return <Sparkles size={18} className="text-amber-400" />;
      case "TASK_ASSIGNED":
        return <ClipboardList size={18} className="text-indigo-400" />;
      case "NEED_STATUS_UPDATE":
      case "TASK_STATUS_UPDATE":
        return <CheckCircle2 size={18} className="text-emerald-400" />;
      default:
        return <Info size={18} className="text-blue-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200"
        title="Notifications"
        aria-label="Toggle notifications menu"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Realtime Toast Banner */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-indigo-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              {getNotificationIcon(activeToast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{activeToast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{activeToast.message}</p>
              <button
                onClick={() => handleNotificationClick(activeToast)}
                className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                View details <ExternalLink size={12} />
              </button>
            </div>
            <button
              onClick={clearToast}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 100px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Loading updates...
              </div>
            ) : error ? (
              <div className="p-4 text-xs text-red-400 bg-red-500/10 border-l-2 border-red-500 m-3 rounded-r">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <CheckCheck size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-300">You're all caught up</p>
                <p className="text-xs text-slate-500 mt-1">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-white/5 ${
                    !notif.read ? "bg-indigo-500/10" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !notif.read ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"
                      title="Unread"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-slate-950/50 text-center">
            <span className="text-[10px] text-slate-500">
              Supabase Realtime • Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
