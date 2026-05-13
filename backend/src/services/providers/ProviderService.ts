import { Provider, ServiceType } from '../../types/prisma';

export interface BuyRequest {
  phone: string;
  planCode: string;
  amount: number;
  reference: string;
  serviceType: ServiceType;
}

export abstract class ProviderService {
  public abstract readonly name: Provider;

  /**
   * Fetches the current wallet balance from the provider's API.
   * @returns The balance as a number.
   */
  abstract checkBalance(): Promise<number>;

  /**
   * Processes a data purchase request.
   * @throws Error if the provider fails or doesn't support this.
   */
  abstract buyData(request: BuyRequest): Promise<any>;

  /**
   * Processes an airtime purchase request.
   */
  abstract buyAirtime(request: BuyRequest): Promise<any>;

  /**
   * Processes a utility/cable purchase request.
   * @throws Error if the provider fails or doesn't support this.
   */
  abstract buyUtility(request: BuyRequest): Promise<any>;

  /**
   * Processes a Bulk SMS request.
   */
  abstract sendSms(sender: string, recipients: string[], message: string): Promise<any>;
}
