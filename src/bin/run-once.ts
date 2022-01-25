import 'source-map-support/register';
import DataDir from '../lib/data/dir';
import { DataSet } from '../lib/data/set';
import { Engine } from "../lib/engine/engine";
import { Hubspot } from '../lib/hubspot';
import { logHubspotResults } from '../lib/hubspot/log-results';
import { ConsoleLogger } from '../lib/log/logger';
import { getCliArgs } from '../lib/parameters/cli-args';
import { engineConfigFromENV } from '../lib/parameters/env-config';

const { savelogs } = getCliArgs('savelogs');

const dataDir = DataDir.root.subdir('in');
const logDir = savelogs ? dataDir.subdir(savelogs) : null;

const log = new ConsoleLogger();

const hubspot = Hubspot.memoryFromENV(log);

const engine = new Engine(log, hubspot, engineConfigFromENV());

const data = new DataSet(dataDir).load();

engine.run(data, logDir);

logHubspotResults(hubspot, dataDir.subdir('results').file('hubspot-out.txt'));
