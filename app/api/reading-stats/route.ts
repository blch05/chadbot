import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

type Period = 'all-time' | 'year' | 'month' | 'week';
type GroupBy = 'genre' | 'author' | 'year';

function periodStartDate(period: Period): Date | null {
  const now = new Date();
  if (period === 'all-time') return null;
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return null;
}

// POST - compute reading stats
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const period: Period = body.period || 'all-time';
    const groupBy: GroupBy | undefined = body.groupBy;

    const startDate = periodStartDate(period);

    const db = await getDatabase();

    const match: any = { userId: payload.userId, isRead: true };
    if (startDate) match.dateFinished = { $gte: startDate };

    // Aggregation to compute main facets
    const pipeline: any[] = [
      { $match: match },
      {
        $facet: {
          totalBooks: [{ $count: 'count' }],
          totalPages: [
            { $group: { _id: null, pages: { $sum: { $ifNull: ['$pageCount', 0] } } } },
          ],
          avgRating: [{ $group: { _id: null, avg: { $avg: '$userRating' } } }],
          genres: [
            { $unwind: { path: '$categories', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          authors: [
            { $unwind: { path: '$authors', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$authors', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          booksByPeriod: [
            {
              $group: {
                _id: {
                  year: { $year: { $ifNull: ['$dateFinished', new Date(0)] } },
                  month: { $month: { $ifNull: ['$dateFinished', new Date(0)] } },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ],
          finishedDates: [
            { $project: { dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$dateFinished' } } } },
            { $group: { _id: null, dates: { $addToSet: '$dateStr' } } },
          ],
        },
      },
    ];

    const agg = await db.collection('reading_list').aggregate(pipeline).toArray();
    const result = agg[0] || {};

    const totalBooks = (result.totalBooks && result.totalBooks[0] && result.totalBooks[0].count) || 0;
    const totalPages = (result.totalPages && result.totalPages[0] && result.totalPages[0].pages) || 0;
    const avgRating = (result.avgRating && result.avgRating[0] && result.avgRating[0].avg) || null;

    const genres = (result.genres || []).map((g: any) => ({ genre: g._id, count: g.count }));
    const authors = (result.authors || []).map((a: any) => ({ author: a._id, count: a.count }));

    const booksByPeriod = (result.booksByPeriod || []).map((b: any) => ({ year: b._id.year, month: b._id.month, count: b.count }));

    // Compute current streak (consecutive days with at least one finished book)
    const finishedDatesArray: string[] = (result.finishedDates && result.finishedDates[0] && result.finishedDates[0].dates) || [];
    // Normalize into a Set of YYYY-MM-DD
    const finishedSet = new Set(finishedDatesArray);

    // start from today and count consecutive days backwards
    let streak = 0;
    const today = new Date();
    // function to format date to YYYY-MM-DD
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);
    for (let i = 0; ; i++) {
      const check = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = toYMD(check);
      if (finishedSet.has(key)) {
        streak += 1;
      } else {
        break;
      }
    }

    // Optionally groupBy specifics
    let grouped: any = null;
    if (groupBy === 'genre') grouped = genres;
    else if (groupBy === 'author') grouped = authors;
    else if (groupBy === 'year') grouped = booksByPeriod.reduce((acc: any, cur: any) => {
      acc[cur.year] = (acc[cur.year] || 0) + cur.count; return acc;
    }, {});

    return NextResponse.json({
      totalBooks,
      totalPages,
      avgRating,
      topGenres: genres,
      topAuthors: authors,
      booksByPeriod,
      currentStreakDays: streak,
      groupBy: grouped,
      period,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de lectura:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de lectura' }, { status: 500 });
  }
}
