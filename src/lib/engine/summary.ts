import log from "../log/logger";
import { Table } from "../log/table";
import { Deal } from "../model/deal";
import { formatMoney, formatNumber } from "../util/formatters";
import { isPresent } from "../util/helpers";
import { Engine } from "./engine";

export function printSummary(engine: Engine) {

  if (engine.dealManager.duplicates.size > 0) {
    Table.print({
      title: 'Duplicate Deals',
      log: s => log.warn('Dups', s),
      cols: [
        [{ title: 'Primary' }, s => s[0].link()],
        [{ title: 'Duplicate(s)' }, s => s[1].map(d => d.link())],
      ],
      rows: engine.dealManager.duplicates,
    });

    const dupTotal = ([...engine.dealManager.duplicates]
      .flatMap(([primary, dups]) => dups)
      .map((dup) => dup.data.amount ?? 0)
      .reduce((a, b) => a + b));

    log.warn('Deal Generator', 'Total of duplicates:', formatMoney(dupTotal));
    log.warn('Deal Generator', 'Total duplicates:', engine.dealManager.duplicates.size);

    engine.tallier.less('Over-accounted: Duplicate deals', -dupTotal);
  }

  const deals = engine.dealManager.getArray();

  log.info('Summary', 'Results of this run:');

  const table = new Table([{}, { align: 'right' }]);

  table.rows.push(['# Total Deals', formatNumber(deals.length)]);
  table.rows.push(['$ Total Deals', formatMoney(sumDeals(deals))]);
  table.rows.push(['$ Total Deals Won', formatMoney(sumDeals(deals.filter(d => d.isWon)))]);
  table.rows.push(['$ Total Deals Lost', formatMoney(sumDeals(deals.filter(d => d.isLost)))]);
  table.rows.push(['$ Total Deals Eval', formatMoney(sumDeals(deals.filter(d => d.isEval())))]);

  table.rows.push(['Deals Created', formatNumber(engine.dealManager.createdCount)]);
  table.rows.push(['Deals Updated', formatNumber(engine.dealManager.updatedCount)]);
  table.rows.push(['Deals Associated', formatNumber(engine.dealManager.associatedCount)]);
  table.rows.push(['Deals DisAssociated', formatNumber(engine.dealManager.disassociatedCount)]);

  table.rows.push(['Contacts Created', formatNumber(engine.contactManager.createdCount)]);
  table.rows.push(['Contacts Updated', formatNumber(engine.contactManager.updatedCount)]);
  table.rows.push(['Contacts Associated', formatNumber(engine.contactManager.associatedCount)]);
  table.rows.push(['Contacts Disassociated', formatNumber(engine.contactManager.disassociatedCount)]);

  table.rows.push(['Companies Updated', formatNumber(engine.companyManager.updatedCount)]);

  for (const row of table.eachRow()) {
    log.info('Summary', '  ' + row);
  }

  engine.tallier.less('Deal sum', sumDeals(deals));

  engine.tallier.printTable();
}

function sumDeals(deals: Deal[]) {
  return (deals
    .map(d => d.data.amount)
    .filter(isPresent)
    .reduce((a, b) => a + b, 0));
}
