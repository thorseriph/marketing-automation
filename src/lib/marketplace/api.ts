import got from 'got';
import { DateTime, Duration, Interval } from 'luxon';
import { mpacCredsFromENV } from '../config/env';
import { Progress } from '../log/download';
import { AttachableError, KnownError } from '../util/errors';
import { RawLicense, RawTransaction } from './raw';

export interface MpacCreds {
  user: string,
  apiKey: string,
  sellerId: string,
}

export class MarketplaceAPI {

  private creds = mpacCredsFromENV();

  public async downloadTransactions(): Promise<RawTransaction[]> {
    const transactions = await this.downloadMarketplaceData('/sales/transactions/export');
    if ((transactions as any).code === 401) throw new KnownError("MPAC_API_KEY is an invalid API key.");
    return transactions as RawTransaction[];
  }

  public async downloadLicensesWithoutDataInsights(): Promise<RawLicense[]> {
    const licenses = await this.downloadMarketplaceData('/licenses/export?endDate=2018-07-01');
    return licenses as RawLicense[];
  }

  public async downloadLicensesWithDataInsights(progress: Progress): Promise<RawLicense[]> {
    const dates = dataInsightDateRanges();
    progress.setCount(dates.length);
    const promises = dates.map(async ({ startDate, endDate }) => {
      const json: RawLicense[] = await this.downloadMarketplaceData(`/licenses/export?withDataInsights=true&startDate=${startDate}&endDate=${endDate}`);
      progress.tick(`${startDate}-${endDate}`);
      return json;
    });
    const licenses = (await Promise.all(promises)).flat();
    return licenses;
  }

  private async downloadMarketplaceData<T>(subpath: string): Promise<T[]> {
    const res = await got.get(`https://marketplace.atlassian.com/rest/2/vendors/${this.creds.sellerId}/reporting${subpath}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(this.creds.user + ':' + this.creds.apiKey).toString('base64'),
      },
    });

    let text;
    try {
      text = res.body;
      return JSON.parse(text);
    }
    catch (e) {
      throw new AttachableError('Probably invalid Marketplace JSON.', text as string);
    }
  }

}

function dataInsightDateRanges() {
  return Interval.fromDateTimes(
    DateTime.local(2018, 7, 1),
    DateTime.local()
  ).splitBy(Duration.fromObject({ months: 2 })).map(int => ({
    startDate: int.start.toISODate(),
    endDate: int.end.toISODate(),
  }));
}
