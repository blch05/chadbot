import { MongoClient, ServerApiVersion, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usar una variable global para evitar múltiples conexiones
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, crear una nueva instancia
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Función helper para obtener la base de datos
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'leobot');
}

// Función para verificar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
}

export default clientPromise;
