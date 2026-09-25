import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  MessageSquare,
  Clock,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const {
    pushNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setCurrentView,
    openProductModal,
    products,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notif: typeof pushNotifications[0]) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);

    if (notif.linkView) {
      setCurrentView(notif.linkView);
    }

    if (notif.metadata?.productId) {
      const found = products.find((p) => p.id === notif.metadata?.productId);
      if (found) {
        openProductModal(found);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Trigger Button with 3D pulse effect */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white/95 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
        aria-label={`Notificaciones push (${unreadNotificationsCount} sin leer)`}
        title="Notificaciones push"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu / Push Notification Feed */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 glass-panel-3d">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  Notificaciones Push
                </h4>
                {unreadNotificationsCount > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {unreadNotificationsCount} nuevas
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {pushNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Limpiar historial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer sm:hidden"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {pushNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 px-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-700">No hay notificaciones por ahora</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Te avisaremos cuando el estado de tu pedido cambie o el vendedor responda tus preguntas.
                  </p>
                </div>
              ) : (
                pushNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-blue-50/50 ${
                      !n.read ? 'bg-blue-50/25 font-medium' : 'bg-white opacity-85'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'order_status' && (
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      {n.type === 'chat_message' && (
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                      {n.type === 'sale_alert' && (
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {n.body}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{n.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Notificaciones en tiempo real activas para pedidos y chats
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
