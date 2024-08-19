export interface ABIInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIInput[];
}

export interface ABIItem {
  inputs: ABIInput[] | never[];
  type: string;
  name?: string;
  payable?: boolean;
  stateMutability?: string;
  anonymous?: boolean;
  constant?: boolean;
  outputs?: unknown;
}

export interface DecodedParam {
  name: string;
  value: any;
  type: string;
}

export interface DecodedMethod {
  name: string;
  params: DecodedParam[];
}

export interface DecodedLog {
  events: DecodedParam[];
  address: string;
  name?: string;
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
}
