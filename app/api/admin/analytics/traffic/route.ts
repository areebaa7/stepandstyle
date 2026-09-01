import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '7';
    const days = parseInt(daysParam, 10);
    const validDays = isNaN(days) || days < 1 || days > 90 ? 7 : days;

    const propertyId = process.env.GA4_PROPERTY_ID;
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!propertyId || !credentialsJson) {
      return NextResponse.json({ 
        activeUsers: 'N/A', 
        weeklyUsers: 'N/A',
        weeklyPageViews: 'N/A',
        status: 'Missing Configuration'
      });
    }

    const credentials = JSON.parse(credentialsJson);

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    // Run realtime report (Active users in last 30 minutes)
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    const activeUsers = realtimeResponse.rows?.[0]?.metricValues?.[0]?.value || '0';

    // Run report based on selected days
    const [reportResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${validDays}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' }
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date'
          }
        }
      ]
    });

    let weeklyUsers = 0;
    let weeklyPageViews = 0;
    
    const chartData = (reportResponse.rows || []).map(row => {
      const dateString = row.dimensionValues?.[0]?.value || '';
      // Format YYYYMMDD to short format (e.g. "Jun 25")
      let formattedDate = dateString;
      if (dateString.length === 8) {
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1;
        const day = parseInt(dateString.substring(6, 8));
        const dateObj = new Date(year, month, day);
        formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const views = parseInt(row.metricValues?.[1]?.value || '0', 10);
      
      weeklyUsers += users;
      weeklyPageViews += views;

      return {
        date: formattedDate,
        users,
        views
      };
    });

    return NextResponse.json({
      activeUsers,
      weeklyUsers: weeklyUsers.toString(),
      weeklyPageViews: weeklyPageViews.toString(),
      chartData,
      status: 'Connected'
    });
  } catch (error) {
    console.error('GA4 Error:', error);
    return NextResponse.json({ 
      activeUsers: 'N/A', 
      weeklyUsers: 'N/A',
      weeklyPageViews: 'N/A',
      status: 'Error Fetching Data'
    });
  }
}
