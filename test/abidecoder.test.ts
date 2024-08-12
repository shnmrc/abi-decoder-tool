import { AbiDecoder } from "../src/index";
import { ABIItem } from "../src/types";

const testABI = [
  {
    inputs: [{ type: "address", name: "" }],
    constant: true,
    name: "isInstantiation",
    payable: false,
    outputs: [{ type: "bool", name: "" }],
    type: "function",
  },
  {
    inputs: [
      { type: "address[]", name: "_owners" },
      { type: "uint256", name: "_required" },
      { type: "uint256", name: "_dailyLimit" },
    ],
    constant: false,
    name: "create",
    payable: false,
    outputs: [{ type: "address", name: "wallet" }],
    type: "function",
  },
  {
    inputs: [
      { type: "address", name: "" },
      { type: "uint256", name: "" },
    ],
    constant: true,
    name: "instantiations",
    payable: false,
    outputs: [{ type: "address", name: "" }],
    type: "function",
  },
  {
    inputs: [{ type: "address", name: "creator" }],
    constant: true,
    name: "getInstantiationCount",
    payable: false,
    outputs: [{ type: "uint256", name: "" }],
    type: "function",
  },
  {
    inputs: [
      { indexed: false, type: "address", name: "sender" },
      { indexed: false, type: "address", name: "instantiation" },
    ],
    type: "event",
    name: "ContractInstantiation",
    anonymous: false,
  },
];
const sampleABI: ABIItem[] = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
];
const v3pairabi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount0",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount1",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint160",
        name: "sqrtPriceX96",
        type: "uint160",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "liquidity",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "int24",
        name: "tick",
        type: "int24",
      },
    ],
    name: "Swap",
    type: "event",
  },
];

describe("AbiDecoder Functions Tests", () => {
  let abiDecoder: AbiDecoder;
  beforeEach(() => {
    abiDecoder = new AbiDecoder();
  });

  test("adds ABI items correctly", () => {
    abiDecoder.addABI(sampleABI);
    expect(abiDecoder.getABIs()).toEqual(sampleABI);
  });

  test("removes ABI items correctly", () => {
    abiDecoder.addABI(sampleABI);
    abiDecoder.removeABI(sampleABI);
    expect(abiDecoder.getABIs()).toEqual([]);
  });

  test("decodes method data correctly", () => {
    abiDecoder.addABI(testABI);

    const testData =
      "0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa";

    const decodedData = abiDecoder.decodeMethod(testData);

    expect(decodedData).toBeDefined();
    expect(decodedData).toHaveProperty("name");
    expect(decodedData).toHaveProperty("params");

    if (decodedData) {
      expect(typeof decodedData.name).toBe("string");
      expect(Array.isArray(decodedData.params)).toBe(true);
      expect(decodedData.params).toHaveLength(3);

      // Detailed value assertions
      expect(decodedData.params[0]).toMatchObject({
        name: "_owners",
        type: "address[]",
        value: expect.arrayContaining([
          expect.stringMatching(/^0x[0-9a-fA-F]{40}$/),
          expect.stringMatching(/^0x[0-9a-fA-F]{40}$/),
        ]),
      });

      expect(decodedData.params[1]).toMatchObject({
        name: "_required",
        type: "uint256",
        value: "1",
      });

      expect(decodedData.params[2]).toMatchObject({
        name: "_dailyLimit",
        type: "uint256",
        value: "0",
      });
    }
  });

  test("decodes logs correctly", () => {
    abiDecoder.addABI(v3pairabi);
    const logs = [
      {
        address: "0x11b815efB8f581194ae79006d24E0d814B7697F6",
        topics: [
          "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
          "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
          "0x000000000000000000000000fe0c760cbcb9da239b9ba805f0aeaed3be84f65a",
        ],
        data: "0x0000000000000000000000000000000000000000000000004c8f783b77a889ebfffffffffffffffffffffffffffffffffffffffffffffffffffffffca0549fe6000000000000000000000000000000000000000000035be0a53af3708d5674e40000000000000000000000000000000000000000000000000a309e63a4a097affffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcfc2f",
      },
    ];
    const decodedLogs = abiDecoder.decodeLogs(logs);
    expect(decodedLogs).toEqual([
      {
        name: "Swap",
        events: [
          {
            name: "sender",
            type: "address",
            value: "0xe592427a0aece92de3edee1f18e0157c05861564",
          },
          {
            name: "recipient",
            type: "address",
            value: "0xfe0c760cbcb9da239b9ba805f0aeaed3be84f65a",
          },
          { name: "amount0", type: "int256", value: "5516760265358084587" },
          { name: "amount1", type: "int256", value: "-14489968666" },
          {
            name: "sqrtPriceX96",
            type: "uint160",
            value: "4060656785553765818594532",
          },
          { name: "liquidity", type: "uint128", value: "734260890062329775" },
          { name: "tick", type: "int24", value: "-197585" },
        ],
        address: "0x11b815efB8f581194ae79006d24E0d814B7697F6",
      },
    ]);
  });

  test("keeps non-decoded logs when keepLogs is true", () => {
    abiDecoder.keepNonDecodedLogs();
    const logs = [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        topics: [],
        data: "0x",
      },
    ];
    const decodedLogs = abiDecoder.decodeLogs(logs);
    expect(decodedLogs).toEqual([undefined]);
  });

  test("discards non-decoded logs when keepLogs is false", () => {
    abiDecoder.discardNonDecodedLogs();
    const logs = [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        topics: [],
        data: "0x",
      },
    ];
    const decodedLogs = abiDecoder.decodeLogs(logs);
    expect(decodedLogs).toEqual([]);
  });
});
