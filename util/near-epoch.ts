import { WalletInterface } from "../wallet-api/wallet-interface";

//time in ms
const SECONDS = 1000
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES

const NUM_EPOCHS_TO_UNLOCK = 4

//MIN required.- to be expanded
export type BlockInfo = {
  header: {
    height: number
    timestamp: number;
    epoch_id: string;
    next_epoch_id: string;
  }
}

async function getLastBlock(wallet: WalletInterface): Promise<BlockInfo> {
  return wallet.queryChain('block', { finality: 'optimistic' });
}
async function getBlock(wallet: WalletInterface, blockId: string): Promise<BlockInfo> {
  return wallet.queryChain('block', { block_id: blockId });
}

export async function computeCurrentEpoch(wallet: WalletInterface): Promise<EpochInfo> {

  const lastBlock = await getLastBlock(wallet);
  const firstBlock = await getBlock(wallet, lastBlock.header.next_epoch_id); //next_epoch_id looks like "current" epoch_id
  const prevBlock = await getBlock(wallet, lastBlock.header.epoch_id); //epoch_id looks like "prev" epoch_id

  const epoch = new EpochInfo(prevBlock, firstBlock, lastBlock);
  // console.log("estimated epoch duration in hours:", epoch.duration_ms / HOURS)
  // console.log("Epoch started:", epoch.start_dtm.toString(), " => ", asHM(epoch.hours_from_start()), "hs ago")
  // console.log("Epoch ends:", epoch.ends_dtm.toString(), " => in ", asHM(epoch.hours_to_end()), "hs")

  return epoch;
}

export class EpochInfo {
  public length: number;
  public duration_ms: number;
  public prev_timestamp: number;
  public start_block_height: number;
  public start_timestamp: number;
  public last_block_timestamp: number;
  public start_dtm: Date;
  public advance: number; //0-1
  public duration_till_now_ms: number;
  public ends_dtm: Date;

  constructor(prevBlock: BlockInfo, startBlock: BlockInfo, lastBlock: BlockInfo) {

    this.prev_timestamp = Math.round(prevBlock.header.timestamp / 1e6)
    this.start_block_height = startBlock.header.height
    this.start_timestamp = Math.round(startBlock.header.timestamp / 1e6)
    this.last_block_timestamp = Math.round(lastBlock.header.timestamp / 1e6)

    if (this.start_timestamp < new Date().getTime() - 48 * HOURS) { //genesis or hard-fork
      this.start_timestamp = new Date().getTime() - 6 * HOURS
    }
    if (this.prev_timestamp < new Date().getTime() - 48 * HOURS) { //genesis or hard-fork
      this.prev_timestamp = new Date().getTime() - 12 * HOURS
    }

    let noPrevBloc = startBlock.header.height == prevBlock.header.height;
    this.length = startBlock.header.height - prevBlock.header.height
    if (this.length == 0) { //!prevBlock, genesis or hard-fork
      this.length = 43200;
      this.duration_ms = 12 * HOURS;
      //estimated start & prev timestamps
      this.advance = Math.round(Number(((BigInt(lastBlock.header.height) - BigInt(this.start_block_height)) * BigInt(1000000)) / BigInt(this.length))) / 1000000;
      this.start_timestamp = this.last_block_timestamp - this.duration_ms * this.advance
      this.prev_timestamp = this.start_timestamp - this.duration_ms
    }
    else {

      this.duration_ms = this.start_timestamp - this.prev_timestamp
    }

    this.start_dtm = new Date(this.start_timestamp)
    this.ends_dtm = new Date(this.start_timestamp + this.duration_ms)
    this.duration_till_now_ms = this.last_block_timestamp - this.start_timestamp
    this.advance = this.update(lastBlock);

  }

  update(lastBlock: BlockInfo): number {
    this.last_block_timestamp = Math.round(lastBlock.header.timestamp / 1e6)
    const duration_till_now_ms = this.last_block_timestamp - this.start_timestamp
    const advance = Math.round(Number(((BigInt(lastBlock.header.height) - BigInt(this.start_block_height)) * BigInt(1000000)) / BigInt(this.length))) / 1000000;
    if (advance > 0.1) {
      this.ends_dtm = new Date(this.start_timestamp + duration_till_now_ms + duration_till_now_ms * (1 - advance))
    }
    this.duration_till_now_ms = duration_till_now_ms;
    this.advance = advance;
    return advance;
  }

  proportion(blockNum: number) {
    return (blockNum - this.start_block_height) / this.length;
  }

  block_dtm(blockNum: number): Date {
    return new Date(this.start_timestamp + this.duration_ms * this.proportion(blockNum))
  }

  hours_from_start(): number {
    return Math.round((new Date().getTime() - this.start_timestamp) / HOURS * 100) / 100;
  }

  hours_to_end(): number {
    return Math.round((this.start_timestamp + this.duration_ms - new Date().getTime()) / HOURS * 100) / 100;
  }
}

