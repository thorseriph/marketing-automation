import { hubspotContactConfigFromENV, hubspotDealConfigFromENV } from "../config/env";
import { RawDataSet } from "../data/raw";
import { ConsoleLogger } from "../log/console";
import { CompanyManager } from "../model/company";
import { ContactManager, HubspotContactConfig } from "../model/contact";
import { DealManager, HubspotDealConfig } from "../model/deal";
import { Entity } from "./entity";

export type HubspotConfig = {
  deal?: HubspotDealConfig;
  contact?: HubspotContactConfig;
};

export class Hubspot {

  public dealManager;
  public contactManager;
  public companyManager;

  public constructor(config?: HubspotConfig) {
    this.dealManager = new DealManager(config?.deal ?? {});
    this.contactManager = new ContactManager(config?.contact ?? {});
    this.companyManager = new CompanyManager();
  }

  public importData(data: RawDataSet, console?: ConsoleLogger) {
    console?.printInfo('Hubspot', 'Importing entities...');
    const dealPrelinks = this.dealManager.importEntities(data.rawDeals);
    const companyPrelinks = this.companyManager.importEntities(data.rawCompanies);
    const contactPrelinks = this.contactManager.importEntities(data.rawContacts);
    console?.printInfo('Hubspot', 'Done.');

    console?.printInfo('Hubspot', 'Linking entities...');
    this.dealManager.linkEntities(dealPrelinks, this);
    this.companyManager.linkEntities(companyPrelinks, this);
    this.contactManager.linkEntities(contactPrelinks, this);
    console?.printInfo('Hubspot', 'Done.');
  }

  public populateFakeIds() {
    fillInIds(this.dealManager.getAll());
    fillInIds(this.contactManager.getAll());
    fillInIds(this.companyManager.getAll());

    function fillInIds(entities: Iterable<Entity<any>>) {
      let id = 0;
      for (const e of entities) {
        if (!e.id) e.id = `fake-${e.kind}-${++id}`;
      }
    }
  }

}

export function hubspotConfigFromENV() {
  return {
    contact: hubspotContactConfigFromENV(),
    deal: hubspotDealConfigFromENV(),
  };
}
