import { Downloader } from '../io/downloader/downloader.js';
import { Uploader } from '../io/uploader/uploader.js';
import { EngineLogger } from '../log/engine-logger.js';
import { Database } from '../model/database.js';
import { backfillDealCompanies } from './backfilling/backfill-deal-companies.js';
import { findAndFlagExternallyCreatedContacts, findAndFlagPartnerCompanies, findAndFlagPartnersByDomain, identifyDomains } from './contacts/contact-types.js';
import { generateContacts } from "./contacts/generate-contacts.js";
import { updateContactsBasedOnMatchResults } from './contacts/update-contacts.js';
import { generateDeals } from './deal-generator/generate-deals.js';
import { matchIntoLikelyGroups } from './license-matching/license-grouper.js';

export default async function runEngine({ downloader, uploader }: {
  downloader: Downloader,
  uploader: Uploader,
}) {
  const log = new EngineLogger();

  log.step('Starting to download data');
  const db = new Database(downloader, uploader);
  await db.downloadAllData();

  log.step('Identifying partner and customer domains');
  identifyDomains(db);

  log.step('Flagging partner/customer contacts created outside engine');
  findAndFlagExternallyCreatedContacts(db);
  await db.syncUpAllEntities();

  log.step('Generating contacts');
  generateContacts(db);

  log.step('Removing externally created contacts from rest of engine run');
  db.contactManager.removeExternallyCreatedContacts();

  log.step('Flagging partner companies');
  findAndFlagPartnerCompanies(db);

  log.step('Flagging partners by domain');
  findAndFlagPartnersByDomain(db);

  log.step('Upserting Contacts/Companies in Hubspot');
  await db.syncUpAllEntities();

  log.step('Running Scoring Engine');
  const allMatches = matchIntoLikelyGroups(db);

  log.step('Updating Contacts based on Match Results');
  updateContactsBasedOnMatchResults(db, allMatches);
  await db.syncUpAllEntities();

  log.step('Backfill deal companies');
  backfillDealCompanies(db, allMatches);
  await db.syncUpAllEntities();

  log.step('Generating deals');
  generateDeals(db, allMatches);

  log.step('Upserting deals in Hubspot');
  await db.syncUpAllEntities();

  log.step('Done!');
}
