import { NextRequest, NextResponse } from 'next/server';

interface WebhookRegistration {
  url: string;
  secret: string;
  events: string[];
  addresses: string[];
  networks: number[];
  createdAt: number;
  lastTriggered?: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  status: 'success' | 'failed';
  timestamp: number;
  error?: string;
}

// In-memory storage for webhook registrations (in production, use a database)
const webhookRegistrations = new Map<string, WebhookRegistration>();

// Store recent webhook deliveries for debugging
const webhookLogs: WebhookLog[] = [];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { event, data, webhookId } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing event or data' },
        { status: 400 }
      );
    }

    // If webhookId is provided, it's a delivery from our system
    if (webhookId) {
      return handleWebhookDelivery(webhookId, event, data);
    }

    // Otherwise, it's a registration or test
    return handleWebhookRegistration(body);

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'logs') {
    // Return recent webhook logs
    return NextResponse.json({
      logs: webhookLogs.slice(-50), // Last 50 logs
    });
  }

  if (action === 'registrations') {
    // Return webhook registrations
    const registrations = Array.from(webhookRegistrations.entries()).map(([id, reg]) => ({
      id,
      url: reg.url,
      events: reg.events,
      addresses: reg.addresses,
      networks: reg.networks,
      createdAt: reg.createdAt,
      lastTriggered: reg.lastTriggered,
    }));

    return NextResponse.json({ registrations });
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}

async function handleWebhookRegistration(body: Record<string, unknown>): Promise<NextResponse> {
  const { url, secret, events, addresses, networks, action } = body;

  if (action === 'register') {
    if (!url || typeof url !== 'string' || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: url (string), events (array)' },
        { status: 400 }
      );
    }

    const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    webhookRegistrations.set(webhookId, {
      url,
      secret: typeof secret === 'string' ? secret : '',
      events,
      addresses: Array.isArray(addresses) ? addresses : [],
      networks: Array.isArray(networks) ? networks : [],
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      webhookId,
      message: 'Webhook registered successfully',
    });
  }

  if (action === 'unregister') {
    const { webhookId } = body;
    if (!webhookId || typeof webhookId !== 'string' || !webhookRegistrations.has(webhookId)) {
      return NextResponse.json(
        { error: 'Invalid webhook ID' },
        { status: 400 }
      );
    }

    webhookRegistrations.delete(webhookId);
    return NextResponse.json({
      success: true,
      message: 'Webhook unregistered successfully',
    });
  }

  if (action === 'test') {
    const { webhookId } = body;
    if (!webhookId || typeof webhookId !== 'string' || !webhookRegistrations.has(webhookId)) {
      return NextResponse.json(
        { error: 'Invalid webhook ID' },
        { status: 400 }
      );
    }

    const registration = webhookRegistrations.get(webhookId)!;

    // Send test notification
    const testPayload = {
      event: 'test',
      data: {
        message: 'This is a test webhook notification',
        timestamp: new Date().toISOString(),
      },
      webhookId,
    };

    try {
      const response = await fetch(registration.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': registration.secret,
        },
        body: JSON.stringify(testPayload),
      });

      const success = response.ok;
      logWebhookDelivery(webhookId, 'test', testPayload, success, success ? undefined : `HTTP ${response.status}`);

      return NextResponse.json({
        success,
        message: success ? 'Test webhook sent successfully' : 'Test webhook failed',
      });
    } catch (error) {
      logWebhookDelivery(webhookId, 'test', testPayload, false, error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({
        success: false,
        message: 'Test webhook failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}

async function handleWebhookDelivery(webhookId: string, event: string, data: Record<string, unknown>): Promise<NextResponse> {
  // This would be called internally to deliver webhooks
  const registration = webhookRegistrations.get(webhookId);
  if (!registration) {
    return NextResponse.json(
      { error: 'Webhook not found' },
      { status: 404 }
    );
  }

  // Check if this webhook should receive this event
  if (!registration.events.includes(event) && !registration.events.includes('*')) {
    return NextResponse.json({
      success: true,
      message: 'Event not subscribed to',
    });
  }

  // Check address filter
  if (registration.addresses.length > 0 && data.address && typeof data.address === 'string') {
    const addressMatch = registration.addresses.some(addr =>
      addr.toLowerCase() === (data.address as string).toLowerCase()
    );
    if (!addressMatch) {
      return NextResponse.json({
        success: true,
        message: 'Address not in subscription list',
      });
    }
  }

  // Check network filter
  if (registration.networks.length > 0 && data.networkId && typeof data.networkId === 'number') {
    if (!registration.networks.includes(data.networkId)) {
      return NextResponse.json({
        success: true,
        message: 'Network not in subscription list',
      });
    }
  }

  // Deliver webhook
  try {
    const payload = {
      event,
      data,
      webhookId,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(registration.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': registration.secret,
        'X-Webhook-Event': event,
      },
      body: JSON.stringify(payload),
    });

    const success = response.ok;
    registration.lastTriggered = Date.now();
    logWebhookDelivery(webhookId, event, payload, success, success ? undefined : `HTTP ${response.status}`);

    return NextResponse.json({
      success,
      message: success ? 'Webhook delivered successfully' : 'Webhook delivery failed',
    });

  } catch (error) {
    logWebhookDelivery(webhookId, event, { event, data }, false, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      success: false,
      message: 'Webhook delivery failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function logWebhookDelivery(
  webhookId: string,
  event: string,
  payload: Record<string, unknown>,
  success: boolean,
  error?: string
): void {
  webhookLogs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    webhookId,
    event,
    payload,
    status: success ? 'success' : 'failed',
    timestamp: Date.now(),
    error,
  });

  // Keep only last 100 logs
  if (webhookLogs.length > 100) {
    webhookLogs.shift();
  }
}

// Function to trigger webhooks for transaction events (called from transaction processing)
async function triggerTransactionWebhook(
  event: string,
  transactionData: Record<string, unknown>
): Promise<void> {
  const promises = Array.from(webhookRegistrations.entries()).map(async ([webhookId]) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data: transactionData,
          webhookId,
        }),
      });
    } catch (error) {
      console.error(`Failed to trigger webhook ${webhookId}:`, error);
    }
  });

  await Promise.allSettled(promises);
}
