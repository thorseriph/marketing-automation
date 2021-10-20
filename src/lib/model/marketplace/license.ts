import * as assert from 'assert';
import { ContactInfo, getContactInfo, getPartnerInfo, maybeGetContactInfo, PartnerInfo } from "./common.js";
import { RawLicense } from "./raw.js";

type AttributionData = {
  channel: string;
  referrerDomain?: string;
  campaignName?: string;
  campaignSource?: string;
  campaignMedium?: string;
  campaignContent?: string;
};

type ParentProductInfo = {
  parentProductBillingCycle: 'NA' | 'Pending' | 'ANNUAL' | 'MONTHLY';
  parentProductName: 'NA' | 'Pending' | 'Confluence' | 'Jira';
  installedOnSandbox: 'NA' | 'Pending' | 'No' | 'Yes';
  parentProductEdition: 'NA' | 'Pending' | 'Free' | 'Standard' | 'Premium' | 'Enterprise';
};

type NewEvalData = {
  evaluationLicense: string;
  daysToConvertEval: string;
  evaluationStartDate: string;
  evaluationEndDate: string;
  evaluationSaleDate: string;
};

export interface LicenseData {
  addonLicenseId: string,
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
  licenseType: 'COMMERCIAL' | 'ACADEMIC' | 'COMMUNITY' | 'EVALUATION' | 'OPEN_SOURCE' | 'DEMONSTRATION' | 'INTERNAL USE',
  hosting: 'Server' | 'Cloud' | 'Data Center',
  maintenanceStartDate: string,
  maintenanceEndDate: string,

  status: 'inactive' | 'active' | 'cancelled',

  evaluationOpportunitySize: string,
  attribution: AttributionData | null,
  parentInfo: ParentProductInfo | null,
  newEvalData: NewEvalData | null,
}

export class License {

  constructor(public data: LicenseData) { }

  get maxTier() {
    return Math.max(this.parseTier(), this.tierFromEvalOpportunity());
  }

  parseTier() {
    const tier = this.data.tier;
    switch (tier) {
      case 'Unlimited Users':
        return 10001;
      case 'Subscription': // it'll be in evaluationOpportunitySize instead
      case 'Evaluation':
      case 'Demonstration License':
        return -1;
    }

    const m = tier.match(/^(\d+) Users$/);
    assert.ok(m, `Unknown license tier: ${tier}`);

    return + m[1];
  }

  tierFromEvalOpportunity() {
    const size = this.data.evaluationOpportunitySize;
    switch (size) {
      case 'Unlimited Users':
        return 10001;
      case 'Unknown':
      case 'Evaluation':
      case 'NA':
      case '':
      case null:
      case undefined:
        return -1;
      default:
        return +size;
    }
  }

}

export function normalizeLicense(license: RawLicense): License {
  let newEvalData: NewEvalData | null = null;
  if (license.evaluationLicense) {
    newEvalData = {
      evaluationLicense: license.evaluationLicense,
      daysToConvertEval: license.daysToConvertEval as string,
      evaluationStartDate: license.evaluationStartDate as string,
      evaluationEndDate: license.evaluationEndDate as string,
      evaluationSaleDate: license.evaluationSaleDate as string,
    };
  }

  let parentInfo: ParentProductInfo | null = null;
  if (license.parentProductBillingCycle
    || license.parentProductName
    || license.installedOnSandbox
    || license.parentProductEdition) {
    parentInfo = {
      parentProductBillingCycle: license.parentProductBillingCycle,
      parentProductName: license.parentProductName,
      installedOnSandbox: license.installedOnSandbox,
      parentProductEdition: license.parentProductEdition,
    } as ParentProductInfo;
  }

  return new License({
    addonLicenseId: license.addonLicenseId,
    licenseId: license.licenseId,
    addonKey: license.addonKey,
    addonName: license.addonName,
    lastUpdated: license.lastUpdated,

    technicalContact: getContactInfo(license.contactDetails.technicalContact),
    billingContact: maybeGetContactInfo(license.contactDetails.billingContact),
    partnerDetails: getPartnerInfo(license.partnerDetails),

    company: license.contactDetails.company,
    country: license.contactDetails.country,
    region: license.contactDetails.region,

    tier: license.tier,
    licenseType: license.licenseType,
    hosting: license.hosting,
    maintenanceStartDate: license.maintenanceStartDate,
    maintenanceEndDate: license.maintenanceEndDate,

    status: license.status,
    evaluationOpportunitySize: license.evaluationOpportunitySize ?? '',
    attribution: license.attribution ?? null,
    parentInfo,
    newEvalData,
  });
}
