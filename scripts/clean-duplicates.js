// Script para limpiar mensajes duplicados en MongoDB
// Ejecutar con: node scripts/clean-duplicates.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanDuplicates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'leobot');
    const messagesCollection = db.collection('messages');
    
    // Obtener todas las conversaciones
    const conversations = await db.collection('conversations').find({}).toArray();
    
    let totalRemoved = 0;
    
    for (const conv of conversations) {
      const conversationId = conv._id.toString();
      console.log(`\n🔍 Revisando conversación: ${conversationId}`);
      
      // Obtener todos los mensajes de esta conversación
      const messages = await messagesCollection
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .toArray();
      
      console.log(`   Total mensajes: ${messages.length}`);
      
      const seen = new Set();
      const toDelete = [];
      
      for (const msg of messages) {
        // Crear clave única basada en contenido, rol y tiempo aproximado
        const timeKey = Math.floor(new Date(msg.createdAt).getTime() / 1000); // Segundos
        const key = `${msg.role}:${msg.content}:${timeKey}`;
        
        if (seen.has(key)) {
          toDelete.push(msg._id);
          console.log(`   ❌ Duplicado encontrado: "${msg.content.slice(0, 50)}..."`);
        } else {
          seen.add(key);
        }
      }
      
      if (toDelete.length > 0) {
        const result = await messagesCollection.deleteMany({
          _id: { $in: toDelete }
        });
        console.log(`   🗑️  Eliminados ${result.deletedCount} duplicados`);
        totalRemoved += result.deletedCount;
        
        // Actualizar contador de la conversación
        const newCount = messages.length - toDelete.length;
        await db.collection('conversations').updateOne(
          { _id: conv._id },
          { $set: { messageCount: newCount } }
        );
      } else {
        console.log(`   ✅ Sin duplicados`);
      }
    }
    
    console.log(`\n✅ Limpieza completada!`);
    console.log(`📊 Total mensajes duplicados eliminados: ${totalRemoved}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

cleanDuplicates();
