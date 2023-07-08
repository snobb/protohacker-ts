import { MsgError } from './error';
import { Payload } from '../types';

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
