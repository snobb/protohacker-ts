import {
    MsgCreatePolicy,
    MsgDeletePolicy,
    MsgDialAuth,
    MsgError,
    MsgPolicyResult,
    MsgSiteVisit,
    MsgTargetPopulations,
    Payload,
    msgType,
    policyAction,
} from '.';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { log } from '../../lib/log';

export class LoggerStream extends Transform {
    constructor (private clientId: string, private pfx: string, opts?: TransformOptions) {
        super({ ...opts, readableObjectMode: true, writableObjectMode: true });
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        log.debug(this.clientId, this.pfx, this.getMessage(data));
        this.push(data);
        done();
    }

    getMessage (data: Payload) {
        let msg: string;
        if (data.kind === msgType.hello) {
            msg = 'kind:hello';

        } else if (data.kind === msgType.error) {
            const mm = new MsgError('').fromPayload(data);
            msg = `kind:error, error:${mm.message}`;

        } else if (data.kind === msgType.ok) {
            msg = 'kind:ok';

        } else if (data.kind === msgType.dialAuth) {
            const mm = new MsgDialAuth(0).fromPayload(data);
            msg = `kind:dialAuth, site:${mm.site}`;

        } else if (data.kind === msgType.targetPopulations) {
            const mm = new MsgTargetPopulations().fromPayload(data);
            msg = `kind:targetPopulations, site:${mm.site}, populations:${JSON.stringify(mm.populations)}`;

        } else if (data.kind === msgType.createPolicy) {
            const mm = new MsgCreatePolicy('', 0).fromPayload(data);
            let action = 'invalid';
            if (mm.action === policyAction.conserve) {
                action = 'conserve';
            } else if (mm.action === policyAction.cull) {
                action = 'cull';
            }

            msg = `kind:createPolicy, species:${mm.species}, action:${action}`;

        } else if (data.kind === msgType.deletePolicy) {
            const mm = new MsgDeletePolicy(0).fromPayload(data);
            msg = `kind:deletePolicy, policy:${mm.policy}`;

        } else if (data.kind === msgType.policyResult) {
            const mm = new MsgPolicyResult().fromPayload(data);
            msg = `kind:policyResult, policy:${mm.policy}`;

        } else if (data.kind === msgType.siteVisit) {
            const mm = new MsgSiteVisit().fromPayload(data);
            msg = `kind:siteVisit, site:${mm.site}, populations:${JSON.stringify(mm.populations)}`;

        } else {
            msg = `Invalid message type: ${data.kind}`;
        }

        return msg;
    }
}
