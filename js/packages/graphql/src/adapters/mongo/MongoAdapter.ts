import { IDataAdapter } from '../IDataAdapter';
import { MongoReader } from './MongoReader';
import { MongoWriter } from './MongoWriter';
import { createConnection } from '../../utils/createConnection';
import { Connection } from '@solana/web3.js';

import { createOrm } from './createOrm';
import { Db } from 'mongodb';
import { getEndpoints } from '../../utils/getEndpoints';

export class MongoAdapter implements IDataAdapter<MongoWriter, MongoReader> {
  constructor(
    public readonly endpoints = getEndpoints(),
    private connectionString = process.env.MONGO_DB ||
      'mongodb://127.0.0.1:27017/?readPreference=primary&directConnection=true&ssl=false',
  ) {}

  private readonly container = new Map<
    string,
    readonly [MongoReader, MongoWriter, Connection]
  >();

  private getBox(
    network: string,
  ): readonly [MongoReader, MongoWriter, Connection] {
    if (this.container.has(network)) {
      return this.container.get(network)!;
    }
    const entry = this.endpoints.find(p => p.name === network)!;
    const connection = createConnection(entry.endpoint, 'recent');

    let db: Db | undefined;
    const init = async () => {
      if (db) {
        return db;
      }
      const orm = await createOrm(this.connectionString, `metaplex-${network}`);
      db = orm.db;
      return db;
    };

    const writer = new MongoWriter(network, init);
    const reader = new MongoReader(network, connection, init);
    const box = [reader, writer, connection] as const;
    this.container.set(network, box);
    return box;
  }

  async init(network?: string) {
    if (network) {
      const [reader, writer] = this.getBox(network);
      await Promise.all([reader.init(), writer.init()]);
    } else {
      await Promise.all(this.endpoints.map(({ name }) => this.init(name)));
    }
  }

  getReader(network: string): MongoReader {
    return this.getBox(network)[0];
  }

  getWriter(network: string): MongoWriter {
    return this.getBox(network)[1];
  }

  getConnection(network: string): Connection {
    return this.getBox(network)[2];
  }
}
