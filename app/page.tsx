'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UIMessage } from '@ai-sdk/react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useReadingList } from '@/hooks/useReadingList';

function getMessageText(message: UIMessage): string {
  let text = '';
  
  for (const part of message.parts) {
    if (part.type === 'text') {
      text += part.text;
    } else if (part.type === 'tool-call') {
      const toolName = (part as any).toolName || 'herramienta';
      text += `🔍 Buscando ${toolName === 'searchBooks' ? 'libros' : toolName}...\n`;
    } else if (part.type === 'tool-result') {
      const result = (part as any).result;
      if (result && result.success && result.books && result.books.length > 0) {
        text += `\n✅ Encontré ${result.books.length} ${result.books.length === 1 ? 'libro' : 'libros'}\n`;
      }
    }
  }
  
  return text.trim();
}

function BookCard({ book }: { book: any}) {
  const [imageError, setImageError] = useState(false);
  
  const handleViewMore = async () => {
    // Guardar la recomendación antes de abrir el enlace
    try {
      await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          title: book.title,
          authors: book.authors,
          thumbnail: book.thumbnail,
          description: book.description,
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          pageCount: book.pageCount,
          rating: book.rating,
          previewLink: book.previewLink,
        }),
      });
      console.log('📚 Recomendación guardada:', book.title);
    } catch (error) {
      console.error('Error al guardar recomendación:', error);
    }
    
    // Abrir el enlace
    window.open(book.previewLink, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#616f55]/30 transition-all duration-200 mb-3">
      <div className="flex gap-4 p-4">
        {/* Portada */}
        <div className="flex-shrink-0">
          {book.thumbnail && !imageError ? (
            <img
              src={book.thumbnail.replace('http:', 'https:')}
              alt={book.title}
              className="w-24 h-32 object-cover rounded shadow-md border border-gray-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-24 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded shadow-md flex items-center justify-center border border-gray-300">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Información */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2 leading-snug">
            {book.title || 'Título no disponible'}
          </h3>
          
          {book.authors && (
            <p className="text-sm text-[#616f55] font-medium mb-2">
              ✍️ {book.authors}
            </p>
          )}
          
          {book.description && (
            <p className="text-xs text-gray-600 line-clamp-3 mb-2 leading-relaxed">
              {book.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            {book.publishedDate && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                📅 {book.publishedDate}
              </span>
            )}
            {book.pageCount > 0 && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                📖 {book.pageCount} págs.
              </span>
            )}
            {book.rating && book.rating !== 'Sin calificación' && (
              <span className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                ⭐ {book.rating}
              </span>
            )}
          </div>
          
          {book.previewLink && (
            <button
              onClick={handleViewMore}
              className="inline-flex items-center gap-1 text-xs text-white bg-[#616f55] hover:bg-[#4d5a44] px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              Ver más
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar detalles completos de un libro (búsqueda específica)
function DetailedBookCard({ book }: { book: any }) {
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { addToReadingList, removeFromReadingList, isInReadingList } = useReadingList();
  const [isAddingToList, setIsAddingToList] = useState(false);
  
  const bookId = book.id || book.bookId;
  const inList = isInReadingList(bookId);
  
  const handleToggleReadingList = async () => {
    setIsAddingToList(true);
    try {
      if (inList) {
        const result = await removeFromReadingList(bookId);
        if (result.success) {
          console.log('✅ Libro eliminado de lista de lectura');
        }
      } else {
        const result = await addToReadingList({
          bookId,
          title: book.title,
          authors: Array.isArray(book.authors) ? book.authors : (book.authors ? [book.authors] : []),
          thumbnail: book.imageLinks?.thumbnail || book.thumbnail,
          description: book.description,
          publishedDate: book.publishedDate,
          pageCount: book.pageCount,
          categories: Array.isArray(book.categories) ? book.categories : [],
          averageRating: book.rating?.average || book.averageRating,
          priority: 'medium',
          notes: '',
        });
        if (result.success) {
          console.log('✅ Libro agregado a lista de lectura');
        }
      }
    } catch (error) {
      console.error('Error al modificar lista de lectura:', error);
    } finally {
      setIsAddingToList(false);
    }
  };
  
  const handleViewMore = async () => {
    try {
      await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          title: book.title,
          authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors,
          thumbnail: book.imageLinks?.thumbnail || book.thumbnail,
          description: book.description,
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          pageCount: book.pageCount,
          rating: book.rating || book.averageRating,
          previewLink: book.previewLink || book.links?.preview,
        }),
      });
      console.log('📚 Recomendación guardada:', book.title);
    } catch (error) {
      console.error('Error al guardar recomendación:', error);
    }
    
    const link = book.previewLink || book.links?.preview || book.infoLink || book.links?.info;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };
  
  const thumbnail = book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.thumbnail || book.thumbnail;
  const authors = Array.isArray(book.authors) ? book.authors : (book.authors ? [book.authors] : []);
  const categories = Array.isArray(book.categories) ? book.categories : [];
  const isbn = Array.isArray(book.isbn) ? book.isbn : [];
  
  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-xl border-2 border-[#616f55]/20 overflow-hidden shadow-lg mb-4">
      <div className="p-6">
        <div className="flex gap-6 mb-6">
          {/* Portada Grande */}
          <div className="flex-shrink-0">
            {thumbnail && !imageError ? (
              <img
                src={thumbnail.replace('http:', 'https:')}
                alt={book.title}
                className="w-40 h-56 object-cover rounded-lg shadow-xl border-2 border-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-40 h-56 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-lg shadow-xl flex items-center justify-center border-2 border-gray-300">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Información Principal */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-xl mb-2 leading-tight">
              {book.title || 'Título no disponible'}
            </h3>
            
            {book.subtitle && (
              <p className="text-sm text-gray-600 italic mb-3">
                {book.subtitle}
              </p>
            )}
            
            {authors.length > 0 && (
              <p className="text-base text-[#616f55] font-semibold mb-3 flex items-center gap-2">
                <span>✍️</span>
                <span>{authors.join(', ')}</span>
              </p>
            )}
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {book.publisher && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Editorial</p>
                  <p className="text-sm font-medium text-gray-900">{book.publisher}</p>
                </div>
              )}
              
              {book.publishedDate && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Publicación</p>
                  <p className="text-sm font-medium text-gray-900">{book.publishedDate}</p>
                </div>
              )}
              
              {book.pageCount && book.pageCount > 0 && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Páginas</p>
                  <p className="text-sm font-medium text-gray-900">{book.pageCount}</p>
                </div>
              )}
              
              {book.language && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Idioma</p>
                  <p className="text-sm font-medium text-gray-900 uppercase">{book.language}</p>
                </div>
              )}
            </div>
            
            {/* Rating */}
            {(book.rating?.average || book.averageRating) && (
              <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {book.rating?.average || book.averageRating}/5
                  </p>
                  <p className="text-xs text-gray-600">
                    {book.rating?.count || book.ratingsCount || 0} reseñas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Descripción */}
        {book.description && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📝</span>
              <span>Descripción</span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className={`text-sm text-gray-700 leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                {book.description}
              </p>
              {book.description.length > 300 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs text-[#616f55] hover:text-[#4d5a44] font-medium mt-2"
                >
                  {showFullDescription ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Categorías */}
        {categories.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🏷️</span>
              <span>Categorías</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-[#616f55]/10 text-[#616f55] px-3 py-1 rounded-full text-xs font-medium border border-[#616f55]/20"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* ISBN */}
        {isbn.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🔢</span>
              <span>ISBN</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {isbn.map((id: any, idx: number) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-mono border border-gray-300"
                >
                  {id.type}: {id.identifier}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Información de Venta */}
        {book.saleInfo && book.saleInfo.available && (
          <div className="mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    💰 Disponible para compra
                  </p>
                  {book.saleInfo.price && (
                    <p className="text-xs text-green-700">
                      {book.saleInfo.price.amount} {book.saleInfo.price.currencyCode}
                    </p>
                  )}
                  {book.saleInfo.isEbook && (
                    <span className="inline-block mt-1 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                      eBook disponible
                    </span>
                  )}
                </div>
                {book.saleInfo.buyLink && (
                  <a
                    href={book.saleInfo.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Comprar
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Botones de Acción */}
        <div className="flex gap-3">
          {/* Botón Lista de Lectura */}
          <button
            onClick={handleToggleReadingList}
            disabled={isAddingToList}
            className={`flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-lg font-semibold transition-all ${
              inList
                ? 'bg-red-50 text-red-600 border-2 border-red-300 hover:bg-red-100'
                : 'bg-[#616f55] text-white hover:bg-[#4d5a44] hover:shadow-lg'
            } ${isAddingToList ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={inList ? 'Quitar de lista de lectura' : 'Agregar a lista de lectura'}
          >
            {isAddingToList ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : inList ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            )}
            {inList ? 'En mi lista' : 'Agregar a lista'}
          </button>
          
          {(book.previewLink || book.links?.preview) && (
            <button
              onClick={handleViewMore}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-white bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista Previa
            </button>
          )}
          
          {(book.infoLink || book.links?.info) && (
            <a
              href={book.infoLink || book.links?.info}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-[#616f55] bg-white hover:bg-gray-50 px-4 py-3 rounded-lg font-semibold border-2 border-[#616f55] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Más Info
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const {
    conversations,
    isLoading: conversationsLoading,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversationMessages,
    saveMessage,
  } = useConversations();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const lastSavedMessageCount = useRef(0);
  const isLoadingMessages = useRef(false);
  const [bookSearchResults, setBookSearchResults] = useState<Map<string, any[]>>(new Map());
  const [currentBookIndex, setCurrentBookIndex] = useState<Map<string, number>>(new Map());
  const [messageTimestamps, setMessageTimestamps] = useState<Map<string, Date>>(new Map());
  
  const {
    messages,
    status,
    error,
    sendMessage,
    regenerate,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER RETURN
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Guardar timestamp cuando aparece un nuevo mensaje
  useEffect(() => {
    messages.forEach(message => {
      if (!messageTimestamps.has(message.id)) {
        setMessageTimestamps(prev => {
          const newMap = new Map(prev);
          newMap.set(message.id, new Date());
          return newMap;
        });
      }
    });
  }, [messages, messageTimestamps]);
  
  // Detectar tool calls de searchBooks y ejecutar la búsqueda
  useEffect(() => {
    console.log('🔄 useEffect de detección ejecutado. Total mensajes:', messages.length);
    
    messages.forEach(message => {
      if (message.role === 'assistant') {
        console.log(`🤖 Analizando mensaje assistant ${message.id}:`, {
          partsCount: message.parts.length,
          partsTypes: message.parts.map((p: any) => p.type),
        });
        
        message.parts.forEach((part: any, index) => {
          if (part.type === 'tool-searchBooks') {
            const messageId = message.id;
            
            console.log(`🔍 Detectada llamada a searchBooks en mensaje ${messageId}!`);
            console.log('🔎 Query de búsqueda:', part.input?.query || 'NO HAY QUERY');
            console.log('🔎 MaxResults:', part.input?.maxResults || 'default');
            
            // Si ya tenemos resultados para este mensaje, no buscar de nuevo
            if (bookSearchResults.has(messageId)) {
              console.log(`⏭️ Ya tenemos resultados para mensaje ${messageId}, saltando...`);
              return;
            }
            
            console.log('🔍 Detectada llamada a searchBooks!');
            
            // Los resultados ya están en part.output.books
            if (part.output && part.output.books && Array.isArray(part.output.books)) {
              console.log(`✅ Encontrados ${part.output.books.length} libros en el output`);
              console.log(`📚 Primeros libros:`, part.output.books.slice(0, 3).map((b: any) => b.title));
              setBookSearchResults(prev => {
                const newMap = new Map(prev);
                newMap.set(messageId, part.output.books);
                console.log(`💾 Guardando ${part.output.books.length} libros para mensaje ${messageId}`);
                return newMap;
              });
            } else if (part.input && part.input.query) {
              // Fallback: si no hay output, ejecutar la búsqueda
              const query = part.input.query;
              const maxResults = part.input.maxResults || 10;
              
              console.log(`� No hay output, ejecutando búsqueda para: "${query}"`);
              
              fetch(`/api/books/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.books) {
                    console.log(`✅ Búsqueda completada: ${data.books.length} libros`);
                    setBookSearchResults(prev => {
                      const newMap = new Map(prev);
                      newMap.set(messageId, data.books);
                      return newMap;
                    });
                  }
                })
                .catch(error => {
                  console.error('❌ Error en búsqueda:', error);
                });
            } else {
              console.log('⚠️ No se encontró output ni input en el part:', part);
            }
          }
          
          // Detectar getBookDetails
          if (part.type === 'tool-getBookDetails') {
            const messageId = message.id;
            
            console.log(`📖 Detectada llamada a getBookDetails en mensaje ${messageId}!`);
            
            // Si ya tenemos resultados para este mensaje, no buscar de nuevo
            if (bookSearchResults.has(messageId)) {
              console.log(`⏭️ Ya tenemos detalles para mensaje ${messageId}, saltando...`);
              return;
            }
            
            // Los detalles ya están en part.output.book
            if (part.output && part.output.book) {
              console.log(`✅ Detalles del libro recibidos para mensaje ${messageId}`);
              // Guardar como un array de un solo libro para mostrarlo en el carousel
              setBookSearchResults(prev => {
                const newMap = new Map(prev);
                newMap.set(messageId, [part.output.book]);
                console.log(`💾 Guardando detalles del libro para mensaje ${messageId}`);
                return newMap;
              });
            } else if (part.input && part.input.bookId) {
              // Fallback: si no hay output, ejecutar la búsqueda de detalles
              const bookId = part.input.bookId;
              
              console.log(`🔄 No hay output, obteniendo detalles para bookId: "${bookId}"`);
              
              fetch(`/api/books/${bookId}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.book) {
                    console.log(`✅ Detalles del libro obtenidos`);
                    setBookSearchResults(prev => {
                      const newMap = new Map(prev);
                      newMap.set(messageId, [data.book]);
                      return newMap;
                    });
                  }
                })
                .catch(error => {
                  console.error('❌ Error obteniendo detalles:', error);
                });
            }
          }
        });
      }
    });
    
    // Log final del estado de bookSearchResults
    console.log('📊 Estado final de bookSearchResults:', {
      size: bookSearchResults.size,
      keys: Array.from(bookSearchResults.keys()),
      entries: Array.from(bookSearchResults.entries()).map(([key, books]) => ({
        messageId: key,
        booksCount: books.length
      }))
    });
  }, [messages]);
  
  // Debug: Monitorear cambios en los mensajes
  useEffect(() => {
    console.log('📨 Mensajes actualizados:', {
      total: messages.length,
      status: status,
      lastMessage: messages[messages.length - 1] ? {
        id: messages[messages.length - 1].id,
        role: messages[messages.length - 1].role,
        partsCount: messages[messages.length - 1].parts.length,
        partsTypes: messages[messages.length - 1].parts.map((p: any) => p.type)
      } : null
    });
  }, [messages, status]);
  
  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('❌ Usuario no autenticado, redirigiendo a login');
      router.push('/auth/login');
    } else if (!authLoading && isAuthenticated) {
      console.log('✅ Usuario autenticado:', user?.name);
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Guardar mensajes en BD cuando el bot termine de responder
  useEffect(() => {
    const saveMessagesToDb = async () => {
      console.log('🔍 Verificando si guardar mensajes:', {
        isLoadingMessages: isLoadingMessages.current,
        status,
        messagesLength: messages.length,
        lastSavedCount: lastSavedMessageCount.current,
        hasConversationId: !!currentConversationId,
        conversationId: currentConversationId,
        bookSearchResultsSize: bookSearchResults.size
      });
      
      // No guardar si estamos cargando mensajes desde BD
      if (isLoadingMessages.current) {
        console.log('⏸️ No guardando: cargando mensajes desde BD');
        return;
      }
      
      if (status === 'ready' && messages.length > lastSavedMessageCount.current && currentConversationId) {
        console.log('💾 Guardando mensajes nuevos...');
        
        // Guardar solo los mensajes nuevos
        const newMessages = messages.slice(lastSavedMessageCount.current);
        console.log('📝 Mensajes nuevos a guardar:', newMessages.length);
        
        for (const msg of newMessages) {
          // Extraer contenido de texto
          const content = msg.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join('');
          
          // Extraer libros si existen para este mensaje
          const books = bookSearchResults.get(msg.id) || [];
          
          // Guardar mensajes con contenido de texto O con libros
          // Esto evita guardar tool-calls y tool-results vacíos SIN libros
          if (content.trim().length > 0 || books.length > 0) {
            console.log('💬 Guardando mensaje:', { 
              id: msg.id,
              role: msg.role, 
              preview: content.slice(0, 50) || '(sin texto, con libros)', 
              booksCount: books.length,
              hasBooks: books.length > 0,
              bookSearchResultsHasThisId: bookSearchResults.has(msg.id),
              allBookSearchResultsKeys: Array.from(bookSearchResults.keys())
            });
            
            if (books.length > 0) {
              console.log('📚 Libros que se van a guardar:', books.map((b: any) => ({
                id: b.id,
                title: b.title
              })));
            }
            
            // Asegurarse de que content sea string, no undefined
            await saveMessage(currentConversationId, msg.role as 'user' | 'assistant', content || '', books);
            console.log('✅ Mensaje guardado en BD');
          }
        }
        
        lastSavedMessageCount.current = messages.length;
        
        // Actualizar metadata de la conversación
        const firstUserMessage = messages.find(m => m.role === 'user');
        const preview = firstUserMessage ? getMessageText(firstUserMessage).slice(0, 50) : '';
        
        console.log('🔄 Actualizando metadata de conversación...');
        await updateConversation(currentConversationId, {
          messageCount: messages.length,
          preview: preview,
        });
      } else {
        console.log('⏭️ No guardando mensajes porque:', {
          statusReady: status === 'ready',
          hasNewMessages: messages.length > lastSavedMessageCount.current,
          hasConversationId: !!currentConversationId
        });
      }
    };

    saveMessagesToDb();
  }, [status, messages, currentConversationId, saveMessage, updateConversation, bookSearchResults]);

  const handleNewChat = async () => {
    setMessages([]);
    setInput('');
    setCurrentConversationId(null);
    setBookSearchResults(new Map());
    setCurrentBookIndex(new Map());
    setMessageTimestamps(new Map());
    lastSavedMessageCount.current = 0;
    isLoadingMessages.current = false;
  };

  const handleSelectConversation = async (id: string) => {
    // Si ya estamos en esa conversación, no hacer nada
    if (id === currentConversationId) {
      return;
    }
    
    isLoadingMessages.current = true;
    setCurrentConversationId(id);
    lastSavedMessageCount.current = 0;
    
    // Limpiar mensajes primero
    setMessages([]);
    
    // Cargar mensajes de la conversación
    const loadedMessages = await loadConversationMessages(id);
    
    console.log('📥 Mensajes cargados desde BD:', loadedMessages.length);
    console.log('🔍 Detalle de TODOS los mensajes:');
    loadedMessages.forEach((m: any, idx: number) => {
      console.log(`  Mensaje ${idx + 1}:`, JSON.stringify({
        id: m._id?.toString(),
        role: m.role,
        hasBooks: !!m.books,
        booksIsArray: Array.isArray(m.books),
        booksLength: m.books?.length || 0,
        booksValue: m.books,
        preview: m.content?.slice(0, 50)
      }, null, 2));
    });
    
    // Eliminar duplicados por contenido y tiempo
    const uniqueMessages = loadedMessages.filter((msg: any, index: number, self: any[]) => {
      return index === self.findIndex((m: any) => 
        m.content === msg.content && 
        m.role === msg.role &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000
      );
    });
    
    console.log('📊 Mensajes únicos:', uniqueMessages.length);
    
    // Preparar Maps para actualizar de una sola vez
    const newBookSearchResults = new Map<string, any[]>();
    const newMessageTimestamps = new Map<string, Date>();
    
    // Convertir mensajes de BD a formato UIMessage
    const uiMessages = uniqueMessages.map((msg: any, index: number) => {
      const messageId = msg._id?.toString() || `msg-${Date.now()}-${index}`;
      
      // Si el mensaje tiene libros, agregarlos al Map
      if (msg.books && msg.books.length > 0) {
        console.log(`📚 Restaurando ${msg.books.length} libros para mensaje ${messageId}`);
        newBookSearchResults.set(messageId, msg.books);
      }
      
      // Agregar timestamp del mensaje
      if (msg.createdAt) {
        newMessageTimestamps.set(messageId, new Date(msg.createdAt));
      }
      
      return {
        id: messageId,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
      };
    });
    
    // Actualizar estados de una sola vez
    console.log(`🔄 Actualizando bookSearchResults con ${newBookSearchResults.size} mensajes con libros`);
    setBookSearchResults(newBookSearchResults);
    setMessageTimestamps(newMessageTimestamps);
    
    setMessages(uiMessages);
    lastSavedMessageCount.current = uiMessages.length;
    
    // Permitir guardar nuevos mensajes después de cargar
    setTimeout(() => {
      isLoadingMessages.current = false;
    }, 500);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta conversación?')) {
      await deleteConversation(id);
      if (currentConversationId === id) {
        setMessages([]);
        lastSavedMessageCount.current = 0;
        isLoadingMessages.current = false;
      }
    }
  };

  const handleCopyMessage = async (text: string, id: string) => {
    try {
      // Verificar si este mensaje tiene resultados de búsqueda de libros
      const books = bookSearchResults.get(id);
      if (books && books.length > 0) {
        // Si hay libros, copiar el ID del libro actual en el carrusel
        const currentIndex = currentBookIndex.get(id) || 0;
        const currentBook = books[currentIndex];
        await navigator.clipboard.writeText(currentBook.id);
        console.log('📋 ID del libro copiado:', currentBook.id);
      } else {
        // Si no hay libros, copiar el texto del mensaje
        await navigator.clipboard.writeText(text);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleRegenerateResponse = () => {
    regenerate();
  };

  const handleNextBook = (messageId: string, totalBooks: number) => {
    setCurrentBookIndex(prev => {
      const newMap = new Map(prev);
      const currentIndex = newMap.get(messageId) || 0;
      newMap.set(messageId, (currentIndex + 1) % totalBooks);
      return newMap;
    });
  };

  const handlePrevBook = (messageId: string, totalBooks: number) => {
    setCurrentBookIndex(prev => {
      const newMap = new Map(prev);
      const currentIndex = newMap.get(messageId) || 0;
      newMap.set(messageId, currentIndex === 0 ? totalBooks - 1 : currentIndex - 1);
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Crear nueva conversación si es el primer mensaje
    if (!currentConversationId && messages.length === 0) {
      const title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
      const conv = await createConversation(title, input.slice(0, 50));
      if (conv) {
        lastSavedMessageCount.current = 0;
      }
    }
    
    await sendMessage({ text: input });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // AHORA SÍ, LOS RETURNS CONDICIONALES
  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje antes de redireccionar
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Verificar que tengamos el usuario
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
          <p className="text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f6]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#251711] border-r border-[#3d2519] flex flex-col shadow-lg h-screen">
        <div className="p-4 border-b border-[#3d2519] flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#616f55] to-[#4d5a44] text-white rounded-lg font-medium hover:from-[#4d5a44] hover:to-[#616f55] transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Chat
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden min-h-0 sidebar-scroll">
          <div className="space-y-4">
            {/* Historial de Conversaciones */}
            <div className="space-y-2">
              <div className="px-3 py-2 text-xs font-semibold text-[#faf8f6]/60 uppercase tracking-wider flex items-center justify-between">
                <span>Historial</span>
                {conversationsLoading && (
                  <svg className="animate-spin h-3 w-3 text-[#faf8f6]/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
              
              {conversations.length === 0 && !conversationsLoading && (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-[#faf8f6]/50">No hay conversaciones guardadas</p>
                </div>
              )}

              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    currentConversationId === conv.id 
                      ? 'bg-[#616f55]/30 border-l-4 border-[#616f55] hover:bg-[#616f55]/40' 
                      : 'hover:bg-[#3d2519]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#faf8f6] truncate">
                        {conv.title}
                      </p>
                      {conv.preview && (
                        <p className="text-xs text-[#faf8f6]/60 truncate mt-0.5">
                          {conv.preview}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#faf8f6]/50">
                          {conv.messageCount} msgs
                        </span>
                        <span className="text-xs text-[#faf8f6]/50">•</span>
                        <span className="text-xs text-[#faf8f6]/50">
                          {new Date(conv.updatedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      title="Eliminar conversación"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#3d2519] bg-[#1a0f0b] flex-shrink-0">
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#faf8f6] truncate">{user.name}</p>
                <p className="text-xs text-[#faf8f6]/70 truncate">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/profile')}
                className="w-full px-3 py-2 bg-[#616f55] text-[#faf8f6] rounded-lg text-sm font-medium hover:bg-[#4d5a44] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver Perfil
              </button>
              <button
                onClick={logout}
                className="w-full px-3 py-2 bg-[#251711] border border-[#3d2519] text-[#faf8f6] rounded-lg text-sm font-medium hover:bg-[#3d2519] transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#251711]">Leo</h1>
              <p className="text-sm text-gray-600">Yo Leo, tu librero de confianza 📚</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#616f55]/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-[#616f55]">Activo</span>
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">L</span>
                </div>
                <h2 className="text-2xl font-bold text-[#251711] mb-2">Bienvenido a Leo</h2>
                <p className="text-gray-600">Yo Leo, tu librero de confianza 📚</p>
                <p className="text-gray-500 text-sm mt-1">Escribe un mensaje para comenzar</p>
              </div>
            </div>
          )}
          
          {messages.map((message: UIMessage, index: number) => {
            const messageText = getMessageText(message);
            // Obtener libros del estado en lugar de del mensaje
            const books = bookSearchResults.get(message.id) || [];
            
            // Mostrar libros si este mensaje los tiene
            const shouldShowBooks = message.role === 'assistant' && books.length > 0;
            
            // Debug: log para ver qué contiene cada mensaje
            console.log('📨 Renderizando mensaje:', {
              id: message.id,
              role: message.role,
              hasText: !!messageText,
              booksCount: books.length,
              booksInState: bookSearchResults.has(message.id),
              totalBooksInState: bookSearchResults.size,
              shouldShowBooks,
              parts: message.parts.map((p: any) => p.type)
            });
            
            if (shouldShowBooks) {
              console.log(`📚 Libros para mensaje ${message.id}:`, books.map(b => b.title));
            }
            
            // No renderizar mensajes completamente vacíos sin libros
            if ((!messageText || messageText.trim().length === 0) && !shouldShowBooks) {
              return null;
            }
            
            return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#616f55] to-[#4d5a44] text-white'
                    : 'bg-white/90 backdrop-blur-sm border border-gray-200'
                } rounded-2xl shadow-sm`}
              >
                <div className="px-5 py-3">
                  {/* Texto del mensaje */}
                  {messageText && messageText.trim().length > 0 ? (
                    <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      message.role === 'user' ? 'text-white' : 'text-gray-700'
                    }`}>
                      {messageText}
                    </p>
                  ) : (
                    /* Si no hay texto pero hay libros, mostrar mensaje por defecto */
                    message.role === 'assistant' && shouldShowBooks && (
                      <p className="text-sm text-gray-700 mb-2">
                        📚 He encontrado {books.length} {books.length === 1 ? 'libro' : 'libros'} para ti:
                      </p>
                    )
                  )}
                  
                  {/* Carrusel de libros (solo para mensajes del asistente) */}
                  {message.role === 'assistant' && shouldShowBooks && (
                    <div className={`${messageText ? 'mt-3' : ''} relative`}>
                      {books.length === 1 ? (
                        // Si solo hay un libro, verificar si es resultado de getBookDetails (tiene más detalles)
                        books[0].isbn || books[0].categories?.length > 0 || books[0].subtitle ? (
                          <DetailedBookCard book={books[0]} />
                        ) : (
                          <BookCard book={books[0]} />
                        )
                      ) : (
                        // Si hay múltiples libros, mostrar carrusel con BookCard regular
                        <>
                          <BookCard book={books[currentBookIndex.get(message.id) || 0]} />
                          
                          {/* Controles del carrusel */}
                          <div className="flex items-center justify-between mt-3">
                            {/* Botón Anterior */}
                            <button
                              onClick={() => handlePrevBook(message.id, books.length)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Anterior
                            </button>
                            
                            {/* Indicador */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">
                                {(currentBookIndex.get(message.id) || 0) + 1} / {books.length}
                              </span>
                              <div className="flex gap-1">
                                {books.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setCurrentBookIndex(prev => {
                                        const newMap = new Map(prev);
                                        newMap.set(message.id, index);
                                        return newMap;
                                      });
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      (currentBookIndex.get(message.id) || 0) === index
                                        ? 'bg-[#616f55] w-6'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    aria-label={`Ir al libro ${index + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {/* Botón Siguiente */}
                            <button
                              onClick={() => handleNextBook(message.id, books.length)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Siguiente
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20 border-current">
                    <span
                      className={`text-xs ${
                        message.role === 'user' ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {(messageTimestamps.get(message.id) || new Date()).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyMessage(getMessageText(message), message.id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          message.role === 'user'
                            ? 'hover:bg-[#4d5a44]/30'
                            : 'hover:bg-gray-100'
                        }`}
                        title="Copiar mensaje"
                      >
                        {copiedId === message.id ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      
                      {message.role === 'assistant' && messages[messages.length - 1].id === message.id && (
                        <button
                          onClick={handleRegenerateResponse}
                          disabled={isLoading}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                          title="Regenerar respuesta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#616f55] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#616f55] rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-[#616f55] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 max-w-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error.message}
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4 shadow-lg flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:border-transparent bg-white text-gray-700 placeholder-gray-400 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-8 py-3 bg-gradient-to-r from-[#616f55] to-[#4d5a44] text-white rounded-xl font-semibold hover:from-[#4d5a44] hover:to-[#616f55] focus:outline-none focus:ring-2 focus:ring-[#616f55] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
