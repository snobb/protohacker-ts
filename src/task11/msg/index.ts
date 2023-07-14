import { MsgError } from './error';

export { FrameReaderStream } from './frame-reader-stream';
export { FrameWriterStream } from './frame-writer-stream';
export { LoggerStream } from './logger-stream';
export { MsgHello } from './hello';
export { MsgError } from './error';
export { MsgOk } from './ok';
export { MsgDialAuth } from './dial-auth';
export { MsgTargetPopulations, TargetSpecies, SpeciesRange } from './target-populations';
export { MsgCreatePolicy, policyAction } from './create-policy';
export { MsgDeletePolicy } from './delete-policy';
export { MsgPolicyResult } from './policy-result';
export { MsgSiteVisit, ObservedSpecies } from './site-visit';

export const HEADER_SIZE = 5;

export type Payload = {
    kind: number,
    payload: Buffer
};

export const enum msgType {
    hello = 0x50,
    error = 0x51,
    ok = 0x52,
    dialAuth = 0x53,
    targetPopulations = 0x54,
    createPolicy = 0x55,
    deletePolicy = 0x56,
    policyResult = 0x57,
    siteVisit = 0x58
}

export interface Encodable {
    toPayload(): Payload
}

export interface Decodable {
    fromPayload(data: Payload): this
}

export function newError (err: Error | string) {
    const msg = (err instanceof Error) ? err.message : err;
    return new MsgError(msg);
}
