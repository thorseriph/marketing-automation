import assert from "assert";
import { getContactInfo, getPartnerInfo, maybeGetContactInfo, RawTransaction } from "../marketplace/raw";
import { License } from "./license";
import { ContactInfo, MpacRecord, PartnerInfo } from "./record";

export interface TransactionData {
  addonLicenseId: string | null,
  appEntitlementId: string | null,
  appEntitlementNumber: string | null,

  licenseId: string,
  addonKey: string,
  addonName: string,
  lastUpdated: string,

  technicalContact: ContactInfo,
  billingContact: ContactInfo | null,
  partnerDetails: PartnerInfo | null,

  company: string,
  country: string,
  region: string,

  tier: string,
  licenseType: 'COMMERCIAL' | 'ACADEMIC' | 'COMMUNITY',
  hosting: 'Server' | 'Cloud' | 'Data Center',
  maintenanceStartDate: string,
  maintenanceEndDate: string,

  transactionId: string,
  saleDate: string,
  saleType: 'Renewal' | 'Upgrade' | 'New' | 'Refund',

  billingPeriod: string,

  purchasePrice: number,
  vendorAmount: number,
}

export class Transaction extends MpacRecord<TransactionData> {

  /** Unique ID for this Transaction. */
  declare id;
  public ids: string[] = [];

  declare tier;

  public license!: License;
  public refunded = false;

  static fromRaw(rawTransaction: RawTransaction) {
    return new Transaction({
      transactionId: rawTransaction.transactionId,

      addonLicenseId: rawTransaction.addonLicenseId ?? null,
      appEntitlementId: rawTransaction.appEntitlementId ?? null,
      appEntitlementNumber: rawTransaction.appEntitlementNumber ?? null,

      licenseId: rawTransaction.licenseId,
      addonKey: rawTransaction.addonKey,
      addonName: rawTransaction.addonName,
      lastUpdated: rawTransaction.lastUpdated,

      technicalContact: getContactInfo(rawTransaction.customerDetails.technicalContact),
      billingContact: maybeGetContactInfo(rawTransaction.customerDetails.billingContact),
      partnerDetails: getPartnerInfo(rawTransaction.partnerDetails),

      company: rawTransaction.customerDetails.company,
      country: rawTransaction.customerDetails.country,
      region: rawTransaction.customerDetails.region,

      tier: rawTransaction.purchaseDetails.tier,
      licenseType: rawTransaction.purchaseDetails.licenseType,
      hosting: rawTransaction.purchaseDetails.hosting,
      maintenanceStartDate: rawTransaction.purchaseDetails.maintenanceStartDate,
      maintenanceEndDate: rawTransaction.purchaseDetails.maintenanceEndDate,

      saleDate: rawTransaction.purchaseDetails.saleDate,
      saleType: rawTransaction.purchaseDetails.saleType,
      billingPeriod: rawTransaction.purchaseDetails.billingPeriod,
      purchasePrice: rawTransaction.purchaseDetails.purchasePrice,
      vendorAmount: rawTransaction.purchaseDetails.vendorAmount,
    });
  }

  public constructor(data: TransactionData) {
    super(data);

    const maybeAdd = (id: string | null) => {
      if (id) this.ids.push(uniqueTransactionId(this.data.transactionId, id));
    };

    maybeAdd(this.data.addonLicenseId);
    maybeAdd(this.data.appEntitlementId);
    maybeAdd(this.data.appEntitlementNumber);

    this.id = this.ids.find(id => id)!;

    this.tier = this.parseTier();
  }

  private parseTier() {
    const tier = this.data.tier;

    if (tier === 'Unlimited Users') return 10001;

    let m;
    if (m = tier.match(/^Per Unit Pricing \((\d+) users\)$/i)) {
      return +m[1];
    }
    if (m = tier.match(/^(\d+) Users$/)) {
      return +m[1];
    }

    assert.fail(`Unknown transaction tier: ${tier}`);
  }

}

export function uniqueTransactionId(transactionId: string, licenseId: string) {
  return `${transactionId}[${licenseId}]`
}
