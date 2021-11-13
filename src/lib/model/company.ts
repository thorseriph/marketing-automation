import { Contact } from "./contact.js";
import { Entity } from "./hubspot/entity.js";
import { EntityKind } from "./hubspot/interfaces.js";
import { EntityAdapter, EntityManager } from "./hubspot/manager.js";

type CompanyData = {
  name: string;
  type: 'Partner' | null;
};

export class Company extends Entity<CompanyData, {}> {

  contacts = this.makeDynamicAssociation<Contact>('contact');

}

const CompanyAdapter: EntityAdapter<CompanyData, {}> = {

  associations: [
    ['contact', 'down']
  ],

  apiProperties: [
    'name',
    'type',
  ],

  fromAPI(data) {
    return {
      name: data['name'] ?? '',
      type: data['type'] === 'PARTNER' ? 'Partner' : null,
    };
  },

  computed: {},

  toAPI: {
    name: name => ['name', name],
    type: type => ['type', type === 'Partner' ? 'PARTNER' : ''],
  },

  identifiers: [
  ],

};

export class CompanyManager extends EntityManager<CompanyData, {}, Company> {

  override Entity = Company;
  override kind: EntityKind = 'company';
  override entityAdapter = CompanyAdapter;

}
