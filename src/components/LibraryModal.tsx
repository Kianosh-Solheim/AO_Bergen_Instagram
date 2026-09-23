import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Edit,
  Check,
  Copy,
  Plus,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  SavedProject,
  ProjectStatus,
  PROJECT_STATUSES,
  getProjects,
  deleteProject,
  renameProject,
  duplicateProject,
  updateProjectStatus,
} from '../lib/projectService';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  currentProjectId?: string | null;
  onLoadProject: (projectData: string, id: string) => void;
  onNewProject?: () => void;
  onProjectRenamed?: (id: string, newTitle: string) => void;
  onProjectDeleted?: (id: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  currentProjectId,
  onLoadProject,
  onNewProject,
  onProjectRenamed,
  onProjectDeleted,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [onlyMyPosts, setOnlyMyPosts] = useState(false);

  // Active status dropdown menu
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Fetches all projects across the team so all logged in users can see and collaborate
      const data = await getProjects(userId);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setEditingId(null);
      setConfirmDeleteId(null);
      setActionMessage(null);
      setOpenStatusMenuId(null);
    }
  }, [isOpen, userId]);

  const handleStartRename = (proj: SavedProject) => {
    setEditingId(proj.id);
    setEditTitle(proj.title || 'Uten tittel');
    setConfirmDeleteId(null);
    setOpenStatusMenuId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleSaveRename = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    try {
      await renameProject(id, trimmed);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: trimmed } : p))
      );
      setEditingId(null);
      if (onProjectRenamed) {
        onProjectRenamed(id, trimmed);
      }
      setActionMessage(`Navn oppdatert til "${trimmed}"`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Kunne ikke endre navn', error);
      setActionMessage('Kunne ikke endre navn. Prøv igjen.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    setOpenStatusMenuId(null);
    try {
      await updateProjectStatus(projectId, newStatus, {
        email: userEmail,
        displayName: userName,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      const statusLabel = PROJECT_STATUSES[newStatus]?.label || newStatus;
      setActionMessage(`Status endret til: "${statusLabel}"`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Kunne ikke endre status:', error);
      setActionMessage('Feil ved endring av status.');
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
      if (onProjectDeleted) {
        onProjectDeleted(id);
      }
      setActionMessage('Innlegget ble slettet.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Kunne ikke slette prosjekt', error);
      setActionMessage('Feil ved sletting av innlegg.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (proj: SavedProject) => {
    try {
      await duplicateProject(userId, proj.data, proj.title, {
        email: userEmail,
        displayName: userName,
      });
      await fetchProjects();
      setActionMessage(`Kopi opprettet: "${proj.title} (kopi)"`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Kunne ikke duplisere prosjekt', error);
      setActionMessage('Feil ved opprettelse av kopi.');
    }
  };

  // Status counts for filter chips
  const counts = useMemo(() => {
    const total = projects.length;
    let notStarted = 0;
    let inProgress = 0;
    let readyForPub = 0;
    let published = 0;

    projects.forEach((p) => {
      const s = p.status;
      if (s === 'not_started') notStarted++;
      else if (s === 'in_progress' || s === 'draft') inProgress++;
      else if (s === 'ready_for_publishing') readyForPub++;
      else if (s === 'published') published++;
    });

    return { total, notStarted, inProgress, readyForPub, published };
  }, [projects]);

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesCreator =
          p.creatorName?.toLowerCase().includes(q) ||
          p.creatorEmail?.toLowerCase().includes(q) ||
          p.lastUpdatedByName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCreator) return false;
      }

      // Mine only
      if (onlyMyPosts && p.userId !== userId) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'in_progress') {
          return p.status === 'in_progress' || p.status === 'draft';
        }
        return p.status === selectedStatusFilter;
      }

      return true;
    });
  }, [projects, searchQuery, selectedStatusFilter, onlyMyPosts, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200 animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
                Felles Bibliotek & Utkast
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                {projects.length} innlegg
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Alle innloggede teammedlemmer kan se, redigere og oppdatere status på innleggene her.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNewProject && (
              <button
                type="button"
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start nytt innlegg</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition-colors"
              title="Lukk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {actionMessage && (
          <div className="px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-stone-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Status Filter Bar */}
        <div className="p-3 sm:p-4 bg-stone-100/70 border-b border-stone-200 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i innlegg etter tittel eller forfatter..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Right filter controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyMyPosts(!onlyMyPosts)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  onlyMyPosts
                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Mine innlegg</span>
              </button>

              <button
                onClick={fetchProjects}
                disabled={isLoading}
                className="p-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg border border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
                title="Last innlegg på nytt"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                selectedStatusFilter === 'all'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200'
              }`}
            >
              <span>Alle innlegg</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800">
                {counts.total}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('not_started')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                selectedStatusFilter === 'not_started'
                  ? 'bg-stone-800 text-white border-stone-800 shadow-2xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
              <span>Ikke påbegynt</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {counts.notStarted}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                selectedStatusFilter === 'in_progress'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-blue-800 hover:bg-blue-50/50 border-blue-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Jobbes med</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('ready_for_publishing')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                selectedStatusFilter === 'ready_for_publishing'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50/50 border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Klar for publisering</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                {counts.readyForPub}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('published')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                selectedStatusFilter === 'published'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Publisert</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {counts.published}
              </span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 border-t-purple-600"></div>
              <p className="text-xs text-stone-500 font-medium">Henter felles innlegg...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-200 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Edit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1">Ingen innlegg funnet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
                {searchQuery || selectedStatusFilter !== 'all' || onlyMyPosts
                  ? 'Prøv å endre søkeord eller statusfilter for å se andre innlegg.'
                  : 'Biblioteket er tomt. Start et nytt innlegg for å dele det med teamet!'}
              </p>
              {onNewProject && (
                <button
                  onClick={() => {
                    onNewProject();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Opprett nytt innlegg
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredProjects.map((proj) => {
                const isActive = currentProjectId === proj.id;
                const isEditingThis = editingId === proj.id;
                const isConfirmingDelete = confirmDeleteId === proj.id;
                const isStatusMenuOpen = openStatusMenuId === proj.id;

                let slideCount = 0;
                try {
                  const parsed = JSON.parse(proj.data);
                  slideCount = parsed.slides?.length || 0;
                } catch {
                  slideCount = 0;
                }

                // Resolve current status metadata
                const currentStatusKey = proj.status || 'in_progress';
                const statusMeta = PROJECT_STATUSES[currentStatusKey] || PROJECT_STATUSES.in_progress;

                return (
                  <div
                    key={proj.id}
                    className={`bg-white border rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between relative ${
                      isActive
                        ? 'border-purple-500 ring-2 ring-purple-100'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top Badges & Status Selector */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isActive && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                              Aktiv nå
                            </span>
                          )}

                          {/* Interactive Status Dropdown Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenStatusMenuId(isStatusMenuOpen ? null : proj.id)}
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 cursor-pointer hover:brightness-95 transition-all ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                              title="Klikk for å endre status på dette innlegget"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}></span>
                              <span>{statusMeta.label}</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>

                            {/* Dropdown Menu */}
                            {isStatusMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 z-30 w-52 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 animate-in fade-in">
                                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
                                  Velg status:
                                </div>
                                {(
                                  [
                                    'not_started',
                                    'in_progress',
                                    'ready_for_publishing',
                                    'published',
                                  ] as ProjectStatus[]
                                ).map((stKey) => {
                                  const meta = PROJECT_STATUSES[stKey];
                                  const isSelected = proj.status === stKey;
                                  return (
                                    <button
                                      key={stKey}
                                      type="button"
                                      onClick={() => handleStatusChange(proj.id, stKey)}
                                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                                        isSelected
                                          ? 'bg-stone-100 text-stone-900 font-bold'
                                          : 'text-stone-700 hover:bg-stone-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                                        <span>{meta.label}</span>
                                      </div>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {slideCount > 0 && (
                          <span className="text-[11px] font-medium text-stone-500">
                            {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
                          </span>
                        )}
                      </div>

                      {/* Title & Rename Mode */}
                      {isEditingThis ? (
                        <div className="mt-1 mb-3">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                            Nytt navn på innlegg:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(proj.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              autoFocus
                              disabled={isRenaming}
                              className="flex-1 text-xs font-bold text-stone-900 bg-stone-50 border border-purple-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Skriv innleggsnavn..."
                            />
                            <button
                              onClick={() => handleSaveRename(proj.id)}
                              disabled={isRenaming || !editTitle.trim()}
                              className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                              title="Lagre navn"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              disabled={isRenaming}
                              className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors"
                              title="Avbryt"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-start justify-between gap-2 mt-1 mb-2">
                          <h3
                            className="font-bold text-stone-900 text-sm leading-snug line-clamp-2"
                            title={proj.title}
                          >
                            {proj.title || 'Uten tittel'}
                          </h3>
                          <button
                            onClick={() => handleStartRename(proj)}
                            className="opacity-70 hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-all flex-shrink-0"
                            title="Endre navn på dette innlegget"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Timestamps & Author info */}
                      <div className="space-y-1 mb-3 text-[11px] text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-400 flex-shrink-0" />
                          <span>
                            Sist lagret:{' '}
                            <span className="text-stone-700 font-medium">
                              {proj.updatedAt?.toDate
                                ? proj.updatedAt
                                    .toDate()
                                    .toLocaleDateString('no-NO', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                : 'Nylig'}
                            </span>
                          </span>
                        </div>

                        {(proj.lastUpdatedByName || proj.lastUpdatedByEmail || proj.creatorName || proj.creatorEmail) && (
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            <span className="truncate">
                              {proj.lastUpdatedByName || proj.lastUpdatedByEmail ? (
                                <>
                                  Endret av:{' '}
                                  <strong className="text-stone-700 font-medium">
                                    {proj.lastUpdatedByName || proj.lastUpdatedByEmail}
                                  </strong>
                                </>
                              ) : (
                                <>
                                  Av:{' '}
                                  <strong className="text-stone-700 font-medium">
                                    {proj.creatorName || proj.creatorEmail}
                                  </strong>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* In-Card Delete Confirmation */}
                    {isConfirmingDelete ? (
                      <div className="mt-3 pt-3 border-t border-red-100 bg-red-50/60 -mx-4 -mb-4 p-3 rounded-b-xl flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-red-800 text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Er du sikker på at du vil slette dette innlegget?</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-md border border-stone-200 transition-colors"
                          >
                            Avbryt
                          </button>
                          <button
                            onClick={() => handleDeleteConfirmed(proj.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isDeleting ? 'Sletter...' : 'Ja, slett'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Action Buttons */
                      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-stone-100">
                        <button
                          onClick={() => {
                            onLoadProject(proj.data, proj.id);
                            onClose();
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            isActive
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-stone-900 hover:bg-stone-800 text-white'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Fortsett redigering' : 'Åpne'}</span>
                        </button>

                        <button
                          onClick={() => handleDuplicate(proj)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                          title="Opprett en kopi av dette innlegget"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(proj.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-stone-200 hover:border-red-200 transition-colors"
                          title="Slett innlegg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
