/**
 * Script de prueba para verificar conexión a MongoDB
 * Ejecutar con: node scripts/test-mongo.js
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Error: MONGODB_URI no está definido en .env.local');
    process.exit(1);
  }

  if (uri.includes('<db_password>')) {
    console.error('❌ Error: Debes reemplazar <db_password> con tu contraseña real en .env.local');
    console.log('\n📖 Lee MONGODB_SETUP.md para más información\n');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    console.log('🔄 Conectando a MongoDB...');
    await client.connect();
    
    console.log('✅ Conexión exitosa!');
    
    // Ping al servidor
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Ping exitoso!');
    
    // Listar bases de datos
    const dbs = await client.db().admin().listDatabases();
    console.log('\n📚 Bases de datos disponibles:');
    dbs.databases.forEach(db => console.log(`  - ${db.name}`));
    
    // Verificar/crear base de datos incelbot
    const dbName = process.env.MONGODB_DB || 'incelbot';
    const db = client.db(dbName);
    console.log(`\n✅ Base de datos "${dbName}" configurada correctamente`);
    
    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Colecciones en "${dbName}":`);
    if (collections.length === 0) {
      console.log('  (vacío - se creará automáticamente al insertar datos)');
    } else {
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    
    console.log('\n🎉 MongoDB está configurado correctamente!\n');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.log('\n📖 Soluciones posibles:');
    console.log('  1. Verifica que el password en MONGODB_URI sea correcto');
    console.log('  2. Verifica que tu IP esté en la whitelist de MongoDB Atlas');
    console.log('  3. Lee MONGODB_SETUP.md para más detalles\n');
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
