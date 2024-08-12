export interface ABIInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIInput[];
}

export interface ABIItem {
  inputs: ABIInput[];
  name: string;
  type: string;
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
  name: string;
  events: DecodedParam[];
  address: string;
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
}
