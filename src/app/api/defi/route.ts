import { NextRequest, NextResponse } from 'next/server';
import { DeFiService } from '../../../utils/defiUtils';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const networks = searchParams.get('networks')?.split(',').map(n => parseInt(n)) || [1, 8453, 534352];

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const positions = await DeFiService.getAllPositions(address as `0x${string}`, networks);

    return NextResponse.json({
      address,
      positions,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('DeFi API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
