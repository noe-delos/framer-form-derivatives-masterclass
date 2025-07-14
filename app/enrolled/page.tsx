/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, TrendingUp, Building2, Calendar, SlidersHorizontal, X } from 'lucide-react';

interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function EnrolledPage() {
  const [users, setUsers] = useState<EnrolledUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnrolledUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply date filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(user => {
        const enrolledDate = new Date(user.enrolled_at);
        return enrolledDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => new Date(user.enrolled_at) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => new Date(user.enrolled_at) >= monthAgo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.enrolled_at).getTime() - new Date(b.enrolled_at).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users, dateFilter, sortBy]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/enrolled');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-pulse flex flex-col items-center">
            <TrendingUp className="h-12 w-12 mb-4 text-yellow-400" />
            <div className="text-lg">Chargement des futurs traders...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Futurs Traders en Finance de Marché</h1>
          </div>
          <p className="text-gray-400 text-lg">Candidats inscrits pour décrocher leur Summer chez Goldman Sachs, JP Morgan, BNP Paribas...</p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-semibold">{users.length} inscrits</span>
            </div>
            <div className="text-yellow-400 font-bold">🚨 Places limitées</div>
          </div>
          {filteredUsers.length !== users.length && (
            <div className="mt-2 text-sm text-gray-500">
              {filteredUsers.length} résultats affichés sur {users.length} total
            </div>
          )}
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un futur trader..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                showFilters 
                  ? 'bg-yellow-400 text-black border-yellow-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="font-medium">Filtres</span>
              {(dateFilter !== 'all' || sortBy !== 'newest') && (
                <span className="ml-1 px-2 py-0.5 bg-black/20 rounded-full text-xs">
                  {[dateFilter !== 'all' && 1, sortBy !== 'newest' && 1].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Période d'inscription
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois-ci</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="oldest">Plus anciens</option>
                    <option value="name">Nom (A-Z)</option>
                  </select>
                </div>
              </div>

              {(dateFilter !== 'all' || sortBy !== 'newest') && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setSortBy('newest');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-950">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                  Candidat
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                  Date d'inscription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-yellow-400/10 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">Candidat #{users.length - index}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{formatDate(user.enrolled_at)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Aucun candidat trouvé</div>
              <div className="text-gray-600 text-sm mt-2">Essayez avec d'autres critères de recherche</div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} futurs traders
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}