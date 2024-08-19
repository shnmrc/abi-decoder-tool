import { Web3 } from "web3";

import BN from "bn.js";
import {
  ABIInput,
  ABIItem,
  DecodedLog,
  DecodedMethod,
  DecodedParam,
  LogEntry,
} from "./types.js";

export class AbiDecoder {
  private savedABIs: ABIItem[] = [];
  private methodIDs: { [key: string]: ABIItem } = {};
  private keepLogs: boolean = false;
  private decoder = new Web3();

  addABI(abiArray: ABIItem[]): void {
    if (!Array.isArray(abiArray))
      throw new Error("Expected ABI array, got " + typeof abiArray);

    abiArray.forEach((abi) => {
      if (abi.name) {
        const signature = this.decoder.utils.sha3(
          abi.name + "(" + abi.inputs.map(this._typeToString).join(",") + ")",
        );
        if (signature) {
          const key =
            abi.type === "event" ? signature.slice(2) : signature.slice(2, 10);
          this.methodIDs[key] = abi;
        }
      }
    });

    this.savedABIs = [...this.savedABIs, ...abiArray];
  }

  removeABI(abiArray: ABIItem[]): void {
    if (!Array.isArray(abiArray)) {
      throw new Error("Expected ABI array, got " + typeof abiArray);
    }

    const signaturesToRemove = new Set<string>();

    abiArray.forEach((abi) => {
      if (abi.name) {
        const signature = this.decoder.utils.sha3(
          abi.name +
            "(" +
            abi.inputs.map((input) => input.type).join(",") +
            ")",
        );
        if (signature) {
          const key =
            abi.type === "event" ? signature.slice(2) : signature.slice(2, 10);
          signaturesToRemove.add(key);
        }
      }
    });

    signaturesToRemove.forEach((key) => {
      delete this.methodIDs[key];
    });

    this.savedABIs = this.savedABIs.filter((abi) => {
      const signature = this.decoder.utils.sha3(
        abi.name + "(" + abi.inputs.map((input) => input.type).join(",") + ")",
      );

      const key =
        // @ts-ignore
        abi.type === "event" ? signature.slice(2) : signature.slice(2, 10);
      return !signaturesToRemove.has(key);
    });
  }

  getABIs(): ABIItem[] {
    return this.savedABIs;
  }

  getMethodIDs(): { [key: string]: ABIItem } {
    return this.methodIDs;
  }

  decodeMethod(data: string): DecodedMethod | undefined {
    const methodID = data.slice(2, 10);
    const abiItem = this.methodIDs[methodID];
    if (!abiItem) return;

    try {
      const decoded = this.decoder.eth.abi.decodeParameters(
        abiItem.inputs,
        data.slice(10),
      );
      const params = abiItem.inputs.map((input, i) => {
        let value = decoded[i];
        if (input.type.startsWith("uint") || input.type.startsWith("int")) {
          value = Array.isArray(value)
            ? value.map((val) => BigInt(val).toString())
            : BigInt(value as string).toString();
        } else if (input.type.startsWith("address")) {
          value = Array.isArray(value)
            ? value.map((val) => val.toLowerCase())
            : String(value).toLowerCase();
        }
        return { name: input.name, value, type: input.type };
      });

      return { name: abiItem.name ?? "", params };
    } catch (error) {
      console.error("Error decoding method:", error);
      return;
    }
  }

  decodeLogs(logs: LogEntry[]): (DecodedLog | undefined)[] {
    return logs
      .filter((log) => log.topics.length > 0)
      .map((logItem) => {
        const methodID = logItem.topics[0].slice(2);
        const method = this.methodIDs[methodID];

        if (method) {
          const logData = logItem.data;
          let decodedParams: DecodedParam[] = [];
          let dataIndex = 0;
          let topicsIndex = 1;

          let dataTypes: string[] = [];
          method.inputs.forEach((input) => {
            if (!input.indexed) {
              dataTypes.push(input.type);
            }
          });

          // Decode parameters from log data
          const decodedData = this.decoder.eth.abi.decodeParameters(
            dataTypes,
            logData.slice(2),
          );

          // Loop through topics and data to get the parameters
          method.inputs.forEach((param) => {
            let decodedP: DecodedParam = {
              name: param.name,
              type: param.type,
              value: "",
            };

            if (param.indexed) {
              decodedP.value = logItem.topics[topicsIndex];
              topicsIndex++;
            } else {
              decodedP.value = String(decodedData[dataIndex]); // Ensure value is a string
              dataIndex++;
            }

            // Process address type
            if (param.type === "address") {
              decodedP.value = decodedP.value.toLowerCase();
              if (decodedP.value.length > 42) {
                decodedP.value = "0x" + decodedP.value.slice(-40);
              }
            }

            // Process uint256, uint8, and int types
            if (param.type.startsWith("uint") || param.type.startsWith("int")) {
              if (
                typeof decodedP.value === "string" &&
                decodedP.value.startsWith("0x")
              ) {
                decodedP.value = new BN(decodedP.value.slice(2), 16).toString(
                  10,
                );
              } else {
                decodedP.value = new BN(decodedP.value).toString(10);
              }
            }

            decodedParams.push(decodedP);
          });

          return {
            name: method.name,
            events: decodedParams,
            address: logItem.address,
          };
        }
        return; // Return undefined if method is not found
      })
      .filter((decoded) => this.keepLogs || decoded);
  }

  keepNonDecodedLogs(): void {
    this.keepLogs = true;
  }

  discardNonDecodedLogs(): void {
    this.keepLogs = false;
  }

  private _typeToString(input: ABIInput): string {
    return input.type === "tuple"
      ? "(" + input.components!.map(this._typeToString).join(",") + ")"
      : input.type;
  }
}
