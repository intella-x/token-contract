/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { randomInt } from 'crypto';
import { BigNumber, Contract } from 'ethers';
import { keccak256, solidityPack, defaultAbiCoder, toUtf8Bytes } from 'ethers/lib/utils';
import { RootContract, ChildContract } from '../config';

export function randomBigNumber(minBig: BigNumber, maxBig: BigNumber): BigNumber {
  const bigintstr = maxBig.toHexString().substring(2);
  let buffer = '0x0';
  for (let i = bigintstr.search(/[1-9a-f]/) + 1; i < bigintstr.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    const byte: number = parseInt(bigintstr[i], 16) ^ randomInt(0, 16);
    buffer += byte.toString(16);
  }
  return BigNumber.from(buffer).lt(minBig) ? minBig : BigNumber.from(buffer);
}

export async function getApprovalDigest(
  token: Contract,
  approve: {
    owner: string;
    spender: string;
    value: BigNumber;
  },
  nonce: BigNumber,
  deadline: BigNumber,
): Promise<string> {
  const PERMIT_TYPEHASH = keccak256(
    toUtf8Bytes(
      'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)',
    ),
  );
  const DOMAIN_SEPARATOR = await token.DOMAIN_SEPARATOR();
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline],
          ),
        ),
      ],
    ),
  );
}

export function isRootToken(
  token: RootContract | ChildContract,
  contract: string,
): token is RootContract {
  if (contract.startsWith('Polygon')) {
    return false;
  }
  return true;
}
