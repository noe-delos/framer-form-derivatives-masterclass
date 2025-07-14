'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, TrendingUp, Building2 } from 'lucide-react';

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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users]);

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
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un futur trader..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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