import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { getAllUsers, UserProfile, ADMIN_EMAIL } from '../lib/userService';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Feil ved lasting av brukere:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Ukjent';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
                  Brukeradministrasjon
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Admin-panel
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Oversikt over alle brukere som har logget inn og har konto i systemet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition-colors"
            title="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin status banner & search bar */}
        <div className="p-4 bg-stone-100/70 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter navn, e-post..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs font-semibold text-stone-600">
              Totalt: <strong className="text-stone-900">{users.length}</strong> {users.length === 1 ? 'bruker' : 'brukere'}
            </span>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
              title="Oppdater brukerliste"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Oppdater</span>
            </button>
          </div>
        </div>

        {/* Users List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-stone-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-purple-600"></div>
              <p className="text-xs text-stone-500 font-medium">Henter registrerte brukerkontoer...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-8 shadow-xs">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800 text-sm">Ingen brukere funnet</h3>
              <p className="text-xs text-stone-500 mt-1">
                {searchQuery ? 'Ingen brukerkontoer matcher søket ditt.' : 'Det er foreløpig ingen registrerte brukere.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((u) => {
                const isAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                const isCurrent = u.email?.toLowerCase() === currentUserEmail?.toLowerCase();
                const initials = (u.displayName || u.email || 'B')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={u.uid}
                    className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAdmin
                        ? 'border-purple-300 bg-purple-50/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName || u.email}
                          className="w-10 h-10 rounded-full border border-stone-200 object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                            isAdmin
                              ? 'bg-purple-600 text-white'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {initials}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                            {u.displayName || 'Navnløs bruker'}
                          </h4>
                          {isAdmin ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Administrator
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                              Bruker
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              (Deg)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-stone-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            {u.email}
                          </span>
                          <button
                            onClick={() => handleCopyEmail(u.email)}
                            className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                            title="Kopier e-post"
                          >
                            {copiedEmail === u.email ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Timestamps */}
                    <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 sm:justify-end flex-shrink-0">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Sist aktiv:
                        </span>
                        <span className="text-stone-700 font-medium">
                          {formatDate(u.lastLoginAt || u.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> Registrert:
                        </span>
                        <span className="text-stone-700 font-medium">
                          {formatDate(u.createdAt || u.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>
            Innlogget som admin: <strong className="text-purple-700">{ADMIN_EMAIL}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
