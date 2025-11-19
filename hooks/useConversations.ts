import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/lib/types/conversation';
import type { UIMessage } from '@ai-sdk/react';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const conversationsWithId = data.conversations.map((conv: any) => ({
          ...conv,
          id: conv._id.toString(),
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }));
        setConversations(conversationsWithId);
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (title?: string, firstMessage?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, firstMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConv = {
          ...data.conversation,
          createdAt: new Date(data.conversation.createdAt),
          updatedAt: new Date(data.conversation.updatedAt),
        };
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        return newConv;
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
    return null;
  };

  const updateConversation = async (
    id: string,
    updates: { title?: string; messageCount?: number; preview?: string }
  ) => {
    try {
      console.log('🔄 Actualizando conversación:', id, updates);
      
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        console.log('✅ Conversación actualizada, reordenando...');
        
        setConversations((prev) => {
          // Actualizar la conversación
          const updated = prev.map((conv) =>
            conv.id === id
              ? { ...conv, ...updates, updatedAt: new Date() }
              : conv
          );
          
          // Mover la conversación actualizada al principio
          const conversationIndex = updated.findIndex(conv => conv.id === id);
          console.log('📍 Posición actual:', conversationIndex, '/', prev.length);
          
          if (conversationIndex > 0) {
            const [conversation] = updated.splice(conversationIndex, 1);
            console.log('⬆️ 🎉 MOVIENDO AL PRINCIPIO:', conversation.title, `(desde posición ${conversationIndex})`);
            return [conversation, ...updated];
          } else if (conversationIndex === 0) {
            console.log('ℹ️ El chat ya está en la primera posición');
          }
          
          return updated;
        });
      }
    } catch (error) {
      console.error('Error al actualizar conversación:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((conv) => conv.id !== id));
        if (currentConversationId === id) {
          setCurrentConversationId(null);
        }
      }
    } catch (error) {
      console.error('Error al eliminar conversación:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        return data.messages;
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
    return [];
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, books?: any[]) => {
    try {
      console.log('💾 Guardando mensaje en conversación:', conversationId);
      
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, books }),
      });
      
      console.log('📤 Mensaje guardado, reordenando conversaciones...');
      
      // Mover la conversación al principio de la lista cuando se envía un mensaje
      setConversations((prev) => {
        const conversationIndex = prev.findIndex(conv => conv.id === conversationId);
        console.log('📊 Índice de conversación actual:', conversationIndex, 'Total:', prev.length);
        
        if (conversationIndex > 0) {
          const updated = [...prev];
          const [conversation] = updated.splice(conversationIndex, 1);
          console.log('⬆️ Moviendo conversación al principio:', conversation.title);
          return [{ ...conversation, updatedAt: new Date() }, ...updated];
        } else if (conversationIndex === 0) {
          // Si ya está primera, solo actualizar el updatedAt
          console.log('✅ Conversación ya está primera, actualizando timestamp');
          return prev.map((conv, idx) => 
            idx === 0 ? { ...conv, updatedAt: new Date() } : conv
          );
        }
        console.log('⚠️ Conversación no encontrada en la lista');
        return prev;
      });
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  };

  return {
    conversations,
    isLoading,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversationMessages,
    saveMessage,
    refreshConversations: fetchConversations,
  };
}
