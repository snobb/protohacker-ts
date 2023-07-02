export const HEADER_SIZE = 5;

export const msgType = {
    'hello': 0x50,
    'error': 0x51,
    'ok': 0x52,
    'dial_auth': 0x53,
    'targetPopulations': 0x54,
    'createPolicy': 0x55,
    'deletePolicy': 0x56,
    'policyResult': 0x57,
    'siteVisit': 0x58
};

export type Payload = {
    kind: number,
    payload: Buffer
};
