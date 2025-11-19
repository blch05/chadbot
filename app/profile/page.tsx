'use client';

import { useAuth } from '@/hooks/useAuth';
import { useReadingList } from '@/hooks/useReadingList';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MarkAsReadModal } from '@/components/MarkAsReadModal';
import ReadingStatsChart from '@/components/ReadingStatsChart';
import { ReadingListBook } from '@/lib/types/readingList';

interface Recommendation {
  _id: string;
  bookId: string;
  title: string;
  authors?: string;
  thumbnail?: string;
  description?: string;
  publishedDate?: string;
  previewLink: string;
  clickedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { books: readingList, loading: loadingReadingList, removeFromReadingList, markAsRead } = useReadingList();
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    memberSince: '',
  });
  const [readingStats, setReadingStats] = useState<any | null>(null);
  const [loadingReadingStatsPanel, setLoadingReadingStatsPanel] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [removingBookId, setRemovingBookId] = useState<string | null>(null);
  const [selectedBookForRead, setSelectedBookForRead] = useState<ReadingListBook | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      // Calcular estadísticas
      const memberDate = user.createdAt ? new Date(user.createdAt) : new Date();
      setStats({
        totalConversations: 0, // Esto se puede cargar de la API
        totalMessages: 0,
        memberSince: memberDate.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
      
      // Cargar recomendaciones
      fetchRecommendations();

      // Cargar estadísticas de lectura
      loadReadingStats();
    }
  }, [user]);
  
  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const loadReadingStats = async (opts?: { period?: string; groupBy?: string }) => {
    setLoadingReadingStatsPanel(true);
    try {
      const response = await fetch('/api/reading-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ period: opts?.period || 'year', groupBy: opts?.groupBy || 'genre' }),
      });
      if (response.ok) {
        const data = await response.json();
        setReadingStats(data);
      } else {
        console.error('Error fetching reading stats', await response.text());
      }
    } catch (error) {
      console.error('Error al cargar estadísticas de lectura:', error);
    } finally {
      setLoadingReadingStatsPanel(false);
    }
  };
  
  const handleRemoveFromList = async (bookId: string) => {
    setRemovingBookId(bookId);
    try {
      await removeFromReadingList(bookId);
    } catch (error) {
      console.error('Error al eliminar libro:', error);
    } finally {
      setRemovingBookId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#251711]">
      {/* Header */}
      <header className="bg-[#251711] border-b border-[#3d2519] px-6 py-4 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              title="Volver al chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium text-white">Activo</span>
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMNA IZQUIERDA: Información Personal */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-lg overflow-hidden border-2 border-[#4d5a44]/50">
                <div className="bg-[#251711] h-24"></div>
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-4 -mt-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                      <span className="text-white font-bold text-4xl">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 mt-14">
                      <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                      <p className="text-white/80 text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                      <div className="text-2xl font-bold text-white">{stats.totalConversations}</div>
                      <div className="text-xs text-white/80 font-medium mt-1">Chats</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                      <div className="text-2xl font-bold text-white">{readingList.length}</div>
                      <div className="text-xs text-white/80 font-medium mt-1">Libros</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                      <div className="text-xs font-semibold text-white">Miembro</div>
                      <div className="text-xs text-white/80 font-medium mt-1">{stats.memberSince.split(' de ')[1]}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reading Stats Panel */}
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2">Estadísticas de lectura</h4>
                {loadingReadingStatsPanel ? (
                  <div className="text-xs text-white/70">Cargando estadísticas...</div>
                ) : readingStats ? (
                  <div className="text-xs text-white/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Total leídos</span>
                      <strong>{readingStats.totalBooks ?? 0}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Páginas totales</span>
                      <strong>{readingStats.totalPages ?? 0}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rating promedio</span>
                      <strong>{readingStats.avgRating ? Number(readingStats.avgRating).toFixed(2) : '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Racha actual</span>
                      <strong>{readingStats.currentStreakDays ?? 0} días</strong>
                    </div>
                    {readingStats.topGenres && readingStats.topGenres.length > 0 && (
                      <div>
                        <div className="text-xs text-white/70 mt-2">Géneros más leídos</div>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {readingStats.topGenres.slice(0, 5).map((g: any) => (
                            <span key={g.genre} className="text-xs bg-white/10 px-2 py-1 rounded text-white">{g.genre} ({g.count})</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <button onClick={() => loadReadingStats({ period: 'year', groupBy: 'genre' })} className="text-xs px-3 py-1 bg-white text-[#4d5a44] rounded-md">Refrescar</button>
                    </div>
                    {/* Chart */}
                    {readingStats.booksByPeriod && readingStats.booksByPeriod.length > 0 && (
                      <div className="mt-4">
                        <ReadingStatsChart booksByPeriod={readingStats.booksByPeriod} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-white/70">Sin datos aún</div>
                )}
              </div>

              {/* Account Details */}
              <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-lg p-6 border-2 border-[#4d5a44]/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-white">👤</span>
                  Detalles de la Cuenta
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <div>
                      <p className="text-xs font-medium text-white/80">Usuario</p>
                      <p className="text-sm text-white font-medium">{user.name}</p>
                    </div>
                    <button className="text-white hover:text-white/80 font-medium text-xs transition-colors">
                      Editar
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/20">
                    <div>
                      <p className="text-xs font-medium text-white/80">Email</p>
                      <p className="text-sm text-white font-medium">{user.email}</p>
                    </div>
                    <button className="text-white hover:text-white/80 font-medium text-xs transition-colors">
                      Editar
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-medium text-white/80">Contraseña</p>
                      <p className="text-sm text-white font-medium">••••••••</p>
                    </div>
                    <button className="text-white hover:text-white/80 font-medium text-xs transition-colors">
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-lg p-6 border-2 border-[#4d5a44]/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-white">⚙️</span>
                  Acciones
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full px-4 py-2.5 bg-white text-[#4d5a44] rounded-lg font-medium hover:bg-white/90 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Volver al Chat
                  </button>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2.5 bg-white border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-all text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Lista de Lectura y Recomendaciones */}
            <div className="space-y-6">
              {/* Lista de Lectura */}
              <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-lg p-6 border-2 border-[#4d5a44]/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <span>Mi Lista de Lectura</span>
                  <span className="text-sm font-normal text-[#251711] bg-white px-3 py-1 rounded-full">
                    {readingList.length}
                  </span>
                </h3>
                
                {loadingReadingList ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/80 mt-2 text-xs">Cargando lista...</p>
                  </div>
                ) : readingList.length === 0 ? (
                  <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <svg className="w-12 h-12 mx-auto text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-white text-sm font-medium">Tu lista está vacía</p>
                    <p className="text-xs text-white/70 mt-1">Agrega libros desde las recomendaciones</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {readingList.map((book) => (
                      <div
                        key={book._id}
                        className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/20 overflow-hidden hover:shadow-md hover:border-white/40 hover:bg-white/20 transition-all"
                      >
                        <div className="flex gap-3 p-3">
                          {book.thumbnail ? (
                            <img
                              src={book.thumbnail.replace('http:', 'https:')}
                              alt={book.title}
                              className="w-14 h-20 object-cover rounded shadow-sm border-2 border-white/30 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-20 bg-white/20 backdrop-blur-sm rounded shadow-sm flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-xs line-clamp-2 leading-snug mb-1">
                              {book.title}
                            </h4>
                            {book.authors && book.authors.length > 0 && (
                              <p className="text-xs text-white/80 font-medium mb-1">
                                {book.authors.join(', ')}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                              {book.pageCount && (
                                <span>📖 {book.pageCount}p</span>
                              )}
                              {book.averageRating && (
                                <span>⭐ {book.averageRating}</span>
                              )}
                              {book.isRead && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                                  ✓ Leído
                                </span>
                              )}
                            </div>
                            {/* Review preview */}
                            {book.userReview && (
                              <div className="text-xs text-white/70 mb-2">
                                <strong className="text-white">Reseña:</strong> {book.userReview.length > 200 ? `${book.userReview.slice(0, 200)}...` : book.userReview}
                              </div>
                            )}

                            <div className="flex gap-2">
                              {/* Edit/Add review button - opens the modal prefilled */}
                              <button
                                onClick={() => setSelectedBookForRead(book)}
                                className="inline-flex items-center gap-1 text-xs text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-medium transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {book.userReview ? 'Editar reseña' : 'Añadir reseña'}
                              </button>

                              <button
                                onClick={() => handleRemoveFromList(book.bookId)}
                                disabled={removingBookId === book.bookId}
                                className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 font-medium transition-colors disabled:opacity-50"
                              >
                                {removingBookId === book.bookId ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Eliminando...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Quitar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recomendaciones Recientes */}
              <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-lg p-6 border-2 border-[#4d5a44]/50">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  🎯 Recomendaciones de Leo
                </h3>
                <p className="text-xs text-white/80 mb-4">
                  Libros que exploraste previamente
                </p>
                
                {loadingRecs ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/80 mt-2 text-xs">Cargando...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <svg className="w-12 h-12 mx-auto text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-white text-sm">Sin recomendaciones aún</p>
                    <p className="text-xs text-white/70 mt-1">Pregúntale a Leo por libros</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {recommendations.map((rec) => (
                      <div
                        key={rec._id}
                        className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:shadow-sm hover:border-white/40 hover:bg-white/20 transition-all"
                      >
                        <div className="flex gap-2 p-2">
                          {rec.thumbnail ? (
                            <img
                              src={rec.thumbnail.replace('http:', 'https:')}
                              alt={rec.title}
                              className="w-10 h-14 object-cover rounded shadow-sm border border-white/30"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-white/20 backdrop-blur-sm rounded shadow-sm flex items-center justify-center border border-white/30">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-xs line-clamp-1 leading-snug">
                              {rec.title}
                            </h4>
                            {rec.authors && (
                              <p className="text-xs text-white/80 font-medium truncate">
                                {rec.authors}
                              </p>
                            )}
                            <p className="text-xs text-white/60">
                              {new Date(rec.clickedAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          </div>
                          
                          <a
                            href={rec.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#4d5a44] bg-white hover:bg-white/90 px-2 py-1 rounded font-medium transition-colors self-center"
                          >
                            Ver
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal para marcar como leído */}
      {selectedBookForRead && (
        <MarkAsReadModal
          book={selectedBookForRead}
          isOpen={!!selectedBookForRead}
          onClose={() => setSelectedBookForRead(null)}
          onMarkAsRead={markAsRead}
        />
      )}
    </div>
  );
}
